"""Langchain agent service."""
from typing import List, Dict, Any, Optional
from langchain.agents import AgentExecutor, create_react_agent, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langchain.tools import BaseTool
from app.services.mcp_adapter import MCPAdapter
from app.models.workflow import AgentConfig


class AgentService:
    """Service for creating and executing Langchain agents."""
    
    def __init__(self):
        self.mcp_adapter = MCPAdapter()
        self._agent_cache: Dict[str, AgentExecutor] = {}
    
    async def create_agent(
        self,
        agent_config: AgentConfig,
        tools: Optional[List[BaseTool]] = None
    ) -> AgentExecutor:
        """Create a Langchain agent from configuration."""
        # Get tools if not provided
        if tools is None:
            if agent_config.tools:
                # Get MCP tools
                mcp_tools = []
                for tool_id in agent_config.tools:
                    mcp_tool = await self.mcp_adapter.get_mcp_tool(tool_id)
                    if mcp_tool:
                        langchain_tool = self.mcp_adapter.create_langchain_tool(mcp_tool)
                        mcp_tools.append(langchain_tool)
                tools = mcp_tools
            elif agent_config.persona:
                # Get tools for persona
                tools = await self.mcp_adapter.get_tools_for_persona(agent_config.persona)
            else:
                tools = []
        
        # Create LLM
        llm = self._create_llm(agent_config)
        
        # Create agent based on type
        if agent_config.agentType == "react":
            agent = self._create_react_agent(llm, tools, agent_config)
        elif agent_config.agentType == "openai-functions":
            agent = self._create_openai_functions_agent(llm, tools, agent_config)
        else:
            # Default to ReAct
            agent = self._create_react_agent(llm, tools, agent_config)
        
        # Create executor
        executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            handle_parsing_errors=True
        )
        
        return executor
    
    def _create_llm(self, config: AgentConfig):
        """Create LLM from configuration."""
        if config.llmProvider == "openai":
            return ChatOpenAI(
                model=config.llmModel or "gpt-4",
                temperature=config.temperature or 0.7,
                max_tokens=config.maxTokens
            )
        else:
            # Default to OpenAI
            return ChatOpenAI(
                model=config.llmModel or "gpt-4",
                temperature=config.temperature or 0.7
            )
    
    def _create_react_agent(self, llm, tools: List[BaseTool], config: AgentConfig):
        """Create a ReAct agent."""
        system_message = config.systemMessage or "You are a helpful assistant."
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_message),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        return create_react_agent(llm, tools, prompt)
    
    def _create_openai_functions_agent(self, llm, tools: List[BaseTool], config: AgentConfig):
        """Create an OpenAI functions agent."""
        system_message = config.systemMessage or "You are a helpful assistant."
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_message),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        return create_openai_functions_agent(llm, tools, prompt)
    
    async def execute_agent(
        self,
        agent: AgentExecutor,
        input_text: str,
        chat_history: Optional[List] = None
    ) -> Dict[str, Any]:
        """Execute an agent with input."""
        try:
            result = await agent.ainvoke({
                "input": input_text,
                "chat_history": chat_history or []
            })
            
            return {
                "output": result.get("output", ""),
                "intermediate_steps": result.get("intermediate_steps", []),
                "tool_calls": self._extract_tool_calls(result.get("intermediate_steps", [])),
                "reasoning": self._extract_reasoning(result)
            }
        except Exception as e:
            return {
                "output": f"Error: {str(e)}",
                "error": str(e)
            }
    
    def _extract_tool_calls(self, intermediate_steps: List) -> List[Dict[str, Any]]:
        """Extract tool calls from intermediate steps."""
        tool_calls = []
        for step in intermediate_steps:
            if isinstance(step, tuple) and len(step) >= 2:
                action, observation = step[0], step[1]
                tool_calls.append({
                    "tool": getattr(action, "tool", "unknown"),
                    "input": getattr(action, "tool_input", {}),
                    "output": str(observation)
                })
        return tool_calls
    
    def _extract_reasoning(self, result: Dict[str, Any]) -> List[str]:
        """Extract reasoning steps from agent execution."""
        # This would parse the agent's reasoning from intermediate steps
        # For now, return empty list
        return []

