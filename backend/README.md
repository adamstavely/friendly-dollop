# MCP Registry Backend - Langchain/Langgraph Integration

Python FastAPI backend service for executing workflows using Langchain and Langgraph.

## Features

- **Multi-Engine Support**: Execute workflows using Flowise, Langchain, or Langgraph
- **Agent Workflows**: Create and execute Langchain agents with MCP tools
- **Chain Workflows**: Execute sequential Langchain chains
- **Graph Workflows**: Execute stateful Langgraph workflows
- **MCP Tool Integration**: Seamlessly integrate MCP tools as Langchain tools
- **Workflow Migration**: Migrate workflows between engines

## Prerequisites

- Python 3.10+
- pip

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
- `OPENAI_API_KEY`: Your OpenAI API key (required for Langchain agents)
- `MCP_REGISTRY_API_URL`: URL of the MCP Registry API (default: http://localhost:3000/api)

## Running the Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Workflows
- `GET /api/workflows` - List workflows (filter by engine, workflow type)
- `GET /api/workflows/{id}` - Get workflow
- `POST /api/workflows` - Create workflow
- `PUT /api/workflows/{id}` - Update workflow
- `DELETE /api/workflows/{id}` - Delete workflow
- `GET /api/workflows/{id}/definition` - Get workflow definition
- `PUT /api/workflows/{id}/definition` - Update workflow definition
- `POST /api/workflows/{id}/execute` - Execute workflow
- `POST /api/workflows/{id}/compile` - Compile workflow to target engine
- `POST /api/workflows/{id}/migrate` - Migrate workflow between engines

### Executions
- `GET /api/workflows/{id}/executions` - Get execution history
- `GET /api/workflows/{id}/executions/{exec_id}` - Get execution details
- `GET /api/workflows/{id}/executions/{exec_id}/stream` - Stream execution (SSE)
- `POST /api/workflows/{id}/executions/{exec_id}/cancel` - Cancel execution

### Agents
- `POST /api/agents/execute` - Execute agent directly
- `GET /api/agents/tools` - Get available tools for agents
- `GET /api/agents/types` - Get available agent types
- `POST /api/agents/validate` - Validate agent configuration
- `POST /api/agents/{persona}/execute` - Execute agent with persona

### Chains
- `POST /api/chains/execute` - Execute chain directly
- `GET /api/chains/types` - Get available chain types
- `POST /api/chains/validate` - Validate chain configuration

## Workflow Engines

### Flowise
- Default engine for backward compatibility
- Workflows stored with `flowiseId` and `flowiseData`

### Langchain
- Supports two workflow types:
  - **Agent**: Autonomous agents with tool use
  - **Chain**: Sequential chain execution
- Configure with `agentConfig` or `chainConfig`

### Langgraph
- Stateful graph-based workflows
- Supports conditional routing and state management
- Configure with `langgraphConfig` and `stateSchema`

## MCP Tool Integration

MCP tools are automatically converted to Langchain tools:
- Tool definitions are fetched from MCP Registry API
- Tools are wrapped as `MCPToolWrapper` (extends Langchain `BaseTool`)
- Persona-based tool filtering is supported

## Development

### Project Structure
```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── models/              # Pydantic models
│   ├── services/            # Business logic
│   │   ├── agent_service.py
│   │   ├── chain_service.py
│   │   ├── langgraph_service.py
│   │   ├── mcp_adapter.py
│   │   └── workflow_executor.py
│   ├── api/                 # API routes
│   └── utils/               # Utilities
├── requirements.txt
└── Dockerfile
```

## Docker

Build and run with Docker:

```bash
docker build -t mcp-registry-backend .
docker run -p 8000:8000 --env-file .env mcp-registry-backend
```

## Testing

```bash
# Run tests (when implemented)
pytest
```

## Notes

- The backend uses in-memory storage for workflows (replace with database in production)
- MCP tool definitions are cached for 5 minutes
- Execution history is stored in memory (implement persistence for production)

