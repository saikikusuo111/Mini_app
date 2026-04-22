import json
from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=1)
def load_purchase_flow() -> dict:
    project_root = Path(__file__).resolve().parents[3]
    path = project_root / 'db' / 'seeds' / 'purchase_flow_v1.json'
    with path.open('r', encoding='utf-8') as f:
        return json.load(f)
