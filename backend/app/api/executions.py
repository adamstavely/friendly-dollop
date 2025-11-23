"""Execution API endpoints."""
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import List, Optional, Dict, Any
from app.models.execution import WorkflowExecution, ExecutionStreamUpdate, ExecutionStatus, ExecutionLog
from app.models.workflow import Workflow, WorkflowDefinition
from app.services.workflow_executor import WorkflowExecutor
from fastapi.responses import StreamingResponse
import json
import asyncio
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter()
_executor = WorkflowExecutor()
_active_streams: Dict[str, asyncio.Event] = {}  # Track active streams for cancellation


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
    
    # Create cancellation event for this stream
    cancel_event = asyncio.Event()
    _active_streams[execution_id] = cancel_event
    
    async def generate():
        """Generate SSE events."""
        try:
            # Send initial state
            initial_update = ExecutionStreamUpdate(
                executionId=execution_id,
                status=execution.status
            )
            yield f"data: {initial_update.model_dump_json()}\n\n"
            
            # If execution is already completed, just send final state
            if execution.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, ExecutionStatus.CANCELLED]:
                final_update = ExecutionStreamUpdate(
                    executionId=execution_id,
                    status=execution.status,
                    nodeOutput=execution.output,
                    error=execution.error
                )
                yield f"data: {final_update.model_dump_json()}\n\n"
                return
            
            # For LangGraph workflows, stream execution updates
            if execution.status == ExecutionStatus.RUNNING:
                # Get workflow and definition
                from app.api.workflows import _workflows, _workflow_definitions
                workflow = _workflows.get(workflow_id)
                definition = _workflow_definitions.get(workflow_id, WorkflowDefinition())
                
                if workflow and workflow.engine.value == "langgraph":
                    # Stream LangGraph execution
                    graph = await _executor.langgraph_service.create_graph(definition)
                    input_data = execution.input or {}
                    
                    initial_state = {"input": input_data}
                    if definition.stateSchema:
                        from app.utils.state_validator import StateValidator
                        validator = StateValidator()
                        defaults = validator.get_state_schema_defaults(definition.stateSchema)
                        initial_state.update(defaults)
                    
                    async for event in _executor.langgraph_service.stream_execution(graph, input_data):
                        # Check for cancellation
                        if cancel_event.is_set():
                            cancel_update = ExecutionStreamUpdate(
                                executionId=execution_id,
                                status=ExecutionStatus.CANCELLED,
                                error="Execution cancelled by user"
                            )
                            yield f"data: {cancel_update.model_dump_json()}\n\n"
                            break
                        
                        # Send update
                        node_id = event.get("node_id")
                        state = event.get("state", {})
                        status = event.get("status", "running")
                        
                        update = ExecutionStreamUpdate(
                            executionId=execution_id,
                            status=ExecutionStatus.RUNNING if status == "running" else ExecutionStatus.COMPLETED,
                            nodeId=node_id,
                            state=state,
                            nodeOutput=state.get("output") if node_id else None
                        )
                        yield f"data: {update.model_dump_json()}\n\n"
                        
                        if status == "completed":
                            break
                        elif status == "error":
                            error_update = ExecutionStreamUpdate(
                                executionId=execution_id,
                                status=ExecutionStatus.FAILED,
                                error=event.get("error", "Unknown error")
                            )
                            yield f"data: {error_update.model_dump_json()}\n\n"
                            break
                else:
                    # For non-LangGraph workflows, poll for updates
                    while not cancel_event.is_set():
                        updated_execution = _executor.get_execution(execution_id)
                        if updated_execution and updated_execution.status != ExecutionStatus.RUNNING:
                            final_update = ExecutionStreamUpdate(
                                executionId=execution_id,
                                status=updated_execution.status,
                                nodeOutput=updated_execution.output,
                                error=updated_execution.error
                            )
                            yield f"data: {final_update.model_dump_json()}\n\n"
                            break
                        await asyncio.sleep(0.5)  # Poll every 500ms
        except asyncio.CancelledError:
            logger.info(f"Stream cancelled for execution {execution_id}")
        except Exception as e:
            logger.error(f"Stream error for execution {execution_id}: {str(e)}")
            error_update = ExecutionStreamUpdate(
                executionId=execution_id,
                status=ExecutionStatus.FAILED,
                error=f"Stream error: {str(e)}"
            )
            yield f"data: {error_update.model_dump_json()}\n\n"
        finally:
            # Clean up
            if execution_id in _active_streams:
                del _active_streams[execution_id]
    
    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/workflows/{workflow_id}/executions/{execution_id}/cancel", response_model=WorkflowExecution)
async def cancel_execution(workflow_id: str, execution_id: str):
    """Cancel a running execution."""
    execution = _executor.get_execution(execution_id)
    if not execution or execution.workflowId != workflow_id:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    if execution.status != ExecutionStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Execution is not running")
    
    # Set cancellation event if stream is active
    if execution_id in _active_streams:
        _active_streams[execution_id].set()
    
    # Update execution status
    execution.status = ExecutionStatus.CANCELLED
    execution.completedAt = datetime.now().isoformat()
    execution.error = "Execution cancelled by user"
    
    return execution

