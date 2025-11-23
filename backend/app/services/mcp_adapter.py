"""MCP tool adapter for Langchain integration."""
import httpx
from typing import List, Dict, Any, Optional, Type
from langchain.tools import BaseTool
from pydantic import BaseModel, Field
from app.config import settings


class MCPToolInput(BaseModel):
    """Input schema for MCP tool."""
    pass  # Will be dynamically generated from MCP tool schema


class MCPToolWrapper(BaseTool):
    """Wrapper to convert MCP tools to Langchain tools."""
    
    name: str
    description: str
    mcp_tool_id: str
    mcp_tool_schema: Dict[str, Any] = {}
    mcp_registry_url: str = settings.mcp_registry_api_url
    
    class Config:
        arbitrary_types_allowed = True
    
    def _run(self, **kwargs: Any) -> str:
        """Execute the MCP tool."""
        try:
            # Call MCP tool execution endpoint
            with httpx.Client() as client:
                response = client.post(
                    f"{self.mcp_registry_url}/tools/{self.mcp_tool_id}/execute",
                    json=kwargs,
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()
                return str(result.get("output", result))
        except Exception as e:
            return f"Error executing MCP tool {self.mcp_tool_id}: {str(e)}"
    
    async def _arun(self, **kwargs: Any) -> str:
        """Async execute the MCP tool."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.mcp_registry_url}/tools/{self.mcp_tool_id}/execute",
                    json=kwargs,
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()
                return str(result.get("output", result))
        except Exception as e:
            return f"Error executing MCP tool {self.mcp_tool_id}: {str(e)}"


class MCPAdapter:
    """Adapter for converting MCP tools to Langchain tools."""
    
    def __init__(self, mcp_registry_url: str = None):
        self.mcp_registry_url = mcp_registry_url or settings.mcp_registry_api_url
        self._tool_cache: Dict[str, Dict[str, Any]] = {}
    
    async def get_mcp_tool(self, tool_id: str) -> Optional[Dict[str, Any]]:
        """Fetch MCP tool definition from registry."""
        if tool_id in self._tool_cache:
            return self._tool_cache[tool_id]
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.mcp_registry_url}/tools/{tool_id}",
                    timeout=10.0
                )
                response.raise_for_status()
                tool = response.json()
                self._tool_cache[tool_id] = tool
                return tool
        except Exception as e:
            print(f"Error fetching MCP tool {tool_id}: {e}")
            return None
    
    def create_langchain_tool(self, mcp_tool: Dict[str, Any]) -> MCPToolWrapper:
        """Create a Langchain tool from MCP tool definition."""
        tool_id = mcp_tool.get("toolId") or mcp_tool.get("id")
        name = mcp_tool.get("name", tool_id)
        description = mcp_tool.get("description", f"MCP tool: {name}")
        
        # Get schema from latest version
        schema = {}
        versions = mcp_tool.get("versions", [])
        if versions:
            latest_version = versions[-1]
            schema = latest_version.get("schema", {})
        
        return MCPToolWrapper(
            name=name,
            description=description,
            mcp_tool_id=tool_id,
            mcp_tool_schema=schema
        )
    
    
    def _get_python_type(self, json_type: str) -> type:
        """Convert JSON schema type to Python type."""
        type_mapping = {
            "string": str,
            "number": float,
            "integer": int,
            "boolean": bool,
            "array": list,
            "object": dict
        }
        return type_mapping.get(json_type, str)
    
    async def get_tools_for_persona(self, persona: str) -> List[MCPToolWrapper]:
        """Get MCP tools available for a specific persona."""
        try:
            async with httpx.AsyncClient() as client:
                # Get all tools
                response = await client.get(
                    f"{self.mcp_registry_url}/tools",
                    params={"limit": 1000},
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                tools = data.get("tools", [])
                
                # Filter by persona rules
                persona_tools = []
                for tool in tools:
                    persona_rules = tool.get("agentPersonaRules", {})
                    if persona_rules.get(persona, False):
                        langchain_tool = self.create_langchain_tool(tool)
                        persona_tools.append(langchain_tool)
                
                return persona_tools
        except Exception as e:
            print(f"Error fetching tools for persona {persona}: {e}")
            return []

