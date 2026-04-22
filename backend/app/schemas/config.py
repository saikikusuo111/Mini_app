from pydantic import BaseModel, Field


class QuestionConfigResponse(BaseModel):
    id: str
    order: int
    text: str
    hint: str
    label_left: str
    label_right: str
    context_hints: dict[str, str]
    polarity: str
    weight: float
    category: str


class PurchaseFlowCopy(BaseModel):
    intro_subtitle: str
    paywall_title: str
    paywall_subtitle: str


class PurchaseFlowResponse(BaseModel):
    flow_type: str
    flow_version: str
    scoring_version: str
    tie_breaker_threshold_percent: int
    free_daily_limit: int
    questions: list[QuestionConfigResponse]
    copy: PurchaseFlowCopy
    meta: dict[str, str] = Field(default_factory=dict)
