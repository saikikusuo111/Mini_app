import sqlite3

from fastapi import APIRouter, Depends

from app.core.db import get_db
from app.schemas.auth import TelegramAuthRequest, TelegramAuthResponse
from app.services.telegram_auth_service import authenticate

router = APIRouter()


@router.post('/telegram', response_model=TelegramAuthResponse)
def auth_telegram(
    payload: TelegramAuthRequest,
    conn: sqlite3.Connection = Depends(get_db),
):
    return authenticate(conn, payload.init_data)
