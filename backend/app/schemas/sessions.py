from pydantic import BaseModel, Field


class SessionStartRequest(BaseModel):
    item_name: str = Field(min_length=2, max_length=80)
    item_price: float = Field(gt=0)


class SessionStartResponse(BaseModel):
    session_id: str
    flow_type: str
    started_at: str
    current_question_order: int
