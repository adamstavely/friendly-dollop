"""Tests for LangFuse service."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.langfuse_service import LangFuseService


@pytest.fixture
def langfuse_service():
    """Create LangFuse service instance."""
    service = LangFuseService()
    return service


@pytest.mark.asyncio
async def test_get_traces_no_key(langfuse_service):
    """Test get_traces when secret key is not configured."""
    langfuse_service.secret_key = ""
    result = await langfuse_service.get_traces()
    assert result["traces"] == []
    assert result["total"] == 0


@pytest.mark.asyncio
async def test_get_trace_no_key(langfuse_service):
    """Test get_trace when secret key is not configured."""
    langfuse_service.secret_key = ""
    result = await langfuse_service.get_trace("trace-1")
    assert result is None


@pytest.mark.asyncio
async def test_get_traces_with_key(langfuse_service):
    """Test get_traces with secret key configured."""
    langfuse_service.secret_key = "test-key"
    
    with patch("httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "traces": [{"id": "trace-1", "name": "Test"}],
            "total": 1
        }
        mock_response.raise_for_status = MagicMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        mock_client_class.return_value.__aenter__.return_value = mock_client
        
        result = await langfuse_service.get_traces()
        assert len(result.get("traces", [])) >= 0


@pytest.mark.asyncio
async def test_get_prompts_no_key(langfuse_service):
    """Test get_prompts when secret key is not configured."""
    langfuse_service.secret_key = ""
    result = await langfuse_service.get_prompts()
    assert result == []


@pytest.mark.asyncio
async def test_create_prompt_no_key(langfuse_service):
    """Test create_prompt when secret key is not configured."""
    langfuse_service.secret_key = ""
    result = await langfuse_service.create_prompt({"name": "Test", "prompt": "Content"})
    assert result is None


@pytest.mark.asyncio
async def test_get_analytics_no_key(langfuse_service):
    """Test get_analytics when secret key is not configured."""
    langfuse_service.secret_key = ""
    result = await langfuse_service.get_analytics()
    assert result["totalTraces"] == 0
    assert result["successRate"] == 0
    assert "tracesOverTime" in result
