"""Convert workflow definitions to Langchain/Langgraph formats."""
from typing import Dict, Any, List
from app.models.workflow import WorkflowDefinition, WorkflowNode, WorkflowConnection
from app.models.engine import WorkflowEngine


class WorkflowConverter:
    """Converter for workflow definitions."""
    
    def __init__(self):
        self.node_type_mapping = {
            "input": "input",
            "output": "output",
            "mcp-tool": "tool",
            "llm": "llm",
            "condition": "condition",
            "transform": "transform"
        }
    
    def convert_to_langgraph(self, definition: WorkflowDefinition) -> Dict[str, Any]:
        """Convert workflow definition to Langgraph StateGraph format."""
        graph_config = {
            "nodes": [],
            "edges": [],
            "state_schema": definition.stateSchema or {}
        }
        
        # Convert nodes
        for node in definition.nodes:
            graph_node = {
                "id": node.id,
                "type": self.node_type_mapping.get(node.type, node.type),
                "label": node.label,
                "config": node.data,
                "mcp_tool_id": node.mcpToolId
            }
            graph_config["nodes"].append(graph_node)
        
        # Convert connections to edges
        for conn in definition.connections:
            edge = {
                "source": conn.source,
                "target": conn.target,
                "source_handle": conn.sourceHandle,
                "target_handle": conn.targetHandle
            }
            graph_config["edges"].append(edge)
        
        return graph_config
    
    def convert_to_langchain_chain(self, definition: WorkflowDefinition) -> Dict[str, Any]:
        """Convert workflow definition to Langchain chain format."""
        # Sort nodes by connections to determine order
        ordered_nodes = self._topological_sort(definition.nodes, definition.connections)
        
        chain_config = {
            "chain_type": "sequential",  # Default, can be overridden
            "nodes": [],
            "transforms": {}
        }
        
        for node in ordered_nodes:
            chain_node = {
                "id": node.id,
                "type": self.node_type_mapping.get(node.type, node.type),
                "label": node.label,
                "config": node.data,
                "mcp_tool_id": node.mcpToolId
            }
            chain_config["nodes"].append(chain_node)
            
            # Store transforms if any
            if node.type == "transform" and node.data:
                chain_config["transforms"][node.id] = node.data
        
        return chain_config
    
    def convert_to_langchain_agent(self, definition: WorkflowDefinition) -> Dict[str, Any]:
        """Convert workflow definition to Langchain agent format."""
        # Find LLM node
        llm_node = next((n for n in definition.nodes if n.type == "llm"), None)
        
        # Find MCP tool nodes
        tool_nodes = [n for n in definition.nodes if n.type == "mcp-tool" and n.mcpToolId]
        tool_ids = [n.mcpToolId for n in tool_nodes if n.mcpToolId]
        
        agent_config = {
            "agent_type": "react",  # Default
            "llm_config": llm_node.data if llm_node else {},
            "tools": tool_ids,
            "system_message": None,
            "prompt": None
        }
        
        # Extract system message from input node if present
        input_node = next((n for n in definition.nodes if n.type == "input"), None)
        if input_node and input_node.data.get("systemMessage"):
            agent_config["system_message"] = input_node.data["systemMessage"]
        
        return agent_config
    
    def _topological_sort(self, nodes: List[WorkflowNode], connections: List[WorkflowConnection]) -> List[WorkflowNode]:
        """Sort nodes topologically based on connections."""
        node_map = {node.id: node for node in nodes}
        incoming = {node.id: [] for node in nodes}
        outgoing = {node.id: [] for node in nodes}
        
        # Build graph
        for conn in connections:
            outgoing[conn.source].append(conn.target)
            incoming[conn.target].append(conn.source)
        
        # Find nodes with no incoming edges (start nodes)
        queue = [node.id for node in nodes if len(incoming[node.id]) == 0]
        result = []
        visited = set()
        
        while queue:
            node_id = queue.pop(0)
            if node_id in visited:
                continue
            
            visited.add(node_id)
            result.append(node_map[node_id])
            
            # Add nodes that depend on this one
            for target_id in outgoing[node_id]:
                if all(src in visited for src in incoming[target_id]):
                    queue.append(target_id)
        
        # Add any remaining nodes (disconnected)
        for node in nodes:
            if node.id not in visited:
                result.append(node)
        
        return result
    
    def detect_workflow_type(self, definition: WorkflowDefinition) -> str:
        """Detect workflow type from definition."""
        node_types = {node.type for node in definition.nodes}
        
        # If has conditional routing, it's a graph
        if "condition" in node_types:
            return "graph"
        
        # If has LLM and tools, could be agent
        if "llm" in node_types and "mcp-tool" in node_types:
            # Check if it's a simple chain or agent
            if len(definition.connections) <= len(definition.nodes):
                return "agent"
            return "chain"
        
        # If has multiple connections, it's a graph
        if len(definition.connections) > len(definition.nodes):
            return "graph"
        
        # Default to chain
        return "chain"

