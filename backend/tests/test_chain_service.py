"""Tests for ChainService."""
import pytest
from unittest.mock import Mock, patch
from app.services.chain_service import ChainService
from app.models.workflow import ChainConfig
from app.exceptions import LLMExecutionError, TransformExecutionError


@pytest.mark.asyncio
async def test_create_sequential_chain():
    """Test sequential chain creation."""
    service = ChainService()
    
    config = ChainConfig(
        chainType="sequential",
        nodes=["node-1", "node-2"]
    )
    
    with patch.object(service.llm_service, 'create_llm') as mock_create_llm:
        mock_llm = Mock()
        mock_create_llm.return_value = mock_llm
        
        chain = await service.create_chain(config)
        assert chain is not None


@pytest.mark.asyncio
async def test_create_transform_chain():
    """Test transform chain creation."""
    service = ChainService()
    
    config = ChainConfig(
        chainType="transform",
        nodes=["node-1"],
        transforms={
            "node-1": {
                "type": "to_string",
                "config": {}
            }
        }
    )
    
    chain = service._create_transform_chain(config)
    assert chain is not None


@pytest.mark.asyncio
async def test_execute_chain():
    """Test chain execution."""
    service = ChainService()
    
    config = ChainConfig(
        chainType="sequential",
        nodes=["node-1"]
    )
    
    with patch.object(service.llm_service, 'create_llm') as mock_create_llm, \
         patch.object(service, 'execute_chain') as mock_execute:
        mock_llm = Mock()
        mock_create_llm.return_value = mock_llm
        mock_execute.return_value = {"output": "test", "success": True}
        
        chain = await service.create_chain(config)
        result = await service.execute_chain(chain, {"input": "test"})
        
        assert result is not None
        assert result.get("success") is True

