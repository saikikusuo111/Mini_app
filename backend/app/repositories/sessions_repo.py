# backend/app/repositories/sessions_repo.py
import sqlite3
import uuid
from datetime import datetime, timezone


FLOW_TYPE = 'purchase_v1'
SCORING_VERSION = 'v1.0.0'


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def create_decision_session(
    conn: sqlite3.Connection,
    *,
    user_id: str,
    item_name: str,
    item_price: float,
) -> sqlite3.Row:
    session_id = f'ses_{uuid.uuid4().hex[:12]}'
    now = utc_now()

    conn.execute(
        '''
        INSERT INTO decision_sessions (
          id, user_id, flow_type, item_name, item_price, status,
          current_question_order, started_at, updated_at, scoring_version
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (
            session_id,
            user_id,
            FLOW_TYPE,
            item_name,
            item_price,
            'draft',
            1,
            now,
            now,
            SCORING_VERSION,
        ),
    )
    conn.commit()

    return conn.execute(
        'SELECT * FROM decision_sessions WHERE id = ?',
        (session_id,),
    ).fetchone()


def get_decision_session(conn: sqlite3.Connection, *, session_id: str) -> sqlite3.Row | None:
    return conn.execute(
        'SELECT * FROM decision_sessions WHERE id = ?',
        (session_id,),
    ).fetchone()


def upsert_session_answer(
    conn: sqlite3.Connection,
    *,
    session_id: str,
    question_id: str,
    question_order: int,
    answer_value: int,
) -> None:
    answer_id = f'ans_{uuid.uuid4().hex[:12]}'
    now = utc_now()
    conn.execute(
        '''
        INSERT INTO session_answers (
          id, session_id, question_id, question_order, answer_value,
          contribution, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id, question_id)
        DO UPDATE SET
          question_order = excluded.question_order,
          answer_value = excluded.answer_value,
          updated_at = excluded.updated_at
        ''',
        (answer_id, session_id, question_id, question_order, answer_value, None, now, now),
    )


def update_current_question_order(conn: sqlite3.Connection, *, session_id: str, question_order: int) -> None:
    conn.execute(
        '''
        UPDATE decision_sessions
        SET current_question_order = ?, updated_at = ?
        WHERE id = ?
        ''',
        (question_order, utc_now(), session_id),
    )


def list_session_answers(conn: sqlite3.Connection, *, session_id: str) -> list[sqlite3.Row]:
    return conn.execute(
        '''
        SELECT question_id, question_order, answer_value
        FROM session_answers
        WHERE session_id = ?
        ORDER BY question_order ASC
        ''',
        (session_id,),
    ).fetchall()


def complete_decision_session(
    conn: sqlite3.Connection,
    *,
    session_id: str,
    score_for: float,
    score_against: float,
    diff: float,
    diff_percent: float,
    needs_tiebreaker: bool,
) -> None:
    conn.execute(
        '''
        UPDATE decision_sessions
        SET
          status = ?,
          completed_at = ?,
          updated_at = ?,
          preliminary_score_for = ?,
          preliminary_score_against = ?,
          preliminary_diff = ?,
          preliminary_diff_percent = ?,
          needs_tiebreaker = ?
        WHERE id = ?
        ''',
        (
            'pre_result',
            utc_now(),
            utc_now(),
            score_for,
            score_against,
            diff,
            diff_percent,
            int(needs_tiebreaker),
            session_id,
        ),
    )


def set_session_tiebreaker(
    conn: sqlite3.Connection,
    *,
    session_id: str,
    tiebreaker_value: int,
    verdict: str,
    verdict_label: str,
) -> None:
    conn.execute(
        '''
        UPDATE decision_sessions
        SET
          needs_tiebreaker = 0,
          updated_at = ?
        WHERE id = ?
        ''',
        (utc_now(), session_id),
    )

    conn.execute(
        '''
        INSERT INTO decisions (
          id, user_id, session_id, flow_type, item_name, item_price, verdict, verdict_label,
          score_for, score_against, diff, diff_percent, used_tiebreaker, tiebreaker_value,
          scoring_version, created_at
        )
        SELECT
          ?, user_id, id, flow_type, item_name, item_price, ?, ?,
          preliminary_score_for, preliminary_score_against, preliminary_diff, preliminary_diff_percent,
          1, ?, scoring_version, ?
        FROM decision_sessions
        WHERE id = ?
        ON CONFLICT(session_id)
        DO UPDATE SET
          verdict = excluded.verdict,
          verdict_label = excluded.verdict_label,
          used_tiebreaker = excluded.used_tiebreaker,
          tiebreaker_value = excluded.tiebreaker_value
        ''',
        (
            f'dec_{uuid.uuid4().hex[:12]}',
            verdict,
            verdict_label,
            tiebreaker_value,
            utc_now(),
            session_id,
        ),
    )
