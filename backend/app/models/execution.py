"""Execution models."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class ExecutionStatus(str, Enum):
    """Execution status."""
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ExecutionLog(BaseModel):
    """Execution log entry."""
    timestamp: str
    level: str  # info, warn, error
    message: str
    nodeId: Optional[str] = None


class WorkflowExecution(BaseModel):
    """Workflow execution model."""
    id: str
    workflowId: str
    status: ExecutionStatus
    startedAt: str
    completedAt: Optional[str] = None
    duration: Optional[int] = None  # milliseconds
    input: Optional[Dict[str, Any]] = None
    output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    logs: List[ExecutionLog] = Field(default_factory=list)
    
    # Langchain/Langgraph specific
    state: Optional[Dict[str, Any]] = None  # For Langgraph state
    toolCalls: List[Dict[str, Any]] = Field(default_factory=list)  # For agent executions
    reasoningSteps: List[str] = Field(default_factory=list)  # For agent reasoning


class ExecutionCreate(BaseModel):
    """Execution creation request."""
    workflowId: str
    input: Optional[Dict[str, Any]] = None


class ExecutionStreamUpdate(BaseModel):
    """Streaming execution update."""
    executionId: str
    status: ExecutionStatus
    nodeId: Optional[str] = None
    nodeOutput: Optional[Dict[str, Any]] = None
    state: Optional[Dict[str, Any]] = None
    log: Optional[ExecutionLog] = None
    error: Optional[str] = None

