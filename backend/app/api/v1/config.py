from fastapi import APIRouter

from app.schemas.config import PurchaseFlowResponse
from app.services.flow_config_service import load_purchase_flow

router = APIRouter()


@router.get('/purchase-flow', response_model=PurchaseFlowResponse)
def get_purchase_flow():
    return load_purchase_flow()
