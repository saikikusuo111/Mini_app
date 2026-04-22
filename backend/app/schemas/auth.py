from pydantic import BaseModel


class TelegramAuthRequest(BaseModel):
    init_data: str = ''


class UserSnapshot(BaseModel):
    id: str
    tg_user_id: int
    username: str | None = None
    first_name: str | None = None


class EntitlementSnapshot(BaseModel):
    plan: str
    status: str
    daily_limit: int
    remaining_today: int
    history_depth_limit: int


class TelegramAuthResponse(BaseModel):
    user: UserSnapshot
    session_token: str
    entitlement: EntitlementSnapshot
