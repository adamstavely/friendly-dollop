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
    
    async def execute_prompt(
        self,
        prompt_id: str,
        variables: Dict[str, Any],
        options: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Execute a prompt with variables."""
        if not self.secret_key:
            # Mock execution
            return {
                "output": f"Mock output for prompt {prompt_id}",
                "latency": 500,
                "tokenUsage": {
                    "promptTokens": 100,
                    "completionTokens": 50,
                    "totalTokens": 150
                },
                "cost": 0.001
            }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/public/prompts/{prompt_id}/execute",
                    headers=self._get_headers(),
                    json={"variables": variables, "options": options},
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError:
            return None
    
    async def compare_prompt_versions(
        self,
        prompt_id: str,
        versions: List[str],
        test_inputs: Dict[str, Any]
    ) -> Optional[List[Dict[str, Any]]]:
        """Compare multiple prompt versions."""
        if not self.secret_key:
            # Mock comparison
            return [
                {
                    "promptId": prompt_id,
                    "version": v,
                    "result": {
                        "output": f"Mock output for version {v}",
                        "latency": 500 + int(v) * 50
                    },
                    "metrics": {
                        "latency": 500 + int(v) * 50,
                        "cost": 0.001,
                        "tokenUsage": {
                            "promptTokens": 100,
                            "completionTokens": 50,
                            "totalTokens": 150
                        }
                    }
                }
                for v in versions
            ]
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/public/prompts/{prompt_id}/compare",
                    headers=self._get_headers(),
                    json={"versions": versions, "testInputs": test_inputs},
                    timeout=60.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError:
            return None
    
    async def batch_evaluate_prompt(
        self,
        prompt_id: str,
        test_cases: List[Dict[str, Any]],
        version: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """Run batch evaluation on a test dataset."""
        if not self.secret_key:
            # Mock batch evaluation
            results = []
            for i, test_case in enumerate(test_cases):
                results.append({
                    "testCaseId": test_case.get("id", f"case-{i}"),
                    "inputs": test_case.get("inputs", {}),
                    "expectedOutput": test_case.get("expectedOutput"),
                    "actualOutput": f"Mock output for test case {i}",
                    "passed": True,
                    "latency": 500 + i * 10,
                    "tokenUsage": {
                        "promptTokens": 100,
                        "completionTokens": 50,
                        "totalTokens": 150
                    }
                })
            
            passed = len([r for r in results if r["passed"]])
            total = len(results)
            
            return {
                "results": results,
                "summary": {
                    "total": total,
                    "passed": passed,
                    "failed": total - passed,
                    "passRate": passed / total if total > 0 else 0,
                    "averageLatency": sum(r["latency"] for r in results) / total if total > 0 else 0,
                    "totalCost": sum(0.001 for _ in results)
                }
            }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/public/prompts/{prompt_id}/batch-evaluate",
                    headers=self._get_headers(),
                    json={"testCases": test_cases, "version": version},
                    timeout=300.0  # Longer timeout for batch operations
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError:
            return None
    
    async def estimate_prompt_cost(
        self,
        prompt_id: str,
        variables: Dict[str, Any],
        model: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Estimate token cost for a prompt."""
        # Model pricing (per 1K tokens) - approximate values
        model_pricing = {
            "gpt-4": {"prompt": 0.03, "completion": 0.06},
            "gpt-4-turbo": {"prompt": 0.01, "completion": 0.03},
            "gpt-3.5-turbo": {"prompt": 0.0015, "completion": 0.002},
            "default": {"prompt": 0.002, "completion": 0.002}
        }
        
        model_key = model or "default"
        pricing = model_pricing.get(model_key, model_pricing["default"])
        
        # Get prompt to estimate tokens
        prompt = await self.get_prompt(prompt_id)
        if not prompt:
            return None
        
        prompt_text = prompt.get("prompt", "")
        
        # Simple token estimation (4 chars per token approximation)
        estimated_prompt_tokens = len(prompt_text) // 4
        estimated_completion_tokens = estimated_prompt_tokens // 2  # Rough estimate
        
        estimated_cost = (
            (estimated_prompt_tokens / 1000) * pricing["prompt"] +
            (estimated_completion_tokens / 1000) * pricing["completion"]
        )
        
        return {
            "estimatedTokens": estimated_prompt_tokens + estimated_completion_tokens,
            "estimatedPromptTokens": estimated_prompt_tokens,
            "estimatedCompletionTokens": estimated_completion_tokens,
            "estimatedCost": estimated_cost,
            "model": model_key,
            "pricing": pricing
        }
    
    async def get_prompt_analytics(
        self,
        prompt_id: str,
        from_timestamp: Optional[str] = None,
        to_timestamp: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Get performance analytics for a prompt."""
        if not self.secret_key:
            # Mock analytics
            return {
                "promptId": prompt_id,
                "totalExecutions": 0,
                "averageLatency": 0,
                "averageCost": 0,
                "totalCost": 0,
                "successRate": 0,
                "errorRate": 0,
                "executionsOverTime": [],
                "latencyTrend": [],
                "costTrend": [],
                "versionPerformance": []
            }
        
        try:
            # Get traces related to this prompt
            traces = await self.search_traces(f"prompt:{prompt_id}", limit=1000)
            
            # Filter by timestamp if provided
            if from_timestamp or to_timestamp:
                # Filter logic would go here
                pass
            
            # Calculate analytics from traces
            total_executions = len(traces)
            if total_executions == 0:
                return {
                    "promptId": prompt_id,
                    "totalExecutions": 0,
                    "averageLatency": 0,
                    "averageCost": 0,
                    "totalCost": 0,
                    "successRate": 0,
                    "errorRate": 0,
                    "executionsOverTime": [],
                    "latencyTrend": [],
                    "costTrend": [],
                    "versionPerformance": []
                }
            
            latencies = []
            costs = []
            successes = 0
            
            for trace in traces:
                if "latency" in trace:
                    latencies.append(trace["latency"])
                if "cost" in trace:
                    costs.append(trace["cost"])
                if trace.get("status") == "success":
                    successes += 1
            
            avg_latency = sum(latencies) / len(latencies) if latencies else 0
            avg_cost = sum(costs) / len(costs) if costs else 0
            total_cost = sum(costs) if costs else 0
            success_rate = successes / total_executions if total_executions > 0 else 0
            
            return {
                "promptId": prompt_id,
                "totalExecutions": total_executions,
                "averageLatency": avg_latency,
                "averageCost": avg_cost,
                "totalCost": total_cost,
                "successRate": success_rate,
                "errorRate": 1 - success_rate,
                "executionsOverTime": [],  # Would need time-series aggregation
                "latencyTrend": [],
                "costTrend": [],
                "versionPerformance": []
            }
        except Exception:
            return None
    
    async def rollback_prompt_version(
        self,
        prompt_id: str,
        target_version: int
    ) -> Optional[Dict[str, Any]]:
        """Rollback a prompt to a previous version."""
        if not self.secret_key:
            return None
        
        try:
            # Get the target version
            versions = await self.get_prompt_versions(prompt_id)
            target_version_data = next(
                (v for v in versions if v.get("version") == target_version),
                None
            )
            
            if not target_version_data:
                return None
            
            # Update prompt with target version content
            result = await self.update_prompt(prompt_id, {
                "prompt": target_version_data.get("prompt") or target_version_data.get("content", ""),
                "labels": target_version_data.get("labels", []),
                "config": target_version_data.get("config", {})
            })
            
            return result
        except Exception:
            return None


# Singleton instance
_langfuse_service = None

def get_langfuse_service() -> LangFuseService:
    """Get LangFuse service instance."""
    global _langfuse_service
    if _langfuse_service is None:
        _langfuse_service = LangFuseService()
    return _langfuse_service

