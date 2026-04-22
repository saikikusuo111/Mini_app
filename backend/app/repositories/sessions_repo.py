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
