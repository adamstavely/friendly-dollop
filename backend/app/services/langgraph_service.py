"""Langgraph workflow execution service."""
from typing import Dict, Any, List, Optional, AsyncIterator
from langgraph.graph import StateGraph, END
from langgraph.graph.state import CompiledStateGraph
from app.models.workflow import WorkflowDefinition
from app.services.mcp_adapter import MCPAdapter
from app.utils.workflow_converter import WorkflowConverter


class LanggraphService:
    """Service for creating and executing Langgraph workflows."""
    
    def __init__(self):
        self.mcp_adapter = MCPAdapter()
        self.converter = WorkflowConverter()
        self._graph_cache: Dict[str, CompiledStateGraph] = {}
    
    async def create_graph(self, definition: WorkflowDefinition) -> CompiledStateGraph:
        """Create a Langgraph StateGraph from workflow definition."""
        # Convert workflow definition
        graph_config = self.converter.convert_to_langgraph(definition)
        
        # Create state schema
        state_schema = graph_config.get("state_schema", {})
        
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
                tool = await self.mcp_adapter.get_mcp_tool(mcp_tool_id)
                if tool:
                    langchain_tool = self.mcp_adapter.create_langchain_tool(tool)
                    # Execute tool with state input
                    result = await langchain_tool._arun(**state.get("input", {}))
                    return {"output": result, "node_id": node_id}
                else:
                    return {"error": f"Tool {mcp_tool_id} not found", "node_id": node_id}
            
            elif node_type == "llm":
                # LLM node (would need LLM integration)
                # For now, return passthrough
                return {"output": state.get("input", ""), "node_id": node_id}
            
            elif node_type == "transform":
                # Transform node
                transform_func = config.get("transform")
                if transform_func:
                    # Apply transform
                    input_data = state.get("input", {})
                    output = self._apply_transform(input_data, transform_func)
                    return {"output": output, "node_id": node_id}
                return {"output": state.get("input", {}), "node_id": node_id}
            
            elif node_type == "output":
                # Output node
                return {"output": state.get("input", {}), "node_id": node_id}
            
            else:
                # Default passthrough
                return {"output": state.get("input", {}), "node_id": node_id}
        
        return node_func
    
    def _apply_transform(self, input_data: Any, transform_func: Any) -> Any:
        """Apply a transform function to input data."""
        # Simplified transform application
        # In production, this would execute the actual transform logic
        return input_data
    
    async def execute_graph(
        self,
        graph: CompiledStateGraph,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a Langgraph workflow."""
        try:
            # Create initial state
            initial_state = {"input": input_data}
            
            # Execute graph
            result = await graph.ainvoke(initial_state)
            
            return {
                "output": result.get("output", result),
                "state": result,
                "success": True
            }
        except Exception as e:
            return {
                "output": None,
                "error": str(e),
                "success": False
            }
    
    async def stream_execution(
        self,
        graph: CompiledStateGraph,
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

