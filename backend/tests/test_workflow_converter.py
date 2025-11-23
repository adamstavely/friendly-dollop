"""Tests for WorkflowConverter."""
import pytest
from app.utils.workflow_converter import WorkflowConverter
from app.models.workflow import WorkflowDefinition, WorkflowNode, WorkflowConnection


def test_convert_to_langgraph(sample_workflow_definition):
    """Test conversion to LangGraph format."""
    converter = WorkflowConverter()
    result = converter.convert_to_langgraph(sample_workflow_definition)
    
    assert "nodes" in result
    assert "edges" in result
    assert len(result["nodes"]) > 0


def test_convert_to_langchain_chain(sample_workflow_definition):
    """Test conversion to LangChain chain format."""
    converter = WorkflowConverter()
    result = converter.convert_to_langchain_chain(sample_workflow_definition)
    
    assert "chain_type" in result
    assert "nodes" in result


def test_convert_to_langchain_agent(sample_workflow_definition):
    """Test conversion to LangChain agent format."""
    converter = WorkflowConverter()
    result = converter.convert_to_langchain_agent(sample_workflow_definition)
    
    assert "agent_type" in result
    assert "llm_config" in result


def test_detect_workflow_type():
    """Test workflow type detection."""
    converter = WorkflowConverter()
    
    # Test graph type (has condition node)
    definition = WorkflowDefinition(
        nodes=[
            WorkflowNode(id="node-1", type="condition", label="Condition", data={})
        ],
        connections=[]
    )
    workflow_type = converter.detect_workflow_type(definition)
    assert workflow_type == "graph"
    
    # Test chain type
    definition = WorkflowDefinition(
        nodes=[
            WorkflowNode(id="node-1", type="input", label="Input", data={}),
            WorkflowNode(id="node-2", type="output", label="Output", data={})
        ],
        connections=[
            WorkflowConnection(id="conn-1", source="node-1", target="node-2")
        ]
    )
    workflow_type = converter.detect_workflow_type(definition)
    assert workflow_type == "chain"

