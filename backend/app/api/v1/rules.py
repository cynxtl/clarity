from typing import List
from fastapi import APIRouter
from backend.app.schemas.schemas import RuleDefinition
from backend.app.rules.registry import list_rule_definitions

router = APIRouter(prefix="/rules", tags=["Rules"])

@router.get("", response_model=List[RuleDefinition])
def get_rules():
    return [RuleDefinition(**r) for r in list_rule_definitions()]
