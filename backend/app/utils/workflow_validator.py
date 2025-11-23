"""Workflow validation utilities."""
from typing import Dict, Any, List, Optional, Tuple
from app.models.workflow import WorkflowDefinition, WorkflowNode, WorkflowConnection
import logging

logger = logging.getLogger(__name__)


class WorkflowValidator:
    """Validator for workflow definitions."""
    
    @staticmethod
    def validate_workflow_definition(definition: WorkflowDefinition) -> Tuple[bool, List[str]]:
        """Validate a workflow definition."""
        errors = []
        
        # Check for nodes
        if not definition.nodes:
            errors.append("Workflow must have at least one node")
        
        # Check for duplicate node IDs
        node_ids = [node.id for node in definition.nodes]
        if len(node_ids) != len(set(node_ids)):
            errors.append("Duplicate node IDs found")
        
        # Check for circular dependencies
        has_circular = WorkflowValidator._check_circular_dependencies(definition.nodes, definition.connections)
        if has_circular:
            errors.append("Circular dependencies detected in workflow")
        
        # Validate node configurations
        for node in definition.nodes:
            node_errors = WorkflowValidator._validate_node(node)
            errors.extend([f"Node {node.id}: {e}" for e in node_errors])
        
        # Validate connections
        for conn in definition.connections:
            conn_errors = WorkflowValidator._validate_connection(conn, definition.nodes)
            errors.extend([f"Connection {conn.id}: {e}" for e in conn_errors])
        
        return len(errors) == 0, errors
    
    @staticmethod
    def _validate_node(node: WorkflowNode) -> List[str]:
        """Validate a single node."""
        errors = []
        
        if not node.id:
            errors.append("Node ID is required")
        
        if not node.type:
            errors.append("Node type is required")
        
        # Validate node type
        valid_types = ["input", "output", "mcp-tool", "llm", "transform", "condition", "output"]
        if node.type not in valid_types:
            errors.append(f"Invalid node type: {node.type}. Valid types: {', '.join(valid_types)}")
        
        # Validate MCP tool node
        if node.type == "mcp-tool" and not node.mcpToolId:
            errors.append("MCP tool node must have mcpToolId")
        
        # Validate LLM node configuration
        if node.type == "llm":
            llm_config = node.data.get("llm", {}) if node.data else {}
            if not llm_config.get("provider") and not node.data.get("provider"):
                errors.append("LLM node must have provider configuration")
            if not llm_config.get("model") and not node.data.get("model"):
                errors.append("LLM node must have model configuration")
        
        return errors
    
    @staticmethod
    def _validate_connection(conn: WorkflowConnection, nodes: List[WorkflowNode]) -> List[str]:
        """Validate a connection."""
        errors = []
        
        node_ids = {node.id for node in nodes}
        
        if conn.source not in node_ids:
            errors.append(f"Source node '{conn.source}' not found")
        
        if conn.target not in node_ids:
            errors.append(f"Target node '{conn.target}' not found")
        
        if conn.source == conn.target:
            errors.append("Connection cannot connect a node to itself")
        
        return errors
    
    @staticmethod
    def _check_circular_dependencies(nodes: List[WorkflowNode], connections: List[WorkflowConnection]) -> bool:
        """Check for circular dependencies using DFS."""
        # Build adjacency list
        graph = {node.id: [] for node in nodes}
        for conn in connections:
            if conn.source in graph:
                graph[conn.source].append(conn.target)
        
        # Check for cycles using DFS
        visited = set()
        rec_stack = set()
        
        def has_cycle(node_id: str) -> bool:
            visited.add(node_id)
            rec_stack.add(node_id)
            
            for neighbor in graph.get(node_id, []):
                if neighbor not in visited:
                    if has_cycle(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            
            rec_stack.remove(node_id)
            return False
        
        for node_id in graph:
            if node_id not in visited:
                if has_cycle(node_id):
                    return True
        
        return False
    
    @staticmethod
    def validate_agent_config(config: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate agent configuration."""
        errors = []
        
        if not config.get("agentType"):
            errors.append("Agent type is required")
        
        if not config.get("llmProvider"):
            errors.append("LLM provider is required")
        
        if not config.get("llmModel"):
            errors.append("LLM model is required")
        
        valid_agent_types = ["react", "openai-functions", "plan-and-execute", "conversational"]
        if config.get("agentType") and config.get("agentType") not in valid_agent_types:
            errors.append(f"Invalid agent type. Valid types: {', '.join(valid_agent_types)}")
        
        valid_providers = ["openai", "anthropic", "claude"]
        if config.get("llmProvider") and config.get("llmProvider") not in valid_providers:
            errors.append(f"Invalid LLM provider. Valid providers: {', '.join(valid_providers)}")
        
        return len(errors) == 0, errors
    
    @staticmethod
    def validate_chain_config(config: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate chain configuration."""
        errors = []
        
        if not config.get("chainType"):
            errors.append("Chain type is required")
        
        if not config.get("nodes"):
            errors.append("Chain must have at least one node")
        
        valid_chain_types = ["sequential", "transform", "router"]
        if config.get("chainType") and config.get("chainType") not in valid_chain_types:
            errors.append(f"Invalid chain type. Valid types: {', '.join(valid_chain_types)}")
        
        return len(errors) == 0, errors
    
    @staticmethod
    def validate_langgraph_config(config: Dict[str, Any], definition: Optional[WorkflowDefinition] = None) -> Tuple[bool, List[str]]:
        """Validate LangGraph configuration."""
        errors = []
        
        # Validate state schema if provided
        if definition and definition.stateSchema:
            from app.utils.state_validator import StateValidator
            validator = StateValidator()
            is_valid, error = validator.validate_state_schema(definition.stateSchema)
            if not is_valid:
                errors.append(f"Invalid state schema: {error}")
        
        return len(errors) == 0, errors

