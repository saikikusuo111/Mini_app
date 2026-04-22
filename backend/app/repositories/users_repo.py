import sqlite3
import uuid
from datetime import datetime, timezone


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_user_by_tg_id(conn: sqlite3.Connection, tg_user_id: int):
    return conn.execute(
        'SELECT * FROM users WHERE tg_user_id = ?',
        (tg_user_id,),
    ).fetchone()


def upsert_user(
    conn: sqlite3.Connection,
    *,
    tg_user_id: int,
    username: str | None,
    first_name: str | None,
    last_name: str | None = None,
    language_code: str | None = None,
) -> sqlite3.Row:
    existing = get_user_by_tg_id(conn, tg_user_id)
    now = utc_now()

    if existing:
        conn.execute(
            '''
            UPDATE users
            SET username = ?, first_name = ?, last_name = ?, language_code = ?, updated_at = ?, last_seen_at = ?
            WHERE tg_user_id = ?
            ''',
            (username, first_name, last_name, language_code, now, now, tg_user_id),
        )
        conn.commit()
        return get_user_by_tg_id(conn, tg_user_id)

    user_id = f'usr_{uuid.uuid4().hex[:12]}'
    conn.execute(
        '''
        INSERT INTO users (id, tg_user_id, username, first_name, last_name, language_code, created_at, updated_at, last_seen_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (user_id, tg_user_id, username, first_name, last_name, language_code, now, now, now),
    )
    conn.commit()
    return get_user_by_tg_id(conn, tg_user_id)
