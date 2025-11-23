"""Configuration management for the backend service."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""
    
    # API Configuration
    api_title: str = "MCP Registry Backend API"
    api_version: str = "1.0.0"
    api_prefix: str = "/api"
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    
    # CORS Configuration
    cors_origins: list[str] = ["http://localhost:4200", "http://localhost:3000"]
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]
    
    # MCP Registry API
    mcp_registry_api_url: str = "http://localhost:3000/api"
    
    # Langchain Configuration
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    
    # Workflow Engine Configuration
    default_engine: str = "flowise"  # flowise, langchain, langgraph
    
    # LangFuse Configuration
    langfuse_host: str = "https://cloud.langfuse.com"
    langfuse_public_key: Optional[str] = None
    langfuse_secret_key: Optional[str] = None
    langfuse_project_id: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()


