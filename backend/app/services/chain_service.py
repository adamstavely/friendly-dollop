"""Langchain chain service."""
from typing import List, Dict, Any, Optional
from langchain.chains import LLMChain, SequentialChain, TransformChain
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain.tools import BaseTool
from app.services.mcp_adapter import MCPAdapter
from app.services.llm_service import LLMService
from app.models.workflow import ChainConfig
from app.exceptions import LLMExecutionError, WorkflowExecutionError, TransformExecutionError
from app.utils.retry import retry_on_failure, RetryConfig
import logging

logger = logging.getLogger(__name__)


class ChainService:
    """Service for creating and executing Langchain chains."""
    
    def __init__(self):
        self.mcp_adapter = MCPAdapter()
        self.llm_service = LLMService()
    
    async def create_chain(
        self,
        chain_config: ChainConfig,
        llm_config: Optional[Dict[str, Any]] = None
    ):
        """Create a Langchain chain from configuration."""
        if chain_config.chainType == "sequential":
            return await self._create_sequential_chain(chain_config, llm_config)
        elif chain_config.chainType == "transform":
            return self._create_transform_chain(chain_config)
        else:
            # Default to sequential
            return await self._create_sequential_chain(chain_config, llm_config)
    
    async def _create_sequential_chain(
        self,
        config: ChainConfig,
        llm_config: Optional[Dict[str, Any]] = None
    ):
        """Create a sequential chain."""
        try:
            # Create LLM
            llm = self._create_llm(llm_config or {})
        
        # Create chains for each node
        chains = []
        for node_id in config.nodes:
            # Get node config (would come from workflow definition)
            # For now, create a simple chain
            prompt = ChatPromptTemplate.from_template("{input}")
            chain = LLMChain(llm=llm, prompt=prompt, output_key=node_id)
            chains.append(chain)
        
        # Create sequential chain
        if len(chains) > 1:
            return SequentialChain(
                chains=chains,
                input_variables=["input"],
                output_variables=[chains[-1].output_key]
            )
        elif chains:
            return chains[0]
        else:
            # Return a passthrough chain
            return TransformChain(
                input_variables=["input"],
                output_variables=["output"],
                transform=lambda x: {"output": x["input"]}
            )
        except Exception as e:
            logger.error(f"Failed to create sequential chain: {str(e)}")
            raise WorkflowExecutionError(
                f"Failed to create sequential chain: {str(e)}",
                error_code="CHAIN_CREATION_ERROR",
                context={"chain_type": "sequential", "original_error": str(e)}
            )
    
    def _create_transform_chain(self, config: ChainConfig):
        """Create a transform chain."""
        try:
            transforms = config.transforms or {}
            
            def transform_func(inputs: Dict[str, Any]) -> Dict[str, Any]:
                try:
                    result = inputs.copy()
                    for node_id, transform in transforms.items():
                        # Apply transform
                        if isinstance(transform, dict):
                            transform_type = transform.get("type", "passthrough")
                            transform_config = transform.get("config", {})
                            # Apply transformation (simplified - could use LangGraph transform service)
                            if transform_type == "merge":
                                merge_data = transform_config.get("data", {})
                                if isinstance(result, dict) and isinstance(merge_data, dict):
                                    result.update(merge_data)
                    return result
                except Exception as e:
                    logger.error(f"Transform execution failed in chain: {str(e)}")
                    raise TransformExecutionError(
                        f"Transform execution failed: {str(e)}",
                        transform_type=transform.get("type", "unknown") if isinstance(transform, dict) else "unknown",
                        context={"node_id": node_id, "original_error": str(e)}
                    )
            
            return TransformChain(
                input_variables=["input"],
                output_variables=["output"],
                transform=transform_func
            )
        except TransformExecutionError:
            raise
        except Exception as e:
            logger.error(f"Failed to create transform chain: {str(e)}")
            raise WorkflowExecutionError(
                f"Failed to create transform chain: {str(e)}",
                error_code="CHAIN_CREATION_ERROR",
                context={"chain_type": "transform", "original_error": str(e)}
            )
    
    def _create_llm(self, config: Dict[str, Any]):
        """Create LLM from configuration."""
        try:
            provider = config.get("provider", "openai")
            model = config.get("model", "gpt-4")
            temperature = config.get("temperature", 0.7)
            max_tokens = config.get("max_tokens")
            api_key = config.get("api_key")
            
            # Use LLMService for consistent LLM creation
            return self.llm_service.create_llm(
                provider=provider,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                api_key=api_key
            )
        except Exception as e:
            logger.error(f"Failed to create LLM: {str(e)}")
            raise LLMExecutionError(
                f"Failed to create LLM: {str(e)}",
                provider=config.get("provider", "openai"),
                model=config.get("model", "unknown"),
                context={"original_error": str(e)}
            )
    
    @retry_on_failure(
        config=RetryConfig(max_attempts=3, initial_delay=1.0),
        retryable_exceptions=(Exception,)
    )
    async def execute_chain(self, chain, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a chain with input."""
        try:
            if hasattr(chain, "ainvoke"):
                result = await chain.ainvoke(input_data)
            else:
                result = chain.invoke(input_data)
            
            return {
                "output": result,
                "success": True
            }
        except TransformExecutionError:
            raise
        except LLMExecutionError:
            raise
        except Exception as e:
            logger.error(f"Chain execution failed: {str(e)}")
            raise WorkflowExecutionError(
                f"Chain execution failed: {str(e)}",
                error_code="CHAIN_EXECUTION_ERROR",
                context={"original_error": str(e)}
            )

