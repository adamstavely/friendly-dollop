"""Tests for LanggraphService."""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from app.services.langgraph_service import LanggraphService
from app.models.workflow import WorkflowDefinition, WorkflowNode, WorkflowConnection
from app.exceptions import LLMExecutionError, ToolExecutionError


@pytest.mark.asyncio
async def test_create_graph(sample_workflow_definition):
    """Test graph creation."""
    service = LanggraphService()
    graph = await service.create_graph(sample_workflow_definition)
    assert graph is not None


@pytest.mark.asyncio
async def test_execute_graph(sample_workflow_definition):
    """Test graph execution."""
    service = LanggraphService()
    graph = await service.create_graph(sample_workflow_definition)
    
    input_data = {"input": "test input"}
    result = await service.execute_graph(graph, input_data)
    
    assert result is not None
    assert "success" in result


@pytest.mark.asyncio
async def test_llm_node_execution():
    """Test LLM node execution."""
    service = LanggraphService()
    
    definition = WorkflowDefinition(
        nodes=[
            WorkflowNode(
                id="llm-1",
                type="llm",
                label="LLM Node",
                data={
                    "llm": {
                        "provider": "openai",
                        "model": "gpt-4",
                        "temperature": 0.7
                    }
                }
            )
        ],
        connections=[]
    )
    
    with patch.object(service.llm_service, 'create_llm') as mock_create_llm, \
         patch.object(service.llm_service, 'invoke') as mock_invoke:
        mock_llm = Mock()
        mock_create_llm.return_value = mock_llm
        mock_response = Mock()
        mock_response.content = "Test response"
        mock_invoke.return_value = mock_response
        
        graph = await service.create_graph(definition)
        result = await service.execute_graph(graph, {"input": "test"})
        
        assert result is not None


@pytest.mark.asyncio
async def test_transform_functions():
    """Test transform function execution."""
    service = LanggraphService()
    
    # Test to_string transform
    result = service._apply_named_transform("test", "to_string")
    assert result == "test"
    
    # Test uppercase transform
    result = service._apply_named_transform("hello", "uppercase")
    assert result == "HELLO"
    
    # Test lowercase transform
    result = service._apply_named_transform("WORLD", "lowercase")
    assert result == "world"


@pytest.mark.asyncio
async def test_state_validation():
    """Test state schema validation."""
    service = LanggraphService()
    
    state_schema = {
        "type": "object",
        "properties": {
            "input": {"type": "string"},
            "output": {"type": "string"}
        }
    }
    
    definition = WorkflowDefinition(
        nodes=[],
        connections=[],
        stateSchema=state_schema
    )
    
    graph = await service.create_graph(definition)
    assert graph is not None


@pytest.mark.asyncio
async def test_checkpointing():
    """Test state checkpointing."""
    service = LanggraphService()
    
    definition = WorkflowDefinition(nodes=[], connections=[])
    graph = await service.create_graph(definition)
    
    execution_id = "test-execution-1"
    result = await service.execute_graph(
        graph,
        {"input": "test"},
        enable_checkpointing=True,
        execution_id=execution_id
    )
    
    checkpoints = service.get_checkpoints(execution_id)
    assert len(checkpoints) > 0


@pytest.mark.asyncio
async def test_stream_execution(sample_workflow_definition):
    """Test execution streaming."""
    service = LanggraphService()
    graph = await service.create_graph(sample_workflow_definition)
    
    input_data = {"input": "test"}
    events = []
    
    async for event in service.stream_execution(graph, input_data):
        events.append(event)
    
    assert len(events) > 0
    assert events[-1]["status"] in ["completed", "error"]

