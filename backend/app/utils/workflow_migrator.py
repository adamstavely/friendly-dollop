"""Workflow migration between engines."""
from typing import Dict, Any
from app.models.workflow import Workflow, WorkflowDefinition
from app.models.engine import WorkflowEngine
from app.utils.workflow_converter import WorkflowConverter


class WorkflowMigrator:
    """Migrate workflows between engines."""
    
    def __init__(self):
        self.converter = WorkflowConverter()
    
    async def migrate_workflow(
        self,
        workflow: Workflow,
        definition: WorkflowDefinition,
        target_engine: WorkflowEngine
    ) -> Dict[str, Any]:
        """Migrate workflow to target engine."""
        if workflow.engine == target_engine:
            return {
                "success": True,
                "message": "Workflow already uses target engine",
                "workflow": workflow
            }
        
        # Create backup of original
        original_workflow = workflow.copy(deep=True)
        original_definition = definition.copy(deep=True)
        
        # Perform migration
        if target_engine == WorkflowEngine.LANGGRAPH:
            migrated = await self._migrate_to_langgraph(workflow, definition)
        elif target_engine == WorkflowEngine.LANGCHAIN:
            migrated = await self._migrate_to_langchain(workflow, definition)
        elif target_engine == WorkflowEngine.FLOWISE:
            migrated = await self._migrate_to_flowise(workflow, definition)
        else:
            return {
                "success": False,
                "error": f"Unknown target engine: {target_engine}"
            }
        
        return {
            "success": True,
            "original_workflow": original_workflow,
            "migrated_workflow": migrated["workflow"],
            "migrated_definition": migrated["definition"]
        }
    
    async def _migrate_to_langgraph(
        self,
        workflow: Workflow,
        definition: WorkflowDefinition
    ) -> Dict[str, Any]:
        """Migrate workflow to Langgraph."""
        # Update workflow engine
        workflow.engine = WorkflowEngine.LANGGRAPH
        workflow.workflowType = "graph"
        
        # Convert definition
        graph_config = self.converter.convert_to_langgraph(definition)
        definition.langgraphConfig = graph_config
        
        # Detect and set state schema if not present
        if not definition.stateSchema:
            definition.stateSchema = {
                "input": {"type": "object"},
                "output": {"type": "object"},
                "intermediate": {"type": "object"}
            }
        
        return {
            "workflow": workflow,
            "definition": definition
        }
    
    async def _migrate_to_langchain(
        self,
        workflow: Workflow,
        definition: WorkflowDefinition
    ) -> Dict[str, Any]:
        """Migrate workflow to Langchain."""
        # Detect workflow type
        workflow_type = self.converter.detect_workflow_type(definition)
        
        workflow.engine = WorkflowEngine.LANGCHAIN
        workflow.workflowType = workflow_type
        
        if workflow_type == "agent":
            # Convert to agent config
            agent_config = self.converter.convert_to_langchain_agent(definition)
            from app.models.workflow import AgentConfig
            workflow.agentConfig = AgentConfig(**agent_config)
        elif workflow_type == "chain":
            # Convert to chain config
            chain_config = self.converter.convert_to_langchain_chain(definition)
            from app.models.workflow import ChainConfig
            workflow.chainConfig = ChainConfig(**chain_config)
        
        return {
            "workflow": workflow,
            "definition": definition
        }
    
    async def _migrate_to_flowise(
        self,
        workflow: Workflow,
        definition: WorkflowDefinition
    ) -> Dict[str, Any]:
        """Migrate workflow to Flowise."""
        workflow.engine = WorkflowEngine.FLOWISE
        
        # Store original definition in flowiseData
        workflow.flowiseData = definition.dict()
        
        return {
            "workflow": workflow,
            "definition": definition
        }

