# backend/app/services/session_service.py
import sqlite3
from datetime import datetime, timezone

from app.api.errors import api_error
from app.core.security import hash_token
from app.repositories.sessions_repo import (
    complete_decision_session,
    create_decision_session,
    get_decision_session,
    list_session_answers,
    set_session_tiebreaker,
    update_current_question_order,
    upsert_session_answer,
)
from app.services.flow_config_service import load_purchase_flow


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def resolve_user_id_from_session_token(conn: sqlite3.Connection, raw_token: str) -> str:
    token_hash = hash_token(raw_token)
    row = conn.execute(
        '''
        SELECT a.user_id, a.expires_at
        FROM auth_sessions a
        WHERE a.session_token = ?
        ORDER BY a.created_at DESC
        LIMIT 1
        ''',
        (token_hash,),
    ).fetchone()

    if not row:
        raise api_error(
            code='AUTH_SESSION_INVALID',
            message='Сессия не найдена или недействительна',
            status_code=401,
        )

    if row['expires_at'] < _utc_now():
        raise api_error(
            code='AUTH_SESSION_EXPIRED',
            message='Сессия истекла',
            status_code=401,
        )

    return row['user_id']


def start_session(
    conn: sqlite3.Connection,
    *,
    raw_session_token: str,
    item_name: str,
    item_price: float,
) -> dict:
    user_id = resolve_user_id_from_session_token(conn, raw_token=raw_session_token)
    session = create_decision_session(
        conn,
        user_id=user_id,
        item_name=item_name.strip(),
        item_price=item_price,
    )

    return {
        'session_id': session['id'],
        'flow_type': session['flow_type'],
        'started_at': session['started_at'],
        'current_question_order': session['current_question_order'],
    }


def _resolve_question(flow: dict, *, question_id: str, question_order: int) -> dict:
    matched_question = next((q for q in flow['questions'] if q['id'] == question_id), None)
    if not matched_question:
        raise api_error(
            code='QUESTION_NOT_FOUND',
            message='Вопрос не найден в активном flow',
            status_code=404,
        )

    if matched_question['order'] != question_order:
        raise api_error(
            code='QUESTION_ORDER_MISMATCH',
            message='question_order не совпадает с question_id',
            details={'expected_order': matched_question['order']},
            status_code=400,
        )

    return matched_question


def submit_session_answer(
    conn: sqlite3.Connection,
    *,
    session_id: str,
    question_id: str,
    question_order: int,
    answer_value: int,
) -> dict:
    session = get_decision_session(conn, session_id=session_id)
    if not session:
        raise api_error(
            code='SESSION_NOT_FOUND',
            message='Сессия не найдена',
            status_code=404,
        )

    flow = load_purchase_flow()
    _resolve_question(flow, question_id=question_id, question_order=question_order)

    upsert_session_answer(
        conn,
        session_id=session_id,
        question_id=question_id,
        question_order=question_order,
        answer_value=answer_value,
    )

    next_question_order = question_order + 1
    update_current_question_order(
        conn,
        session_id=session_id,
        question_order=next_question_order,
    )
    conn.commit()

    return {
        'ok': True,
        'session_id': session_id,
        'current_question_order': next_question_order,
    }


def _compute_preliminary_result(*, flow: dict, answers_by_question_id: dict[str, int]) -> dict:
    score_for = 0.0
    score_against = 0.0

    for question in flow['questions']:
        value = answers_by_question_id[question['id']]
        weight = float(question.get('weight', 1))
        contribution = float(value) * weight

        if question.get('polarity') == 'loss':
            score_against += contribution
        else:
            score_for += contribution

    diff = score_for - score_against
    total = score_for + score_against
    diff_percent = 0.0 if total == 0 else abs(diff) / total * 100

    threshold = float(flow.get('tie_breaker_threshold_percent', 0))
    needs_tiebreaker = diff_percent < threshold

    if needs_tiebreaker:
        preliminary_verdict = 'tiebreaker_required'
    elif diff > 0:
        preliminary_verdict = 'buy'
    elif diff < 0:
        preliminary_verdict = 'skip'
    else:
        preliminary_verdict = 'tiebreaker_required'

    return {
        'preliminary_score_for': round(score_for, 4),
        'preliminary_score_against': round(score_against, 4),
        'preliminary_diff': round(diff, 4),
        'preliminary_diff_percent': round(diff_percent, 2),
        'needs_tiebreaker': needs_tiebreaker,
        'preliminary_verdict': preliminary_verdict,
    }


