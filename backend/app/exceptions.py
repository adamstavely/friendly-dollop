"""Custom exceptions for workflow execution."""
from typing import Optional, Dict, Any


class WorkflowExecutionError(Exception):
    """Base exception for workflow execution errors."""
    
    def __init__(self, message: str, error_code: Optional[str] = None, context: Optional[Dict[str, Any]] = None):
        self.message = message
        self.error_code = error_code
        self.context = context or {}
        super().__init__(self.message)


class LLMExecutionError(WorkflowExecutionError):
    """Exception raised when LLM execution fails."""
    
    def __init__(self, message: str, provider: Optional[str] = None, model: Optional[str] = None, **kwargs):
        context = kwargs.get("context", {})
        context.update({
            "provider": provider,
            "model": model
        })
        super().__init__(message, error_code="LLM_EXECUTION_ERROR", context=context)


class ToolExecutionError(WorkflowExecutionError):
    """Exception raised when tool execution fails."""
    
    def __init__(self, message: str, tool_id: Optional[str] = None, **kwargs):
        context = kwargs.get("context", {})
        context.update({
            "tool_id": tool_id
        })
        super().__init__(message, error_code="TOOL_EXECUTION_ERROR", context=context)


class StateValidationError(WorkflowExecutionError):
    """Exception raised when state validation fails."""
    
    def __init__(self, message: str, validation_errors: Optional[list] = None, **kwargs):
        context = kwargs.get("context", {})
        context.update({
            "validation_errors": validation_errors or []
        })
        super().__init__(message, error_code="STATE_VALIDATION_ERROR", context=context)


class GraphCompilationError(WorkflowExecutionError):
    """Exception raised when graph compilation fails."""
    
    def __init__(self, message: str, node_id: Optional[str] = None, **kwargs):
        context = kwargs.get("context", {})
        context.update({
            "node_id": node_id
        })
        super().__init__(message, error_code="GRAPH_COMPILATION_ERROR", context=context)


class TransformExecutionError(WorkflowExecutionError):
    """Exception raised when transform execution fails."""
    
    def __init__(self, message: str, transform_type: Optional[str] = None, **kwargs):
        context = kwargs.get("context", {})
        context.update({
            "transform_type": transform_type
        })
        super().__init__(message, error_code="TRANSFORM_EXECUTION_ERROR", context=context)

