"""LangFuse API service for proxying requests to LangFuse."""
import httpx
from typing import Optional, Dict, Any, List
from app.config import settings
import os


class LangFuseService:
    """Service for interacting with LangFuse API."""
    
    def __init__(self):
        # Use environment variables with fallback to config settings
        self.base_url = os.getenv("LANGFUSE_HOST", settings.langfuse_host)
        self.public_key = os.getenv("LANGFUSE_PUBLIC_KEY", settings.langfuse_public_key or "")
        self.secret_key = os.getenv("LANGFUSE_SECRET_KEY", settings.langfuse_secret_key or "")
        self.project_id = os.getenv("LANGFUSE_PROJECT_ID", settings.langfuse_project_id or "")
        
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for LangFuse API requests."""
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
    
    async def get_traces(
        self,
        limit: int = 50,
        page: int = 1,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        name: Optional[str] = None,
        tags: Optional[List[str]] = None,
        from_timestamp: Optional[str] = None,
        to_timestamp: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get traces from LangFuse."""
        if not self.secret_key:
            # Return mock data if not configured
            return {
                "traces": [],
                "total": 0,
                "page": page,
                "limit": limit
            }
        
        params = {
            "limit": limit,
            "page": page
        }
        if user_id:
            params["userId"] = user_id
        if session_id:
            params["sessionId"] = session_id
        if name:
            params["name"] = name
        if tags:
            params["tags"] = ",".join(tags)
        if from_timestamp:
            params["fromTimestamp"] = from_timestamp
        if to_timestamp:
            params["toTimestamp"] = to_timestamp
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/public/traces",
                    headers=self._get_headers(),
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            # Return mock data on error
            return {
                "traces": [],
                "total": 0,
                "page": page,
                "limit": limit
            }
    
    async def get_trace(self, trace_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific trace by ID."""
        if not self.secret_key:
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/public/traces/{trace_id}",
                    headers=self._get_headers(),
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError:
            return None
    
    async def search_traces(self, query: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Search traces."""
        if not self.secret_key:
            return []
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/public/traces/search",
                    headers=self._get_headers(),
                    json={"query": query, "limit": limit},
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("traces", [])
        except httpx.HTTPError:
            return []
    
    async def get_generations(self, trace_id: str) -> List[Dict[str, Any]]:
        """Get generations for a trace."""
        if not self.secret_key:
            return []
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/public/traces/{trace_id}/generations",
                    headers=self._get_headers(),
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("generations", [])
        except httpx.HTTPError:
            return []
    
    async def get_scores(self, trace_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get scores, optionally filtered by trace ID."""
        if not self.secret_key:
            return []
        
        params = {}
        if trace_id:
            params["traceId"] = trace_id
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/public/scores",
                    headers=self._get_headers(),
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("scores", [])
        except httpx.HTTPError:
            return []
    
    async def get_analytics(
        self,
        from_timestamp: Optional[str] = None,
        to_timestamp: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get analytics/metrics."""
        if not self.secret_key:
            return {
                "totalTraces": 0,
                "successRate": 0,
                "averageLatency": 0,
                "totalCost": 0,
                "errorRate": 0,
                "tracesOverTime": [],
                "latencyTrend": [],
                "costTrend": []
            }
        
        params = {}
        if from_timestamp:
            params["fromTimestamp"] = from_timestamp
        if to_timestamp:
            params["toTimestamp"] = to_timestamp
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/public/analytics",
                    headers=self._get_headers(),
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError:
            # Return empty analytics on error
            return {
                "totalTraces": 0,
                "successRate": 0,
                "averageLatency": 0,
                "totalCost": 0,
                "errorRate": 0,
                "tracesOverTime": [],
                "latencyTrend": [],
                "costTrend": []
            }
    
    async def get_prompts(self) -> List[Dict[str, Any]]:
        """Get all prompts."""
        if not self.secret_key:
            return []
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/public/prompts",
                    headers=self._get_headers(),
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("prompts", [])
        except httpx.HTTPError:
            return []
    
    async def get_prompt(self, prompt_id: str, version: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """Get a specific prompt by ID."""
        if not self.secret_key:
            return None
        
        params = {}
        if version:
            params["version"] = version
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/public/prompts/{prompt_id}",
                    headers=self._get_headers(),
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError:
            return None
    
    async def create_prompt(self, prompt_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new prompt."""
        if not self.secret_key:
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/public/prompts",
                    headers=self._get_headers(),
                    json=prompt_data,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError:
            return None
    
    async def update_prompt(self, prompt_id: str, prompt_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a prompt (creates new version)."""
        if not self.secret_key:
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.base_url}/api/public/prompts/{prompt_id}",
                    headers=self._get_headers(),
                    json=prompt_data,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError:
            return None
    
    async def delete_prompt(self, prompt_id: str) -> bool:
        """Delete a prompt."""
        if not self.secret_key:
            return False
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/api/public/prompts/{prompt_id}",
                    headers=self._get_headers(),
                    timeout=30.0
                )
                response.raise_for_status()
                return True
        except httpx.HTTPError:
            return False
    
    async def get_prompt_versions(self, prompt_id: str) -> List[Dict[str, Any]]:
        """Get version history for a prompt."""
        if not self.secret_key:
            return []
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/public/prompts/{prompt_id}/versions",
                    headers=self._get_headers(),
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("versions", [])
        except httpx.HTTPError:
            return []


# Singleton instance
_langfuse_service = None

def get_langfuse_service() -> LangFuseService:
    """Get LangFuse service instance."""
    global _langfuse_service
    if _langfuse_service is None:
        _langfuse_service = LangFuseService()
    return _langfuse_service