TIEBREAKER_OPTIONS = {
    'buy_now': {
        'value': 4,
        'final_verdict': 'buy_now',
        'final_verdict_label': 'Покупать сейчас',
    },
    'wait_24h': {
        'value': 3,
        'final_verdict': 'wait_24h',
        'final_verdict_label': 'Подождать 24 часа',
    },
    'find_alternative': {
        'value': 2,
        'final_verdict': 'find_alternative',
        'final_verdict_label': 'Искать альтернативу',
    },
    'skip_purchase': {
        'value': 1,
        'final_verdict': 'skip_purchase',
        'final_verdict_label': 'Не покупать',
    },
}


def _resolve_math_final_verdict(preliminary_verdict: str) -> tuple[str, str]:
    if preliminary_verdict == 'buy':
        return 'buy_now', 'Покупать сейчас'
    if preliminary_verdict == 'skip':
        return 'skip_purchase', 'Не покупать'
    return 'tiebreaker_required', 'Требуется tie-breaker'


def finalize_session(conn: sqlite3.Connection, *, session_id: str) -> dict:
    session = get_decision_session(conn, session_id=session_id)
    if not session:
        raise api_error(
            code='SESSION_NOT_FOUND',
            message='Сессия не найдена',
            status_code=404,
        )

    flow = load_purchase_flow()
    answers = list_session_answers(conn, session_id=session_id)
    answers_by_question_id = {row['question_id']: row['answer_value'] for row in answers}

    missing_questions = [
        {'question_id': q['id'], 'question_order': q['order']}
        for q in flow['questions']
        if q['id'] not in answers_by_question_id
    ]
    if missing_questions:
        raise api_error(
            code='SESSION_INCOMPLETE',
            message='Нельзя завершить сессию: не на все вопросы даны ответы',
            details={'missing_questions': missing_questions},
            status_code=409,
        )

    result = _compute_preliminary_result(
        flow=flow,
        answers_by_question_id=answers_by_question_id,
    )
    complete_decision_session(
        conn,
        session_id=session_id,
        score_for=result['preliminary_score_for'],
        score_against=result['preliminary_score_against'],
        diff=result['preliminary_diff'],
        diff_percent=result['preliminary_diff_percent'],
        needs_tiebreaker=result['needs_tiebreaker'],
    )
    conn.commit()

    final_verdict, final_verdict_label = _resolve_math_final_verdict(result['preliminary_verdict'])

    return {
        'session_id': session_id,
        **result,
        'final_verdict': final_verdict,
        'final_verdict_label': final_verdict_label,
        'used_tiebreaker': False,
        'tiebreaker_option_id': None,
        'result_basis': 'preliminary_math',
    }


def submit_session_tiebreaker(conn: sqlite3.Connection, *, session_id: str, option_id: str) -> dict:
    session = get_decision_session(conn, session_id=session_id)
    if not session:
        raise api_error(
            code='SESSION_NOT_FOUND',
            message='Сессия не найдена',
            status_code=404,
        )

    if not bool(session['needs_tiebreaker']):
        raise api_error(
            code='TIEBREAKER_NOT_REQUIRED',
            message='Для этой сессии tie-breaker не требуется',
            status_code=409,
        )

    option_meta = TIEBREAKER_OPTIONS.get(option_id)
    if option_meta is None:
        raise api_error(
            code='TIEBREAKER_OPTION_INVALID',
            message='Передана некорректная tie-breaker опция',
            details={'allowed_options': list(TIEBREAKER_OPTIONS.keys())},
            status_code=400,
        )

    set_session_tiebreaker(
        conn,
        session_id=session_id,
        tiebreaker_value=option_meta['value'],
        verdict=option_meta['final_verdict'],
        verdict_label=option_meta['final_verdict_label'],
    )
    conn.commit()

    return {
        'session_id': session_id,
        'preliminary_score_for': float(session['preliminary_score_for'] or 0),
        'preliminary_score_against': float(session['preliminary_score_against'] or 0),
        'preliminary_diff': float(session['preliminary_diff'] or 0),
        'preliminary_diff_percent': float(session['preliminary_diff_percent'] or 0),
        'needs_tiebreaker': False,
        'preliminary_verdict': 'tiebreaker_required',
        'final_verdict': option_meta['final_verdict'],
        'final_verdict_label': option_meta['final_verdict_label'],
        'used_tiebreaker': True,
        'tiebreaker_option_id': option_id,
        'result_basis': 'tiebreaker_choice',
    }
