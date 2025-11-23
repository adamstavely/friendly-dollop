"""Chain API endpoints."""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.models.workflow import ChainConfig
from app.services.chain_service import ChainService
from app.utils.workflow_validator import WorkflowValidator

router = APIRouter()
_chain_service = ChainService()


@router.post("/chains/execute", response_model=Dict[str, Any])
async def execute_chain(chain_config: ChainConfig, input_data: Dict[str, Any], llm_config: Dict[str, Any] = None):
    """Execute a chain directly."""
    try:
        chain = await _chain_service.create_chain(chain_config, llm_config)
        result = await _chain_service.execute_chain(chain, input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chains/types", response_model=List[str])
async def get_chain_types():
    """Get available chain types."""
    return ["sequential", "transform", "router"]


@router.post("/chains/validate", response_model=Dict[str, Any])
async def validate_chain_config(chain_config: ChainConfig):
    """Validate chain configuration."""
    is_valid, errors = WorkflowValidator.validate_chain_config(chain_config.dict())
    
    return {
        "valid": is_valid,
        "errors": errors
    }

