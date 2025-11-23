"""LLM service for creating and managing LLM instances across providers."""
from typing import Dict, Any, Optional, AsyncIterator
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class LLMService:
    """Service for creating and managing LLM instances."""
    
    def __init__(self):
        self._llm_cache: Dict[str, BaseChatModel] = {}
    
    def create_llm(
        self,
        provider: str,
        model: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        api_key: Optional[str] = None
    ) -> BaseChatModel:
        """Create an LLM instance from configuration."""
        cache_key = f"{provider}:{model}:{temperature}:{max_tokens}"
        
        if cache_key in self._llm_cache:
            return self._llm_cache[cache_key]
        
        llm = self._create_llm_instance(
            provider=provider,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=api_key
        )
        
        self._llm_cache[cache_key] = llm
        return llm
    
    def _create_llm_instance(
        self,
        provider: str,
        model: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        api_key: Optional[str] = None
    ) -> BaseChatModel:
        """Create an LLM instance based on provider."""
        provider_lower = provider.lower()
        
        if provider_lower == "openai":
            api_key = api_key or settings.openai_api_key
            if not api_key:
                raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY environment variable.")
            
            return ChatOpenAI(
                model=model,
                temperature=temperature or 0.7,
                max_tokens=max_tokens,
                api_key=api_key
            )
        
        elif provider_lower == "anthropic" or provider_lower == "claude":
            api_key = api_key or settings.anthropic_api_key
            if not api_key:
                raise ValueError("Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable.")
            
            return ChatAnthropic(
                model=model,
                temperature=temperature or 0.7,
                max_tokens=max_tokens,
                api_key=api_key
            )
        
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}. Supported providers: openai, anthropic")
    
    async def invoke(
        self,
        llm: BaseChatModel,
        messages: list[BaseMessage],
        config: Optional[Dict[str, Any]] = None
    ) -> BaseMessage:
        """Invoke LLM with messages."""
        try:
            response = await llm.ainvoke(messages, config=config or {})
            return response
        except Exception as e:
            logger.error(f"LLM invocation failed: {str(e)}")
            raise
    
    async def stream(
        self,
        llm: BaseChatModel,
        messages: list[BaseMessage],
        config: Optional[Dict[str, Any]] = None
    ) -> AsyncIterator[str]:
        """Stream LLM responses."""
        try:
            async for chunk in llm.astream(messages, config=config or {}):
                if hasattr(chunk, 'content'):
                    yield chunk.content
                else:
                    yield str(chunk)
        except Exception as e:
            logger.error(f"LLM streaming failed: {str(e)}")
            raise
    
    def create_messages(
        self,
        input_data: Any,
        system_message: Optional[str] = None
    ) -> list[BaseMessage]:
        """Create message list from input data."""
        messages = []
        
        if system_message:
            messages.append(SystemMessage(content=system_message))
        
        # Convert input to message
        if isinstance(input_data, str):
            messages.append(HumanMessage(content=input_data))
        elif isinstance(input_data, dict):
            # Try to extract text or content
            text = input_data.get("text") or input_data.get("content") or input_data.get("input")
            if text:
                messages.append(HumanMessage(content=str(text)))
            else:
                # Use entire dict as string representation
                messages.append(HumanMessage(content=str(input_data)))
        elif isinstance(input_data, list):
            # Assume list of messages or strings
            for item in input_data:
                if isinstance(item, BaseMessage):
                    messages.append(item)
                else:
                    messages.append(HumanMessage(content=str(item)))
        else:
            messages.append(HumanMessage(content=str(input_data)))
        
        return messages

