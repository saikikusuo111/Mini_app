import sqlite3

from fastapi import APIRouter, Depends, Header

from app.api.errors import api_error
from app.core.db import get_db
from app.schemas.sessions import SessionStartRequest, SessionStartResponse
from app.services.session_service import start_session

router = APIRouter()


@router.post('/start', response_model=SessionStartResponse)
def create_session(
    payload: SessionStartRequest,
    conn: sqlite3.Connection = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    if not authorization or not authorization.startswith('Bearer '):
        raise api_error(
            code='AUTH_HEADER_MISSING',
            message='Требуется Bearer session token',
            status_code=401,
        )

    raw_token = authorization.replace('Bearer ', '', 1).strip()
    return start_session(
        conn,
        raw_session_token=raw_token,
        item_name=payload.item_name,
        item_price=payload.item_price,
    )
