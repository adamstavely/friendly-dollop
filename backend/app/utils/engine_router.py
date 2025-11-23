"""Engine router for workflow execution."""
from app.models.engine import WorkflowEngine
from app.models.workflow import Workflow
from app.services.workflow_executor import WorkflowExecutor


class EngineRouter:
    """Router for selecting and executing workflows with different engines."""
    
    def __init__(self):
        self.executor = WorkflowExecutor()
    
    async def route_execution(
        self,
        workflow: Workflow,
        definition,
        input_data: dict = None
    ):
        """Route workflow execution to appropriate engine."""
        return await self.executor.execute_workflow(workflow, definition, input_data)
    
    def validate_workflow(self, workflow: Workflow) -> bool:
        """Validate workflow configuration for its engine."""
        if workflow.engine == WorkflowEngine.LANGGRAPH:
            # Validate Langgraph requirements
            return True  # Simplified
        
        elif workflow.engine == WorkflowEngine.LANGCHAIN:
            if workflow.workflowType == "agent":
                return workflow.agentConfig is not None
            elif workflow.workflowType == "chain":
                return workflow.chainConfig is not None
            return True
        
        elif workflow.engine == WorkflowEngine.FLOWISE:
            # Validate Flowise requirements
            return workflow.flowiseId is not None
        
        return False

