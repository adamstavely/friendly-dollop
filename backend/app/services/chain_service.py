"""Langchain chain service."""
from typing import List, Dict, Any, Optional
from langchain.chains import LLMChain, SequentialChain, TransformChain
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain.tools import BaseTool
from app.services.mcp_adapter import MCPAdapter
from app.models.workflow import ChainConfig


class ChainService:
    """Service for creating and executing Langchain chains."""
    
    def __init__(self):
        self.mcp_adapter = MCPAdapter()
    
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
    
    def _create_transform_chain(self, config: ChainConfig):
        """Create a transform chain."""
        transforms = config.transforms or {}
        
        def transform_func(inputs: Dict[str, Any]) -> Dict[str, Any]:
            result = inputs.copy()
            for node_id, transform in transforms.items():
                # Apply transform (simplified)
                if isinstance(transform, dict):
                    # Apply transformation logic
                    pass
            return result
        
        return TransformChain(
            input_variables=["input"],
            output_variables=["output"],
            transform=transform_func
        )
    
    def _create_llm(self, config: Dict[str, Any]):
        """Create LLM from configuration."""
        provider = config.get("provider", "openai")
        model = config.get("model", "gpt-4")
        temperature = config.get("temperature", 0.7)
        max_tokens = config.get("max_tokens")
        
        if provider == "openai":
            return ChatOpenAI(
                model=model,
                temperature=temperature,
                max_tokens=max_tokens
            )
        else:
            # Default to OpenAI
            return ChatOpenAI(
                model=model,
                temperature=temperature
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
        except Exception as e:
            return {
                "output": None,
                "error": str(e),
                "success": False
            }

