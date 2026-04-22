import sqlite3
from datetime import datetime, timezone

from app.api.errors import api_error
from app.core.security import hash_token
from app.repositories.sessions_repo import create_decision_session


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
