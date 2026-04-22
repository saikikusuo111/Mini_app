import sqlite3
from collections.abc import Generator

from app.core.settings import settings


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.sqlite_abs_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON;')
    return conn


def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()
