# backend/app/schemas/sessions.py
from pydantic import BaseModel, Field


class SessionStartRequest(BaseModel):
    item_name: str = Field(min_length=2, max_length=80)
    item_price: float = Field(gt=0)


class SessionStartResponse(BaseModel):
    session_id: str
    flow_type: str
    started_at: str
    current_question_order: int


class SessionAnswerRequest(BaseModel):
    question_id: str = Field(min_length=1, max_length=64)
    question_order: int = Field(ge=1)
    answer_value: int = Field(ge=0, le=10)


class SessionAnswerResponse(BaseModel):
    ok: bool
    session_id: str
    current_question_order: int


class SessionResultPayload(BaseModel):
    session_id: str
    preliminary_score_for: float
    preliminary_score_against: float
    preliminary_diff: float
    preliminary_diff_percent: float
    needs_tiebreaker: bool
    preliminary_verdict: str
    final_verdict: str
    final_verdict_label: str
    used_tiebreaker: bool
    tiebreaker_option_id: str | None
    result_basis: str


class SessionFinalizeResponse(SessionResultPayload):
    pass


class SessionTiebreakerRequest(BaseModel):
    option_id: str = Field(min_length=1, max_length=32)


class SessionTiebreakerResponse(SessionResultPayload):
    pass
