"""Agent API endpoints."""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.models.workflow import AgentConfig
from app.services.agent_service import AgentService
from app.services.mcp_adapter import MCPAdapter
from app.utils.workflow_validator import WorkflowValidator

router = APIRouter()
_agent_service = AgentService()
_mcp_adapter = MCPAdapter()


@router.post("/agents/execute", response_model=Dict[str, Any])
async def execute_agent(agent_config: AgentConfig, input_text: str):
    """Execute an agent directly."""
    try:
        agent = await _agent_service.create_agent(agent_config)
        result = await _agent_service.execute_agent(agent, input_text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents/tools", response_model=List[Dict[str, Any]])
async def get_agent_tools(persona: str = None):
    """Get available tools for agents."""
    if persona:
        tools = await _mcp_adapter.get_tools_for_persona(persona)
        return [{"id": tool.mcp_tool_id, "name": tool.name, "description": tool.description} for tool in tools]
    else:
        # Return all tools (would need to fetch from MCP registry)
        return []


@router.get("/agents/types", response_model=List[str])
async def get_agent_types():
    """Get available agent types."""
    return ["react", "openai-functions", "plan-and-execute", "conversational"]


@router.post("/agents/validate", response_model=Dict[str, Any])
async def validate_agent_config(agent_config: AgentConfig):
    """Validate agent configuration."""
    is_valid, errors = WorkflowValidator.validate_agent_config(agent_config.dict())
    
    return {
        "valid": is_valid,
        "errors": errors
    }


@router.post("/agents/{persona}/execute", response_model=Dict[str, Any])
async def execute_agent_with_persona(persona: str, input_text: str, agent_type: str = "react"):
    """Execute an agent with a specific persona."""
    # Get tools for persona
    tools = await _mcp_adapter.get_tools_for_persona(persona)
    
    # Create agent config
    agent_config = AgentConfig(
        agentType=agent_type,
        llmProvider="openai",
        llmModel="gpt-4",
        persona=persona
    )
    
    # Create and execute agent
    agent = await _agent_service.create_agent(agent_config, tools)
    result = await _agent_service.execute_agent(agent, input_text)
    
    return result

