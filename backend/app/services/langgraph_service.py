"""Langgraph workflow execution service."""
from typing import Dict, Any, List, Optional, AsyncIterator
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage
from app.models.workflow import WorkflowDefinition
from app.services.mcp_adapter import MCPAdapter
from app.services.llm_service import LLMService
from app.utils.workflow_converter import WorkflowConverter
from app.utils.state_validator import StateValidator
from app.exceptions import (
    LLMExecutionError,
    ToolExecutionError,
    StateValidationError,
    GraphCompilationError,
    TransformExecutionError
)
from app.utils.retry import retry_on_failure, RetryConfig
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)


class LanggraphService:
    """Service for creating and executing Langgraph workflows."""
    
    def __init__(self):
        self.mcp_adapter = MCPAdapter()
        self.converter = WorkflowConverter()
        self.llm_service = LLMService()
        self.state_validator = StateValidator()
        self._graph_cache: Dict[str, Any] = {}
        self._state_checkpoints: Dict[str, List[Dict[str, Any]]] = {}
    
    async def create_graph(self, definition: WorkflowDefinition) -> Any:
        """Create a Langgraph StateGraph from workflow definition."""
        # Convert workflow definition
        graph_config = self.converter.convert_to_langgraph(definition)
        
        # Get state schema from definition or config
        state_schema = definition.stateSchema or graph_config.get("state_schema", {})
        
        # Validate state schema
        if state_schema:
            is_valid, error = self.state_validator.validate_state_schema(state_schema)
            if not is_valid:
                logger.warning(f"Invalid state schema: {error}")
                # Use empty schema if invalid
                state_schema = {}
        
        # Create graph
        graph = StateGraph(state_schema)
        
        # Add nodes
        for node_config in graph_config["nodes"]:
            node_func = await self._create_node_function(node_config)
            graph.add_node(node_config["id"], node_func)
        
        # Add edges
        for edge_config in graph_config["edges"]:
            source = edge_config["source"]
            target = edge_config["target"]
            
            if target == "END" or target == "__end__":
                graph.add_edge(source, END)
            else:
                graph.add_edge(source, target)
        
        # Set entry point (first input node)
        input_nodes = [n for n in graph_config["nodes"] if n["type"] == "input"]
        if input_nodes:
            graph.set_entry_point(input_nodes[0]["id"])
        else:
            # Use first node as entry
            if graph_config["nodes"]:
                graph.set_entry_point(graph_config["nodes"][0]["id"])
        
        # Compile graph
        compiled = graph.compile()
        
        return compiled
    
    async def _create_node_function(self, node_config: Dict[str, Any]):
        """Create a node function for Langgraph."""
        node_type = node_config.get("type")
        node_id = node_config.get("id")
        mcp_tool_id = node_config.get("mcp_tool_id")
        config = node_config.get("config", {})
        
        async def node_func(state: Dict[str, Any]) -> Dict[str, Any]:
            """Node execution function."""
            if node_type == "input":
                # Pass through input
                return {"input": state.get("input", {})}
            
            elif node_type == "mcp-tool" and mcp_tool_id:
                # Execute MCP tool
                try:
                    tool = await self.mcp_adapter.get_mcp_tool(mcp_tool_id)
                    if tool:
                        langchain_tool = self.mcp_adapter.create_langchain_tool(tool)
                        # Execute tool with state input
                        result = await self._execute_tool_with_retry(langchain_tool, state.get("input", {}))
                        return {"output": result, "node_id": node_id}
                    else:
                        raise ToolExecutionError(
                            f"Tool {mcp_tool_id} not found",
                            tool_id=mcp_tool_id
                        )
                except ToolExecutionError:
                    raise
                except Exception as e:
                    raise ToolExecutionError(
                        f"Tool execution failed: {str(e)}",
                        tool_id=mcp_tool_id,
                        context={"original_error": str(e)}
                    )
            
            elif node_type == "llm":
                # LLM node - execute actual LLM call
                try:
                    # Get LLM configuration from node config or workflow config
                    llm_config = config.get("llm", {})
                    provider = llm_config.get("provider") or config.get("provider") or "openai"
                    model = llm_config.get("model") or config.get("model") or "gpt-4"
                    temperature = llm_config.get("temperature") or config.get("temperature")
                    max_tokens = llm_config.get("max_tokens") or config.get("max_tokens")
                    system_message = llm_config.get("system_message") or config.get("system_message")
                    api_key = llm_config.get("api_key") or config.get("api_key")
                    
                    # Create LLM instance
                    llm = self.llm_service.create_llm(
                        provider=provider,
                        model=model,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        api_key=api_key
                    )
                    
                    # Get input from state
                    input_data = state.get("input", state.get("output", ""))
                    
                    # Create messages
                    messages = self.llm_service.create_messages(
                        input_data=input_data,
                        system_message=system_message
                    )
                    
                    # Invoke LLM
                    response = await self.llm_service.invoke(llm, messages)
                    
                    # Extract content from response
                    if hasattr(response, 'content'):
                        output = response.content
                    else:
                        output = str(response)
                    
                    logger.info(f"LLM node {node_id} executed successfully with provider {provider}, model {model}")
                    
                    return {
                        "output": output,
                        "node_id": node_id,
                        "llm_response": {
                            "provider": provider,
                            "model": model,
                            "response": output
                        }
                    }
                except Exception as e:
                    logger.error(f"LLM node {node_id} execution failed: {str(e)}")
                    raise LLMExecutionError(
                        f"LLM execution failed: {str(e)}",
                        provider=provider,
                        model=model,
                        context={
                            "node_id": node_id,
                            "original_error": str(e)
                        }
                    )
            
            elif node_type == "transform":
                # Transform node
                try:
                    transform_func = config.get("transform")
                    if transform_func:
                        # Apply transform
                        input_data = state.get("input", {})
                        output = self._apply_transform(input_data, transform_func)
                        return {"output": output, "node_id": node_id}
                    return {"output": state.get("input", {}), "node_id": node_id}
                except Exception as e:
                    transform_type = transform_func if isinstance(transform_func, str) else transform_func.get("type", "unknown") if isinstance(transform_func, dict) else "unknown"
                    raise TransformExecutionError(
                        f"Transform execution failed: {str(e)}",
                        transform_type=transform_type,
                        context={
                            "node_id": node_id,
                            "original_error": str(e)
                        }
                    )
            
            elif node_type == "output":
                # Output node
                return {"output": state.get("input", {}), "node_id": node_id}
            
            else:
                # Default passthrough
                return {"output": state.get("input", {}), "node_id": node_id}
        
        return node_func
    
    def _apply_transform(self, input_data: Any, transform_func: Any) -> Any:
        """Apply a transform function to input data."""
        if not transform_func:
            return input_data
        
        # If transform_func is a string, try to parse it as a transform type
        if isinstance(transform_func, str):
            return self._apply_named_transform(input_data, transform_func)
        
        # If transform_func is a dict, it contains transform configuration
        if isinstance(transform_func, dict):
            transform_type = transform_func.get("type", "passthrough")
            transform_config = transform_func.get("config", {})
            return self._apply_named_transform(input_data, transform_type, transform_config)
        
        # If transform_func is callable, execute it
        if callable(transform_func):
            try:
                return transform_func(input_data)
            except Exception as e:
                logger.error(f"Transform function execution failed: {str(e)}")
                return input_data
        
        # Default: passthrough
        return input_data
    
    def _apply_named_transform(self, input_data: Any, transform_type: str, config: Optional[Dict[str, Any]] = None) -> Any:
        """Apply a named transform function."""
        config = config or {}
        
        if transform_type == "passthrough" or transform_type == "identity":
            return input_data
        
        elif transform_type == "to_string":
            return str(input_data)
        
        elif transform_type == "to_json":
            import json
            if isinstance(input_data, str):
                try:
                    return json.loads(input_data)
                except json.JSONDecodeError:
                    return input_data
            else:
                return json.dumps(input_data) if input_data is not None else "{}"
        
        elif transform_type == "extract_field":
            field = config.get("field")
            if field and isinstance(input_data, dict):
                return input_data.get(field)
            return input_data
        
        elif transform_type == "set_field":
            field = config.get("field")
            value = config.get("value")
            if field and isinstance(input_data, dict):
                result = input_data.copy()
                result[field] = value
                return result
            return input_data
        
        elif transform_type == "merge":
            merge_data = config.get("data", {})
            if isinstance(input_data, dict) and isinstance(merge_data, dict):
                result = input_data.copy()
                result.update(merge_data)
                return result
            return input_data
        
        elif transform_type == "filter":
            filter_field = config.get("field")
            filter_value = config.get("value")
            if filter_field and isinstance(input_data, list):
                return [item for item in input_data if isinstance(item, dict) and item.get(filter_field) == filter_value]
            return input_data
        
        elif transform_type == "map":
            map_field = config.get("field")
            if map_field and isinstance(input_data, list):
                return [item.get(map_field) if isinstance(item, dict) else item for item in input_data]
            return input_data
        
        elif transform_type == "uppercase":
            if isinstance(input_data, str):
                return input_data.upper()
            return str(input_data).upper()
        
        elif transform_type == "lowercase":
            if isinstance(input_data, str):
                return input_data.lower()
            return str(input_data).lower()
        
        elif transform_type == "trim":
            if isinstance(input_data, str):
                return input_data.strip()
            return str(input_data).strip()
        
        elif transform_type == "replace":
            old = config.get("old", "")
            new = config.get("new", "")
            if isinstance(input_data, str):
                return input_data.replace(old, new)
            return str(input_data).replace(old, new)
        
        elif transform_type == "split":
            separator = config.get("separator", " ")
            if isinstance(input_data, str):
                return input_data.split(separator)
            return [str(input_data)]
        
        elif transform_type == "join":
            separator = config.get("separator", " ")
            if isinstance(input_data, list):
                return separator.join(str(item) for item in input_data)
            return str(input_data)
        
        elif transform_type == "length":
            if isinstance(input_data, (str, list, dict)):
                return len(input_data)
            return 0
        
        elif transform_type == "slice":
            start = config.get("start", 0)
            end = config.get("end")
            if isinstance(input_data, (str, list)):
                return input_data[start:end]
            return input_data
        
        else:
            logger.warning(f"Unknown transform type: {transform_type}, using passthrough")
            return input_data
    
    async def execute_graph(
        self,
        graph: Any,
        input_data: Dict[str, Any],
        state_schema: Optional[Dict[str, Any]] = None,
        enable_checkpointing: bool = False,
        execution_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute a Langgraph workflow."""
        try:
            # Get default values from schema if available
            if state_schema:
                defaults = self.state_validator.get_state_schema_defaults(state_schema)
                initial_state = defaults.copy()
            else:
                initial_state = {}
            
            # Merge input data
            initial_state.update({"input": input_data})
            
            # Validate initial state against schema if provided
            if state_schema:
                is_valid, error = self.state_validator.validate_state_against_schema(initial_state, state_schema)
                if not is_valid:
                    logger.warning(f"Initial state validation warning: {error}")
                    # Don't fail on validation warning, but log it
            
            # Save checkpoint if enabled
            if enable_checkpointing and execution_id:
                self._save_checkpoint(execution_id, initial_state, "initial")
            
            # Execute graph
            result = await graph.ainvoke(initial_state)
            
            # Save final checkpoint if enabled
            if enable_checkpointing and execution_id:
                self._save_checkpoint(execution_id, result, "final")
            
            return {
                "output": result.get("output", result),
                "state": result,
                "success": True,
                "state_schema": state_schema,
                "checkpoints": self._state_checkpoints.get(execution_id, []) if execution_id else []
            }
        except (LLMExecutionError, ToolExecutionError, TransformExecutionError) as e:
            logger.error(f"Graph execution failed: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Graph execution failed: {str(e)}")
            from app.exceptions import WorkflowExecutionError
            raise WorkflowExecutionError(
                f"Graph execution failed: {str(e)}",
                error_code="GRAPH_EXECUTION_ERROR",
                context={
                    "original_error": str(e),
                    "execution_id": execution_id
                }
            )
    
    @retry_on_failure(
        config=RetryConfig(max_attempts=3, initial_delay=1.0),
        retryable_exceptions=(Exception,)
    )
    async def _execute_tool_with_retry(self, tool, input_data: Dict[str, Any]) -> str:
        """Execute tool with retry logic."""
        return await tool._arun(**input_data)
    
    def _save_checkpoint(self, execution_id: str, state: Dict[str, Any], checkpoint_type: str):
        """Save a state checkpoint."""
        if execution_id not in self._state_checkpoints:
            self._state_checkpoints[execution_id] = []
        
        checkpoint = {
            "type": checkpoint_type,
            "state": state.copy(),
            "timestamp": datetime.now().isoformat()
        }
        
        self._state_checkpoints[execution_id].append(checkpoint)
        
        # Limit checkpoints to last 100 per execution
        if len(self._state_checkpoints[execution_id]) > 100:
            self._state_checkpoints[execution_id] = self._state_checkpoints[execution_id][-100:]
    
    def get_checkpoints(self, execution_id: str) -> List[Dict[str, Any]]:
        """Get checkpoints for an execution."""
        return self._state_checkpoints.get(execution_id, [])
    
    def clear_checkpoints(self, execution_id: str):
        """Clear checkpoints for an execution."""
        if execution_id in self._state_checkpoints:
            del self._state_checkpoints[execution_id]
    
    async def stream_execution(
        self,
        graph: Any,
        input_data: Dict[str, Any]
    ) -> AsyncIterator[Dict[str, Any]]:
        """Stream execution updates from Langgraph."""
        try:
            initial_state = {"input": input_data}
            
            async for event in graph.astream(initial_state):
                yield {
                    "node_id": list(event.keys())[0] if event else None,
                    "state": event,
                    "status": "running"
                }
            
            yield {
                "status": "completed"
            }
        except Exception as e:
            yield {
                "status": "error",
                "error": str(e)
            }

