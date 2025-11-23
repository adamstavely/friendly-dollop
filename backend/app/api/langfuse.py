"""LangFuse API endpoints."""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from app.services.langfuse_service import get_langfuse_service
from pydantic import BaseModel

router = APIRouter()


class TraceFilter(BaseModel):
    """Trace filter parameters."""
    limit: int = 50
    page: int = 1
    userId: Optional[str] = None
    sessionId: Optional[str] = None
    name: Optional[str] = None
    tags: Optional[List[str]] = None
    fromTimestamp: Optional[str] = None
    toTimestamp: Optional[str] = None


class PromptCreate(BaseModel):
    """Prompt creation data."""
    name: str
    prompt: str
    labels: Optional[List[str]] = None
    config: Optional[dict] = None
    tags: Optional[List[str]] = None


class PromptUpdate(BaseModel):
    """Prompt update data."""
    prompt: str
    labels: Optional[List[str]] = None
    config: Optional[dict] = None
    tags: Optional[List[str]] = None


@router.get("/langfuse/traces")
async def list_traces(
    limit: int = Query(50, ge=1, le=1000),
    page: int = Query(1, ge=1),
    userId: Optional[str] = Query(None),
    sessionId: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    fromTimestamp: Optional[str] = Query(None),
    toTimestamp: Optional[str] = Query(None)
):
    """List traces from LangFuse."""
    service = get_langfuse_service()
    
    tag_list = tags.split(",") if tags else None
    
    result = await service.get_traces(
        limit=limit,
        page=page,
        user_id=userId,
        session_id=sessionId,
        name=name,
        tags=tag_list,
        from_timestamp=fromTimestamp,
        to_timestamp=toTimestamp
    )
    
    return result


@router.get("/langfuse/traces/{trace_id}")
async def get_trace(trace_id: str):
    """Get a specific trace by ID."""
    service = get_langfuse_service()
    trace = await service.get_trace(trace_id)
    
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")
    
    return trace


@router.post("/langfuse/traces/search")
async def search_traces(request: dict):
    """Search traces."""
    service = get_langfuse_service()
    query = request.get("query", "")
    limit = request.get("limit", 50)
    traces = await service.search_traces(query, limit=limit)
    return {"traces": traces}


@router.get("/langfuse/traces/{trace_id}/generations")
async def get_trace_generations(trace_id: str):
    """Get generations for a trace."""
    service = get_langfuse_service()
    generations = await service.get_generations(trace_id)
    return {"generations": generations}


@router.get("/langfuse/traces/{trace_id}/scores")
async def get_trace_scores(trace_id: str):
    """Get scores for a trace."""
    service = get_langfuse_service()
    scores = await service.get_scores(trace_id=trace_id)
    return {"scores": scores}


@router.get("/langfuse/scores")
async def get_scores(traceId: Optional[str] = Query(None)):
    """Get all scores, optionally filtered by trace ID."""
    service = get_langfuse_service()
    scores = await service.get_scores(trace_id=traceId)
    return {"scores": scores}


@router.get("/langfuse/analytics")
async def get_analytics(
    fromTimestamp: Optional[str] = Query(None),
    toTimestamp: Optional[str] = Query(None)
):
    """Get analytics and metrics."""
    service = get_langfuse_service()
    analytics = await service.get_analytics(
        from_timestamp=fromTimestamp,
        to_timestamp=toTimestamp
    )
    return analytics


@router.get("/langfuse/prompts")
async def list_prompts():
    """List all prompts."""
    service = get_langfuse_service()
    prompts = await service.get_prompts()
    return {"prompts": prompts}


@router.get("/langfuse/prompts/{prompt_id}")
async def get_prompt(prompt_id: str, version: Optional[int] = Query(None)):
    """Get a specific prompt by ID."""
    service = get_langfuse_service()
    prompt = await service.get_prompt(prompt_id, version=version)
    
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    return prompt


