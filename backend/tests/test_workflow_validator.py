"""Tests for WorkflowValidator."""
import pytest
from app.utils.workflow_validator import WorkflowValidator
from app.models.workflow import WorkflowDefinition, WorkflowNode, WorkflowConnection


def test_validate_workflow_definition(sample_workflow_definition):
    """Test workflow definition validation."""
    is_valid, errors = WorkflowValidator.validate_workflow_definition(sample_workflow_definition)
    assert is_valid is True
    assert len(errors) == 0


def test_validate_duplicate_node_ids():
    """Test validation detects duplicate node IDs."""
    definition = WorkflowDefinition(
        nodes=[
            WorkflowNode(id="node-1", type="input", label="Node 1", data={}),
            WorkflowNode(id="node-1", type="output", label="Node 2", data={})  # Duplicate ID
        ],
        connections=[]
    )
    
    is_valid, errors = WorkflowValidator.validate_workflow_definition(definition)
    assert is_valid is False
    assert any("Duplicate" in error for error in errors)


def test_validate_circular_dependencies():
    """Test validation detects circular dependencies."""
    definition = WorkflowDefinition(
        nodes=[
            WorkflowNode(id="node-1", type="input", label="Node 1", data={}),
            WorkflowNode(id="node-2", type="output", label="Node 2", data={})
        ],
        connections=[
            WorkflowConnection(id="conn-1", source="node-1", target="node-2"),
            WorkflowConnection(id="conn-2", source="node-2", target="node-1")  # Circular
        ]
    )
    
    has_circular = WorkflowValidator._check_circular_dependencies(
        definition.nodes,
        definition.connections
    )
    assert has_circular is True


def test_validate_agent_config():
    """Test agent configuration validation."""
    config = {
        "agentType": "react",
        "llmProvider": "openai",
        "llmModel": "gpt-4"
    }
    
    is_valid, errors = WorkflowValidator.validate_agent_config(config)
    assert is_valid is True
    assert len(errors) == 0


def test_validate_chain_config():
    """Test chain configuration validation."""
    config = {
        "chainType": "sequential",
        "nodes": ["node-1", "node-2"]
    }
    
    is_valid, errors = WorkflowValidator.validate_chain_config(config)
    assert is_valid is True
    assert len(errors) == 0

