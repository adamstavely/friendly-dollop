"""Workflow execution engine router."""
from typing import Dict, Any, Optional
from app.models.workflow import Workflow, WorkflowDefinition
from app.models.engine import WorkflowEngine
from app.services.agent_service import AgentService
from app.services.chain_service import ChainService
from app.services.langgraph_service import LanggraphService
from app.models.execution import WorkflowExecution, ExecutionStatus
from datetime import datetime
import uuid


class WorkflowExecutor:
    """Router for executing workflows with different engines."""
    
    def __init__(self):
        self.agent_service = AgentService()
        self.chain_service = ChainService()
        self.langgraph_service = LanggraphService()
        self._executions: Dict[str, WorkflowExecution] = {}
    
    async def execute_workflow(
        self,
        workflow: Workflow,
        definition: WorkflowDefinition,
        input_data: Optional[Dict[str, Any]] = None
    ) -> WorkflowExecution:
        """Execute a workflow using the appropriate engine."""
        execution_id = str(uuid.uuid4())
        execution = WorkflowExecution(
            id=execution_id,
            workflowId=workflow.id,
            status=ExecutionStatus.RUNNING,
            startedAt=datetime.now().isoformat(),
            input=input_data or {}
        )
        self._executions[execution_id] = execution
        
        try:
            if workflow.engine == WorkflowEngine.LANGGRAPH:
                result = await self._execute_langgraph(workflow, definition, input_data)
            elif workflow.engine == WorkflowEngine.LANGCHAIN:
                if workflow.workflowType == "agent":
                    result = await self._execute_agent(workflow, definition, input_data)
                elif workflow.workflowType == "chain":
                    result = await self._execute_chain(workflow, definition, input_data)
                else:
                    # Default to chain
                    result = await self._execute_chain(workflow, definition, input_data)
            else:
                # Flowise - would call Flowise API
                result = await self._execute_flowise(workflow, definition, input_data)
            
            # Update execution
            execution.status = ExecutionStatus.COMPLETED
            execution.completedAt = datetime.now().isoformat()
            execution.output = result.get("output")
            execution.state = result.get("state")
            execution.toolCalls = result.get("tool_calls", [])
            execution.reasoningSteps = result.get("reasoning", [])
            
            # Calculate duration
            start_time = datetime.fromisoformat(execution.startedAt)
            end_time = datetime.fromisoformat(execution.completedAt)
            execution.duration = int((end_time - start_time).total_seconds() * 1000)
            
        except Exception as e:
            execution.status = ExecutionStatus.FAILED
            execution.completedAt = datetime.now().isoformat()
            execution.error = str(e)
        
        return execution
    
    async def _execute_langgraph(
        self,
        workflow: Workflow,
        definition: WorkflowDefinition,
        input_data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute Langgraph workflow."""
        graph = await self.langgraph_service.create_graph(definition)
        result = await self.langgraph_service.execute_graph(
            graph,
            input_data or {},
            state_schema=definition.stateSchema,
            enable_checkpointing=True,
            execution_id=execution.id if hasattr(self, '_current_execution') else None
        )
        return result
    
    async def _execute_agent(
        self,
        workflow: Workflow,
        definition: WorkflowDefinition,
        input_data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute Langchain agent workflow."""
        if not workflow.agentConfig:
            raise ValueError("Agent configuration required for agent workflows")
        
        agent = await self.agent_service.create_agent(workflow.agentConfig)
        input_text = str(input_data) if input_data else ""
        result = await self.agent_service.execute_agent(agent, input_text)
        return result
    
    async def _execute_chain(
        self,
        workflow: Workflow,
        definition: WorkflowDefinition,
        input_data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute Langchain chain workflow."""
        if not workflow.chainConfig:
            raise ValueError("Chain configuration required for chain workflows")
        
        llm_config = workflow.langchainConfig.dict() if workflow.langchainConfig else {}
        chain = await self.chain_service.create_chain(workflow.chainConfig, llm_config)
        result = await self.chain_service.execute_chain(chain, input_data or {})
        return result
    
    async def _execute_flowise(
        self,
        workflow: Workflow,
        definition: WorkflowDefinition,
        input_data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute Flowise workflow (placeholder)."""
        # This would call Flowise API
        # For now, return mock result
        return {
            "output": "Flowise execution not implemented",
            "note": "This would call Flowise API"
        }
    
    def get_executor(self, engine: WorkflowEngine):
        """Get executor for specific engine."""
        if engine == WorkflowEngine.LANGGRAPH:
            return self.langgraph_service
        elif engine == WorkflowEngine.LANGCHAIN:
            return self.agent_service  # or chain_service depending on type
        else:
            return None
    
    def get_execution(self, execution_id: str) -> Optional[WorkflowExecution]:
        """Get execution by ID."""
        return self._executions.get(execution_id)
    
    def get_executions(self, workflow_id: str, limit: int = 10) -> list[WorkflowExecution]:
        """Get executions for a workflow."""
        executions = [
            exec for exec in self._executions.values()
            if exec.workflowId == workflow_id
        ]
        # Sort by startedAt descending
        executions.sort(key=lambda x: x.startedAt, reverse=True)
        return executions[:limit]

