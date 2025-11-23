"""Workflow API endpoints."""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.workflow import (
    Workflow, WorkflowCreate, WorkflowUpdate, WorkflowDefinition,
    WorkflowEngine, WorkflowType
)
from app.models.execution import WorkflowExecution
from app.services.workflow_executor import WorkflowExecutor
from app.utils.engine_router import EngineRouter
from app.utils.workflow_migrator import WorkflowMigrator
from app.utils.workflow_converter import WorkflowConverter
from app.utils.workflow_validator import WorkflowValidator
from datetime import datetime
import uuid

router = APIRouter()

# In-memory storage (would be replaced with database)
_workflows: dict[str, Workflow] = {}
_workflow_definitions: dict[str, WorkflowDefinition] = {}
_executor = WorkflowExecutor()
_router = EngineRouter()
_migrator = WorkflowMigrator()
_converter = WorkflowConverter()


@router.get("/workflows", response_model=dict)
async def list_workflows(
    engine: Optional[WorkflowEngine] = Query(None, description="Filter by engine"),
    workflow_type: Optional[WorkflowType] = Query(None, description="Filter by workflow type"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """List all workflows."""
    workflows = list(_workflows.values())
    
    # Apply filters
    if engine:
        workflows = [w for w in workflows if w.engine == engine]
    if workflow_type:
        workflows = [w for w in workflows if w.workflowType == workflow_type]
    
    # Paginate
    total = len(workflows)
    workflows = workflows[offset:offset + limit]
    
    return {
        "workflows": workflows,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/workflows/{workflow_id}", response_model=Workflow)
async def get_workflow(workflow_id: str):
    """Get workflow by ID."""
    workflow = _workflows.get(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.post("/workflows", response_model=Workflow, status_code=201)
async def create_workflow(workflow_data: WorkflowCreate):
    """Create a new workflow."""
    workflow_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    workflow = Workflow(
        id=workflow_id,
        name=workflow_data.name,
        description=workflow_data.description,
        status=workflow_data.status,
        engine=workflow_data.engine,
        workflowType=workflow_data.workflowType,
        createdAt=now,
        updatedAt=now,
        tags=workflow_data.tags,
        mcpTools=workflow_data.mcpTools,
        langchainConfig=workflow_data.langchainConfig,
        chainConfig=workflow_data.chainConfig,
        agentConfig=workflow_data.agentConfig
    )
    
    _workflows[workflow_id] = workflow
    return workflow


@router.put("/workflows/{workflow_id}", response_model=Workflow)
async def update_workflow(workflow_id: str, workflow_data: WorkflowUpdate):
    """Update a workflow."""
    workflow = _workflows.get(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Update fields
    update_data = workflow_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(workflow, key, value)
    
    workflow.updatedAt = datetime.now().isoformat()
    _workflows[workflow_id] = workflow
    
    return workflow


@router.delete("/workflows/{workflow_id}", status_code=204)
async def delete_workflow(workflow_id: str):
    """Delete a workflow."""
    if workflow_id not in _workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    del _workflows[workflow_id]
    _workflow_definitions.pop(workflow_id, None)
    return None


@router.get("/workflows/{workflow_id}/definition", response_model=WorkflowDefinition)
async def get_workflow_definition(workflow_id: str):
    """Get workflow definition."""
    if workflow_id not in _workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    definition = _workflow_definitions.get(workflow_id)
    if not definition:
        # Return empty definition
        definition = WorkflowDefinition()
        _workflow_definitions[workflow_id] = definition
    
    return definition


@router.put("/workflows/{workflow_id}/definition", response_model=WorkflowDefinition)
async def update_workflow_definition(workflow_id: str, definition: WorkflowDefinition):
    """Update workflow definition."""
    if workflow_id not in _workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    _workflow_definitions[workflow_id] = definition
    
    # Update workflow updatedAt
    workflow = _workflows[workflow_id]
    workflow.updatedAt = datetime.now().isoformat()
    
    return definition


@router.post("/workflows/{workflow_id}/execute", response_model=WorkflowExecution)
async def execute_workflow(workflow_id: str, input_data: dict = None):
    """Execute a workflow."""
    workflow = _workflows.get(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    definition = _workflow_definitions.get(workflow_id, WorkflowDefinition())
    
    # Execute workflow
    execution = await _executor.execute_workflow(workflow, definition, input_data)
    
    return execution


@router.post("/workflows/{workflow_id}/compile", response_model=dict)
async def compile_workflow(workflow_id: str, target_engine: Optional[WorkflowEngine] = None):
    """Compile workflow to target engine format."""
    workflow = _workflows.get(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    definition = _workflow_definitions.get(workflow_id, WorkflowDefinition())
    target = target_engine or workflow.engine
    
    if target == WorkflowEngine.LANGGRAPH:
        compiled = _converter.convert_to_langgraph(definition)
    elif target == WorkflowEngine.LANGCHAIN:
        if workflow.workflowType == "agent":
            compiled = _converter.convert_to_langchain_agent(definition)
        else:
            compiled = _converter.convert_to_langchain_chain(definition)
    else:
        compiled = {"message": "Flowise compilation not implemented"}
    
    return {
        "workflow_id": workflow_id,
        "target_engine": target,
        "compiled": compiled
    }


@router.post("/workflows/{workflow_id}/migrate", response_model=dict)
async def migrate_workflow(workflow_id: str, target_engine: WorkflowEngine):
    """Migrate workflow to target engine."""
    workflow = _workflows.get(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    definition = _workflow_definitions.get(workflow_id, WorkflowDefinition())
    
    result = await _migrator.migrate_workflow(workflow, definition, target_engine)
    
    if result["success"]:
        # Update stored workflow and definition
        _workflows[workflow_id] = result["migrated_workflow"]
        _workflow_definitions[workflow_id] = result["migrated_definition"]
    
    return result


@router.post("/workflows/{workflow_id}/validate", response_model=dict)
async def validate_workflow(workflow_id: str):
    """Validate a workflow definition."""
    workflow = _workflows.get(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    definition = _workflow_definitions.get(workflow_id, WorkflowDefinition())
    
    # Validate workflow definition
    is_valid, errors = WorkflowValidator.validate_workflow_definition(definition)
    
    # Validate engine-specific configuration
    engine_errors = []
    if workflow.engine == WorkflowEngine.LANGCHAIN:
        if workflow.workflowType == "agent" and workflow.agentConfig:
            agent_valid, agent_errors = WorkflowValidator.validate_agent_config(workflow.agentConfig.dict())
            if not agent_valid:
                engine_errors.extend([f"Agent config: {e}" for e in agent_errors])
        elif workflow.workflowType == "chain" and workflow.chainConfig:
            chain_valid, chain_errors = WorkflowValidator.validate_chain_config(workflow.chainConfig.dict())
            if not chain_valid:
                engine_errors.extend([f"Chain config: {e}" for e in chain_errors])
    elif workflow.engine == WorkflowEngine.LANGGRAPH:
        langgraph_valid, langgraph_errors = WorkflowValidator.validate_langgraph_config(
            workflow.langgraphConfig or {},
            definition
        )
        if not langgraph_valid:
            engine_errors.extend([f"LangGraph config: {e}" for e in langgraph_errors])
    
    all_errors = errors + engine_errors
    
    return {
        "valid": is_valid and len(engine_errors) == 0,
        "errors": all_errors,
        "workflow_id": workflow_id
    }

