import sqlite3
from datetime import datetime, timezone

from app.api.errors import api_error
from app.core.security import hash_token
from app.repositories.sessions_repo import (
    create_decision_session,
    get_decision_session,
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
    user_id = resolve_user_id_from_session_token(conn, raw_session_token)
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
