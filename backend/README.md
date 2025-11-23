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
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_langgraph_service.py

# Run integration tests
pytest tests/integration/
```

## API Examples

### Create a LangGraph Workflow

```bash
curl -X POST http://localhost:8000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My LangGraph Workflow",
    "description": "A test workflow",
    "engine": "langgraph",
    "workflowType": "graph"
  }'
```

### Update Workflow Definition

```bash
curl -X PUT http://localhost:8000/api/workflows/{workflow_id}/definition \
  -H "Content-Type: application/json" \
  -d '{
    "nodes": [
      {
        "id": "input-1",
        "type": "input",
        "label": "Input Node",
        "data": {}
      },
      {
        "id": "llm-1",
        "type": "llm",
        "label": "LLM Node",
        "data": {
          "llm": {
            "provider": "openai",
            "model": "gpt-4",
            "temperature": 0.7
          }
        }
      }
    ],
    "connections": [
      {
        "id": "conn-1",
        "source": "input-1",
        "target": "llm-1"
      }
    ],
    "stateSchema": {
      "type": "object",
      "properties": {
        "input": {"type": "string"},
        "output": {"type": "string"}
      }
    }
  }'
```

### Execute a Workflow

```bash
curl -X POST http://localhost:8000/api/workflows/{workflow_id}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Hello, world!"
  }'
```

### Stream Execution Updates

```bash
curl http://localhost:8000/api/workflows/{workflow_id}/executions/{execution_id}/stream
```

### Create an Agent Workflow

```bash
curl -X POST http://localhost:8000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Agent Workflow",
    "engine": "langchain",
    "workflowType": "agent",
    "agentConfig": {
      "agentType": "react",
      "llmProvider": "openai",
      "llmModel": "gpt-4",
      "temperature": 0.7,
      "systemMessage": "You are a helpful assistant.",
      "tools": ["tool-1", "tool-2"]
    }
  }'
```

### Validate Workflow

```bash
curl -X POST http://localhost:8000/api/workflows/{workflow_id}/validate
```

## Workflow Definition Formats

### LangGraph Workflow Definition

```json
{
  "nodes": [
    {
      "id": "input-1",
      "type": "input",
      "label": "Input",
      "data": {}
    },
    {
      "id": "llm-1",
      "type": "llm",
      "label": "LLM Node",
      "data": {
        "llm": {
          "provider": "openai",
          "model": "gpt-4",
          "temperature": 0.7,
          "system_message": "You are a helpful assistant."
        }
      }
    },
    {
      "id": "transform-1",
      "type": "transform",
      "label": "Transform",
      "data": {
        "transform": {
          "type": "to_string",
          "config": {}
        }
      }
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "source": "input-1",
      "target": "llm-1"
    },
    {
      "id": "conn-2",
      "source": "llm-1",
      "target": "transform-1"
    }
  ],
  "stateSchema": {
    "type": "object",
    "properties": {
      "input": {"type": "string"},
      "output": {"type": "string"},
      "messages": {
        "type": "array",
        "items": {"type": "object"}
      }
    },
    "required": ["input"]
  }
}
```

### LangChain Agent Configuration

```json
{
  "agentType": "react",
  "llmProvider": "openai",
  "llmModel": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 1000,
  "systemMessage": "You are a helpful assistant.",
  "persona": "developer",
  "tools": ["tool-1", "tool-2"]
}
```

### LangChain Chain Configuration

```json
{
  "chainType": "sequential",
  "nodes": ["node-1", "node-2", "node-3"],
  "transforms": {
    "node-1": {
      "type": "to_string",
      "config": {}
    },
    "node-2": {
      "type": "uppercase",
      "config": {}
    }
  }
}
```

## Transform Functions

The following transform functions are supported:

- `passthrough` / `identity` - Pass input through unchanged
- `to_string` - Convert input to string
- `to_json` - Parse JSON string or stringify object
- `extract_field` - Extract a field from an object
- `set_field` - Set a field in an object
- `merge` - Merge objects
- `filter` - Filter array items
- `map` - Map array items
- `uppercase` - Convert string to uppercase
- `lowercase` - Convert string to lowercase
- `trim` - Trim whitespace
- `replace` - Replace text in string
- `split` - Split string into array
- `join` - Join array into string
- `length` - Get length of string/array/object
- `slice` - Slice string or array

## Migration Guide

### Migrating from Flowise to LangGraph

1. Export your Flowise workflow definition
2. Create a new LangGraph workflow:
```bash
curl -X POST http://localhost:8000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Migrated Workflow",
    "engine": "langgraph"
  }'
```

3. Use the migration endpoint:
```bash
curl -X POST http://localhost:8000/api/workflows/{workflow_id}/migrate \
  -H "Content-Type: application/json" \
  -d '{
    "target_engine": "langgraph"
  }'
```

### Migrating from LangChain Chain to LangGraph

1. Ensure your chain nodes are compatible with graph structure
2. Use the migration endpoint to convert:
```bash
curl -X POST http://localhost:8000/api/workflows/{workflow_id}/migrate \
  -H "Content-Type: application/json" \
  -d '{
    "target_engine": "langgraph"
  }'
```

## Error Handling

The API uses custom exceptions for better error handling:

- `WorkflowExecutionError` - Base exception for workflow errors
- `LLMExecutionError` - LLM-related errors
- `ToolExecutionError` - Tool execution errors
- `StateValidationError` - State validation errors
- `GraphCompilationError` - Graph compilation errors
- `TransformExecutionError` - Transform execution errors

All errors include:
- Error message
- Error code
- Context information

## State Management

LangGraph workflows support state schema validation and checkpointing:

- **State Schema**: Define the structure of workflow state using JSON Schema
- **Checkpointing**: Save state snapshots at key points during execution
- **Validation**: Validate state against schema before and during execution

Example state schema:
```json
{
  "type": "object",
  "properties": {
    "input": {"type": "string"},
    "output": {"type": "string"},
    "intermediate": {"type": "object"}
  },
  "required": ["input"]
}
```

## Notes

- The backend uses in-memory storage for workflows (replace with database in production)
- MCP tool definitions are cached for 5 minutes
- Execution history is stored in memory (implement persistence for production)
- LLM API keys should be set via environment variables for security
- State checkpoints are limited to 100 per execution to prevent memory issues

