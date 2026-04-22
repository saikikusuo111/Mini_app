from dataclasses import dataclass
import sqlite3

from app.api.errors import api_error
from app.core.security import generate_session_token, hash_token
from app.core.settings import settings
from app.repositories.auth_repo import create_auth_session
from app.repositories.users_repo import upsert_user


@dataclass
class TelegramIdentity:
    tg_user_id: int
    username: str | None
    first_name: str | None
    last_name: str | None = None
    language_code: str | None = None


def _resolve_dev_identity() -> TelegramIdentity:
    return TelegramIdentity(
        tg_user_id=settings.dev_fake_tg_user_id,
        username=settings.dev_fake_tg_username,
        first_name=settings.dev_fake_tg_first_name,
        last_name=None,
        language_code='ru',
    )


def validate_or_stub_init_data(init_data: str) -> TelegramIdentity:
    if settings.dev_allow_fake_telegram:
        return _resolve_dev_identity()

    raise api_error(
        code='TELEGRAM_AUTH_NOT_IMPLEMENTED',
        message='Реальная валидация Telegram initData ещё не реализована',
        details={'todo': 'Implement Telegram initData validation in app/services/telegram_auth_service.py'},
        status_code=501,
    )


def build_entitlement_snapshot() -> dict:
    return {
        'plan': 'free',
        'status': 'active',
        'daily_limit': settings.free_daily_limit,
        'remaining_today': settings.free_daily_limit,
        'history_depth_limit': settings.free_history_depth,
    }


def authenticate(conn: sqlite3.Connection, init_data: str) -> dict:
    identity = validate_or_stub_init_data(init_data)

    user = upsert_user(
        conn,
        tg_user_id=identity.tg_user_id,
        username=identity.username,
        first_name=identity.first_name,
        last_name=identity.last_name,
        language_code=identity.language_code,
    )

    raw_token = generate_session_token()
    token_hash = hash_token(raw_token)
    create_auth_session(
        conn,
        user_id=user['id'],
        token_hash=token_hash,
        ttl_hours=settings.session_token_ttl_hours,
    )

    return {
        'user': {
            'id': user['id'],
            'tg_user_id': user['tg_user_id'],
            'username': user['username'],
            'first_name': user['first_name'],
        },
        'session_token': raw_token,
        'entitlement': build_entitlement_snapshot(),
    }
