import sqlite3
import uuid
from datetime import datetime, timedelta, timezone


def create_auth_session(
    conn: sqlite3.Connection,
    *,
    user_id: str,
    token_hash: str,
    ttl_hours: int,
) -> str:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=ttl_hours)
    session_id = f'auth_{uuid.uuid4().hex[:12]}'

    conn.execute(
        '''
        INSERT INTO auth_sessions (id, user_id, session_token, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
        ''',
        (session_id, user_id, token_hash, now.isoformat(), expires_at.isoformat()),
    )
    conn.commit()
    return session_id
