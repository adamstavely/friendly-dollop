"""Tool registry service for caching and managing MCP tools."""
import httpx
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from app.config import settings


class ToolRegistry:
    """Registry for caching MCP tool definitions."""
    
    def __init__(self, mcp_registry_url: str = None):
        self.mcp_registry_url = mcp_registry_url or settings.mcp_registry_api_url
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cache_timestamps: Dict[str, datetime] = {}
        self._cache_ttl = timedelta(minutes=5)  # 5 minute cache
    
    async def get_tool(self, tool_id: str, force_refresh: bool = False) -> Optional[Dict[str, Any]]:
        """Get tool definition, using cache if available."""
        # Check cache
        if not force_refresh and tool_id in self._cache:
            timestamp = self._cache_timestamps.get(tool_id)
            if timestamp and datetime.now() - timestamp < self._cache_ttl:
                return self._cache[tool_id]
        
        # Fetch from API
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.mcp_registry_url}/tools/{tool_id}",
                    timeout=10.0
                )
                response.raise_for_status()
                tool = response.json()
                
                # Update cache
                self._cache[tool_id] = tool
                self._cache_timestamps[tool_id] = datetime.now()
                
                return tool
        except Exception as e:
            print(f"Error fetching tool {tool_id}: {e}")
            # Return cached version if available, even if expired
            return self._cache.get(tool_id)
    
    async def get_tools(self, tool_ids: List[str]) -> Dict[str, Dict[str, Any]]:
        """Get multiple tools."""
        tools = {}
        for tool_id in tool_ids:
            tool = await self.get_tool(tool_id)
            if tool:
                tools[tool_id] = tool
        return tools
    
    async def validate_tools(self, tool_ids: List[str]) -> Dict[str, bool]:
        """Validate that tools exist and are available."""
        validation = {}
        for tool_id in tool_ids:
            tool = await self.get_tool(tool_id)
            validation[tool_id] = tool is not None
        return validation
    
    def clear_cache(self, tool_id: Optional[str] = None):
        """Clear cache for a specific tool or all tools."""
        if tool_id:
            self._cache.pop(tool_id, None)
            self._cache_timestamps.pop(tool_id, None)
        else:
            self._cache.clear()
            self._cache_timestamps.clear()
    
    async def refresh_tool(self, tool_id: str):
        """Force refresh a tool from the API."""
        return await self.get_tool(tool_id, force_refresh=True)

