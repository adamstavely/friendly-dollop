"""Tests for StateValidator."""
import pytest
from app.utils.state_validator import StateValidator


def test_validate_state_schema():
    """Test state schema validation."""
    schema = {
        "type": "object",
        "properties": {
            "input": {"type": "string"},
            "output": {"type": "string"}
        }
    }
    
    is_valid, error = StateValidator.validate_state_schema(schema)
    assert is_valid is True
    assert error is None


def test_validate_state_against_schema():
    """Test state validation against schema."""
    schema = {
        "type": "object",
        "properties": {
            "input": {"type": "string"},
            "output": {"type": "string"}
        },
        "required": ["input"]
    }
    
    state = {
        "input": "test",
        "output": "result"
    }
    
    is_valid, error = StateValidator.validate_state_against_schema(state, schema)
    assert is_valid is True
    assert error is None


def test_get_state_schema_defaults():
    """Test getting default values from schema."""
    schema = {
        "type": "object",
        "properties": {
            "input": {
                "type": "string",
                "default": "default input"
            },
            "count": {
                "type": "integer",
                "default": 0
            }
        }
    }
    
    defaults = StateValidator.get_state_schema_defaults(schema)
    assert defaults["input"] == "default input"
    assert defaults["count"] == 0

