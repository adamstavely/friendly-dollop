"""FastAPI application main entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import workflows, executions, agents, chains, langfuse, gitops

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    debug=settings.debug
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

# Include routers
app.include_router(workflows.router, prefix=settings.api_prefix, tags=["workflows"])
app.include_router(executions.router, prefix=settings.api_prefix, tags=["executions"])
app.include_router(agents.router, prefix=settings.api_prefix, tags=["agents"])
app.include_router(chains.router, prefix=settings.api_prefix, tags=["chains"])
app.include_router(langfuse.router, prefix=settings.api_prefix, tags=["langfuse"])
app.include_router(gitops.router, prefix=settings.api_prefix, tags=["gitops"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "MCP Registry Backend API",
        "version": settings.api_version,
        "status": "running"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )

