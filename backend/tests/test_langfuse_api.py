"""Tests for LangFuse API endpoints."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import patch, AsyncMock, MagicMock

client = TestClient(app)


@pytest.fixture
def mock_langfuse_service():
    """Create a mock LangFuse service."""
    service = MagicMock()
    service.get_traces = AsyncMock(return_value={
        "traces": [],
        "total": 0,
        "page": 1,
        "limit": 50
    })
    service.get_trace = AsyncMock(return_value=None)
    service.search_traces = AsyncMock(return_value=[])
    service.get_prompts = AsyncMock(return_value=[])
    service.create_prompt = AsyncMock(return_value={
        "id": "prompt-1",
        "name": "Test Prompt",
        "prompt": "Test content"
    })
    service.get_analytics = AsyncMock(return_value={
        "totalTraces": 100,
        "successRate": 0.95,
        "averageLatency": 1200,
        "totalCost": 50.0,
        "errorRate": 0.05
    })
    return service


def test_list_traces(mock_langfuse_service):
    """Test listing traces endpoint."""
    with patch("app.api.langfuse.get_langfuse_service", return_value=mock_langfuse_service):
        response = client.get("/api/langfuse/traces")
        assert response.status_code == 200
        data = response.json()
        assert "traces" in data
        assert "total" in data


def test_get_trace_not_found(mock_langfuse_service):
    """Test getting trace that doesn't exist."""
    with patch("app.api.langfuse.get_langfuse_service", return_value=mock_langfuse_service):
        response = client.get("/api/langfuse/traces/nonexistent")
        assert response.status_code == 404


def test_search_traces(mock_langfuse_service):
    """Test searching traces endpoint."""
    with patch("app.api.langfuse.get_langfuse_service", return_value=mock_langfuse_service):
        response = client.post("/api/langfuse/traces/search", json={"query": "test"})
        assert response.status_code == 200
        data = response.json()
        assert "traces" in data


def test_list_prompts(mock_langfuse_service):
    """Test listing prompts endpoint."""
    with patch("app.api.langfuse.get_langfuse_service", return_value=mock_langfuse_service):
        response = client.get("/api/langfuse/prompts")
        assert response.status_code == 200
        data = response.json()
        assert "prompts" in data


def test_create_prompt(mock_langfuse_service):
    """Test creating prompt endpoint."""
    with patch("app.api.langfuse.get_langfuse_service", return_value=mock_langfuse_service):
        response = client.post(
            "/api/langfuse/prompts",
            json={
                "name": "Test Prompt",
                "prompt": "Test content",
                "tags": ["test"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Prompt"


def test_get_analytics(mock_langfuse_service):
    """Test getting analytics endpoint."""
    with patch("app.api.langfuse.get_langfuse_service", return_value=mock_langfuse_service):
        response = client.get("/api/langfuse/analytics")
        assert response.status_code == 200
        data = response.json()
        assert "totalTraces" in data
        assert "successRate" in data