@router.post("/langfuse/prompts")
async def create_prompt(prompt_data: PromptCreate):
    """Create a new prompt."""
    service = get_langfuse_service()
    prompt = await service.create_prompt(prompt_data.dict())
    
    if not prompt:
        raise HTTPException(status_code=500, detail="Failed to create prompt")
    
    return prompt


@router.put("/langfuse/prompts/{prompt_id}")
async def update_prompt(prompt_id: str, prompt_data: PromptUpdate):
    """Update a prompt (creates new version)."""
    service = get_langfuse_service()
    prompt = await service.update_prompt(prompt_id, prompt_data.dict())
    
    if not prompt:
        raise HTTPException(status_code=500, detail="Failed to update prompt")
    
    return prompt


@router.delete("/langfuse/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str):
    """Delete a prompt."""
    service = get_langfuse_service()
    success = await service.delete_prompt(prompt_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete prompt")
    
    return {"success": True}


@router.get("/langfuse/prompts/{prompt_id}/versions")
async def get_prompt_versions(prompt_id: str):
    """Get version history for a prompt."""
    service = get_langfuse_service()
    versions = await service.get_prompt_versions(prompt_id)
    return {"versions": versions}


@router.post("/langfuse/prompts/{prompt_id}/execute")
async def execute_prompt(
    prompt_id: str,
    variables: Dict[str, Any],
    options: Optional[Dict[str, Any]] = None
):
    """Execute a prompt with variables."""
    service = get_langfuse_service()
    result = await service.execute_prompt(prompt_id, variables, options or {})
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to execute prompt")
    
    return result


@router.post("/langfuse/prompts/{prompt_id}/compare")
async def compare_prompt_versions(
    prompt_id: str,
    versions: List[str],
    test_inputs: Dict[str, Any]
):
    """Compare multiple prompt versions."""
    service = get_langfuse_service()
    results = await service.compare_prompt_versions(prompt_id, versions, test_inputs)
    
    if not results:
        raise HTTPException(status_code=500, detail="Failed to compare versions")
    
    return results


@router.post("/langfuse/prompts/{prompt_id}/batch-evaluate")
async def batch_evaluate_prompt(
    prompt_id: str,
    test_cases: List[Dict[str, Any]],
    version: Optional[int] = None
):
    """Run batch evaluation on a test dataset."""
    service = get_langfuse_service()
    results = await service.batch_evaluate_prompt(prompt_id, test_cases, version)
    
    if not results:
        raise HTTPException(status_code=500, detail="Failed to run batch evaluation")
    
    return results


@router.post("/langfuse/prompts/{prompt_id}/estimate-cost")
async def estimate_prompt_cost(
    prompt_id: str,
    variables: Dict[str, Any],
    model: Optional[str] = None
):
    """Estimate token cost for a prompt."""
    service = get_langfuse_service()
    estimation = await service.estimate_prompt_cost(prompt_id, variables, model)
    
    if not estimation:
        raise HTTPException(status_code=500, detail="Failed to estimate cost")
    
    return estimation


@router.get("/langfuse/prompts/{prompt_id}/analytics")
async def get_prompt_analytics(
    prompt_id: str,
    from_timestamp: Optional[str] = None,
    to_timestamp: Optional[str] = None
):
    """Get performance analytics for a prompt."""
    service = get_langfuse_service()
    analytics = await service.get_prompt_analytics(prompt_id, from_timestamp, to_timestamp)
    
    if not analytics:
        raise HTTPException(status_code=500, detail="Failed to get analytics")
    
    return analytics


@router.post("/langfuse/prompts/{prompt_id}/rollback")
async def rollback_prompt_version(
    prompt_id: str,
    target_version: int
):
    """Rollback a prompt to a previous version."""
    service = get_langfuse_service()
    result = await service.rollback_prompt_version(prompt_id, target_version)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to rollback prompt")
    
    return result

