"""Pytest configuration and fixtures."""
import pytest
from unittest.mock import Mock, AsyncMock
from app.models.workflow import WorkflowDefinition, WorkflowNode, WorkflowConnection
from app.models.workflow import Workflow, WorkflowEngine, WorkflowStatus


@pytest.fixture
def sample_workflow_definition():
    """Sample workflow definition for testing."""
    return WorkflowDefinition(
        nodes=[
            WorkflowNode(
                id="input-1",
                type="input",
                label="Input Node",
                data={}
            ),
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
            ),
            WorkflowNode(
                id="output-1",
                type="output",
                label="Output Node",
                data={}
            )
        ],
        connections=[
            WorkflowConnection(
                id="conn-1",
                source="input-1",
                target="llm-1"
            ),
            WorkflowConnection(
                id="conn-2",
                source="llm-1",
                target="output-1"
            )
        ]
    )


@pytest.fixture
def sample_workflow():
    """Sample workflow for testing."""
    return Workflow(
        id="test-workflow-1",
        name="Test Workflow",
        description="A test workflow",
        status=WorkflowStatus.DRAFT,
        engine=WorkflowEngine.LANGGRAPH,
        createdAt="2024-01-01T00:00:00",
        updatedAt="2024-01-01T00:00:00"
    )


@pytest.fixture
def mock_mcp_adapter():
    """Mock MCP adapter."""
    adapter = Mock()
    adapter.get_mcp_tool = AsyncMock(return_value={
        "id": "test-tool-1",
        "name": "Test Tool",
        "description": "A test tool"
    })
    adapter.create_langchain_tool = Mock(return_value=Mock())
    adapter.get_tools_for_persona = AsyncMock(return_value=[])
    return adapter

