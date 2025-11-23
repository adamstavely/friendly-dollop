"""Workflow engine models."""
from enum import Enum


class WorkflowEngine(str, Enum):
    """Workflow execution engine."""
    FLOWISE = "flowise"
    LANGCHAIN = "langchain"
    LANGGRAPH = "langgraph"

