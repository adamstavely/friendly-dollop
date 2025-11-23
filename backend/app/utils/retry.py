"""Retry utilities for handling transient failures."""
from typing import Callable, Any, Optional
import asyncio
import logging
from functools import wraps

logger = logging.getLogger(__name__)


class RetryConfig:
    """Configuration for retry logic."""
    
    def __init__(
        self,
        max_attempts: int = 3,
        initial_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True
    ):
        self.max_attempts = max_attempts
        self.initial_delay = initial_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter


def retry_on_failure(
    config: Optional[RetryConfig] = None,
    retryable_exceptions: tuple = (Exception,)
):
    """Decorator for retrying function calls on failure."""
    retry_config = config or RetryConfig()
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(retry_config.max_attempts):
                try:
                    return await func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exception = e
                    
                    if attempt < retry_config.max_attempts - 1:
                        # Calculate delay with exponential backoff
                        delay = min(
                            retry_config.initial_delay * (retry_config.exponential_base ** attempt),
                            retry_config.max_delay
                        )
                        
                        # Add jitter if enabled
                        if retry_config.jitter:
                            import random
                            delay = delay * (0.5 + random.random() * 0.5)
                        
                        logger.warning(
                            f"Attempt {attempt + 1}/{retry_config.max_attempts} failed for {func.__name__}: {str(e)}. "
                            f"Retrying in {delay:.2f}s..."
                        )
                        
                        await asyncio.sleep(delay)
                    else:
                        logger.error(f"All {retry_config.max_attempts} attempts failed for {func.__name__}")
                        raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(retry_config.max_attempts):
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exception = e
                    
                    if attempt < retry_config.max_attempts - 1:
                        delay = min(
                            retry_config.initial_delay * (retry_config.exponential_base ** attempt),
                            retry_config.max_delay
                        )
                        
                        if retry_config.jitter:
                            import random
                            delay = delay * (0.5 + random.random() * 0.5)
                        
                        logger.warning(
                            f"Attempt {attempt + 1}/{retry_config.max_attempts} failed for {func.__name__}: {str(e)}. "
                            f"Retrying in {delay:.2f}s..."
                        )
                        
                        import time
                        time.sleep(delay)
                    else:
                        logger.error(f"All {retry_config.max_attempts} attempts failed for {func.__name__}")
                        raise
        
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

