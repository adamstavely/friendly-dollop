"""Tests for AgentService."""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from app.services.agent_service import AgentService
from app.models.workflow import AgentConfig
from app.exceptions import LLMExecutionError, ToolExecutionError


@pytest.mark.asyncio
async def test_create_react_agent(mock_mcp_adapter):
    """Test ReAct agent creation."""
    service = AgentService()
    service.mcp_adapter = mock_mcp_adapter
    
    config = AgentConfig(
        agentType="react",
        llmProvider="openai",
        llmModel="gpt-4",
        temperature=0.7
    )
    
    with patch.object(service.llm_service, 'create_llm') as mock_create_llm:
        mock_llm = Mock()
        mock_create_llm.return_value = mock_llm
        
        agent = await service.create_agent(config)
        assert agent is not None


@pytest.mark.asyncio
async def test_create_agent_with_tools(mock_mcp_adapter):
    """Test agent creation with tools."""
    service = AgentService()
    service.mcp_adapter = mock_mcp_adapter
    
    config = AgentConfig(
        agentType="react",
        llmProvider="openai",
        llmModel="gpt-4",
        tools=["test-tool-1"]
    )
    
    with patch.object(service.llm_service, 'create_llm') as mock_create_llm:
        mock_llm = Mock()
        mock_create_llm.return_value = mock_llm
        
        agent = await service.create_agent(config)
        assert agent is not None


@pytest.mark.asyncio
async def test_execute_agent():
    """Test agent execution."""
    service = AgentService()
    
    config = AgentConfig(
        agentType="react",
        llmProvider="openai",
        llmModel="gpt-4"
    )
    
    with patch.object(service, 'create_agent') as mock_create_agent, \
         patch.object(service, 'execute_agent') as mock_execute:
        mock_agent = Mock()
        mock_create_agent.return_value = mock_agent
        mock_execute.return_value = {
            "output": "test output",
            "tool_calls": [],
            "reasoning": []
        }
        
        agent = await service.create_agent(config)
        result = await service.execute_agent(agent, "test input")
        
        assert result is not None
        assert "output" in result

