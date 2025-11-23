"""Execution API endpoints."""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.execution import WorkflowExecution
from app.services.workflow_executor import WorkflowExecutor
from fastapi.responses import StreamingResponse
import json

router = APIRouter()
_executor = WorkflowExecutor()


@router.get("/workflows/{workflow_id}/executions", response_model=List[WorkflowExecution])
async def get_execution_history(
    workflow_id: str,
    limit: int = Query(10, ge=1, le=100)
):
    """Get execution history for a workflow."""
    executions = _executor.get_executions(workflow_id, limit)
    return executions


@router.get("/workflows/{workflow_id}/executions/{execution_id}", response_model=WorkflowExecution)
async def get_execution(workflow_id: str, execution_id: str):
    """Get execution details."""
    execution = _executor.get_execution(execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    if execution.workflowId != workflow_id:
        raise HTTPException(status_code=404, detail="Execution not found for this workflow")
    
    return execution


@router.get("/workflows/{workflow_id}/executions/{execution_id}/stream")
async def stream_execution(workflow_id: str, execution_id: str):
    """Stream execution updates (Server-Sent Events)."""
    execution = _executor.get_execution(execution_id)
    if not execution or execution.workflowId != workflow_id:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    async def generate():
        """Generate SSE events."""
        # Send initial state
        yield f"data: {json.dumps({'status': execution.status, 'execution_id': execution_id})}\n\n"
        
        # In a real implementation, this would stream updates from the executor
        # For now, just send completion
        if execution.status in ["completed", "failed", "cancelled"]:
            yield f"data: {json.dumps({'status': execution.status, 'output': execution.output})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/workflows/{workflow_id}/executions/{execution_id}/cancel", response_model=WorkflowExecution)
async def cancel_execution(workflow_id: str, execution_id: str):
    """Cancel a running execution."""
    execution = _executor.get_execution(execution_id)
    if not execution or execution.workflowId != workflow_id:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    if execution.status != "running":
        raise HTTPException(status_code=400, detail="Execution is not running")
    
    # Update execution status
    from app.models.execution import ExecutionStatus
    execution.status = ExecutionStatus.CANCELLED
    
    return execution

