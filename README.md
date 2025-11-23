# MCP Registry Platform

A comprehensive platform for managing Model Context Protocol (MCP) tools, workflows, and agent interactions. The platform provides a full-stack solution with an Angular frontend for workflow management and a FastAPI backend for executing workflows using multiple engines (Flowise, LangChain, and LangGraph).

## 🚀 Features

### Core Capabilities
- **Multi-Engine Workflow Execution**: Execute workflows using Flowise, LangChain, or LangGraph
- **Visual Workflow Builder**: Drag-and-drop interface for creating complex workflows
- **MCP Tool Integration**: Seamlessly integrate MCP tools as LangChain tools
- **Agent Workflows**: Create and execute autonomous agents with tool use
- **Chain Workflows**: Execute sequential LangChain chains
- **Graph Workflows**: Execute stateful LangGraph workflows with conditional routing
- **Real-time Execution Monitoring**: Stream execution updates with Server-Sent Events (SSE)
- **Workflow Migration**: Migrate workflows between different engines
- **Langfuse Integration**: Observability and tracing for LLM workflows

### Tool Management
- **Tool Registry**: Full CRUD operations for MCP tools with versioning
- **Lifecycle Management**: State machine for tool promotion (development → staging → pilot → production → deprecated → retired)
- **Dependency Graph**: Interactive visualization of tool dependencies
- **Quality Scoring**: Telemetry-based quality metrics and ranking
- **Tool Bundles**: Group related tools into cohesive packages
- **Persona-Based Access**: Persona-based access control and capability negotiation
- **Compliance Management**: Compliance tags and regulatory classifications

## 📋 Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## 🏗️ Architecture

The platform consists of three main components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Angular)                         │
│  • Workflow Builder & Management                              │
│  • Tool Registry & Lifecycle                                  │
│  • Execution Monitoring & Observability                       │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            │ HTTP/REST
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                    Backend (FastAPI)                            │
│  • Workflow Execution Engine                                    │
│  • LangGraph/LangChain Services                                 │
│  • MCP Tool Adapter                                             │
│  • Langfuse Integration                                          │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            │ HTTP/REST
                            │
┌───────────────────────────▼───────────────────────────────────┐
│              MCP Registry API (Main Backend)                    │
│  • Tool Registry & Execution                                    │
│  • Persona Management                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Angular 21+ with standalone components
- Angular Material for UI components
- RxJS for reactive programming
- TypeScript for type safety
- Chart.js, D3.js, Cytoscape for visualizations
- Monaco Editor for code editing
- Langfuse SDK for observability

**Backend:**
- FastAPI (Python 3.10+)
- LangChain & LangGraph for workflow execution
- Pydantic for data validation
- Uvicorn ASGI server
- Langfuse for LLM observability

## 📦 Prerequisites

### Frontend
- Node.js 18+ and npm
- Angular CLI 17+

### Backend
- Python 3.10+
- pip

### Optional
- Docker and Docker Compose (for containerized deployment)
- OpenAI API key (for LLM workflows)
- Anthropic API key (for Claude models)
- Langfuse account (for observability)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd friendly-dollop
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env  # If available, or create manually

# Update .env with your configuration
# Required: OPENAI_API_KEY (for LangChain agents)
# Optional: ANTHROPIC_API_KEY, LANGFUSE_* keys
```

### 3. Frontend Setup

```bash
cd mcp-registry

# Install dependencies
npm install

# Update environment configuration if needed
# Edit src/environments/environment.ts
```

### 4. Start the Services

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd mcp-registry
npm start
```

**Terminal 3 - MCP Registry API (if running separately):**
```bash
# Start your MCP Registry API service
# Default expected at http://localhost:3000/api
```

### 5. Access the Application

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **ReDoc**: http://localhost:8000/redoc

## 📁 Project Structure

```
friendly-dollop/
├── backend/                    # FastAPI backend service
│   ├── app/
│   │   ├── api/                # API route handlers
│   │   │   ├── workflows.py    # Workflow CRUD and execution
│   │   │   ├── executions.py   # Execution management
│   │   │   ├── agents.py       # Agent execution
│   │   │   ├── chains.py       # Chain execution
│   │   │   └── langfuse.py     # Langfuse integration
│   │   ├── models/             # Pydantic models
│   │   ├── services/           # Business logic
│   │   │   ├── agent_service.py
│   │   │   ├── chain_service.py
│   │   │   ├── langgraph_service.py
│   │   │   ├── langfuse_service.py
│   │   │   ├── llm_service.py
│   │   │   ├── mcp_adapter.py
│   │   │   └── workflow_executor.py
│   │   ├── utils/              # Utilities
│   │   ├── config.py           # Configuration
│   │   └── main.py             # FastAPI app entry point
│   ├── tests/                  # Test suite
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
│
├── mcp-registry/               # Angular frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # Core services, guards, interceptors
│   │   │   ├── shared/         # Shared components, models
│   │   │   ├── features/       # Feature modules
│   │   │   │   ├── workflows/  # Workflow management
│   │   │   │   ├── tools/      # Tool management
│   │   │   │   ├── lifecycle/  # Lifecycle management
│   │   │   │   ├── observability/ # Observability dashboard
│   │   │   │   └── ...         # Other features
│   │   │   └── layout/         # Layout components
│   │   └── environments/       # Environment configuration
│   ├── docs/
│   │   └── WORKFLOWS.md        # Workflow documentation
│   ├── package.json
│   └── README.md
│
├── docs/                       # Documentation
│   └── ARCHITECTURE.md         # System architecture
│
└── README.md                   # This file
```

## 💻 Development

### Backend Development

```bash
cd backend
source venv/bin/activate

# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_langgraph_service.py

# Run integration tests
pytest tests/integration/
```

### Frontend Development

```bash
cd mcp-registry

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Watch mode for building
npm run watch
```

### Code Quality

- **Backend**: Uses Pydantic for validation, pytest for testing
- **Frontend**: TypeScript with strict mode, Angular linting

## 📚 API Documentation

### Workflow Endpoints

- `GET /api/workflows` - List workflows (filter by engine, workflow type)
- `GET /api/workflows/{id}` - Get workflow details
- `POST /api/workflows` - Create new workflow
- `PUT /api/workflows/{id}` - Update workflow
- `DELETE /api/workflows/{id}` - Delete workflow
- `GET /api/workflows/{id}/definition` - Get workflow definition
- `PUT /api/workflows/{id}/definition` - Update workflow definition
- `POST /api/workflows/{id}/execute` - Execute workflow
- `POST /api/workflows/{id}/compile` - Compile workflow to target engine
- `POST /api/workflows/{id}/migrate` - Migrate workflow between engines

### Execution Endpoints

- `GET /api/workflows/{id}/executions` - Get execution history
- `GET /api/workflows/{id}/executions/{exec_id}` - Get execution details
- `GET /api/workflows/{id}/executions/{exec_id}/stream` - Stream execution (SSE)
- `POST /api/workflows/{id}/executions/{exec_id}/cancel` - Cancel execution

### Agent Endpoints

- `POST /api/agents/execute` - Execute agent directly
- `GET /api/agents/tools` - Get available tools for agents
- `GET /api/agents/types` - Get available agent types
- `POST /api/agents/validate` - Validate agent configuration
- `POST /api/agents/{persona}/execute` - Execute agent with persona

### Chain Endpoints

- `POST /api/chains/execute` - Execute chain directly
- `GET /api/chains/types` - Get available chain types
- `POST /api/chains/validate` - Validate chain configuration

### Langfuse Endpoints

- `GET /api/langfuse/traces` - Get Langfuse traces
- `GET /api/langfuse/traces/{trace_id}` - Get trace details
- `POST /api/langfuse/traces/{trace_id}/feedback` - Submit feedback

For detailed API documentation, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## ⚙️ Configuration

### Backend Configuration

Create a `.env` file in the `backend/` directory:

```env
# API Configuration
API_TITLE=MCP Registry Backend API
API_VERSION=1.0.0
DEBUG=True

# Server Configuration
HOST=0.0.0.0
PORT=8000

# CORS Configuration
CORS_ORIGINS=http://localhost:4200,http://localhost:3000

# MCP Registry API
MCP_REGISTRY_API_URL=http://localhost:3000/api

# LLM Configuration
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Langfuse Configuration
LANGFUSE_HOST=https://cloud.langfuse.com
LANGFUSE_PUBLIC_KEY=your-langfuse-public-key
LANGFUSE_SECRET_KEY=your-langfuse-secret-key
LANGFUSE_PROJECT_ID=your-langfuse-project-id

# Workflow Engine
DEFAULT_ENGINE=langgraph
```

### Frontend Configuration

Update `mcp-registry/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  mcpRegistryApiUrl: 'http://localhost:3000/api',
  // ... other configuration
};
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest                           # Run all tests
pytest --cov=app                # With coverage
pytest tests/integration/       # Integration tests only
pytest -v                       # Verbose output
```

### Frontend Tests

```bash
cd mcp-registry
npm test                        # Run unit tests
```

### E2E Tests

```bash
# E2E tests are in the e2e/ directory
# Run with your preferred E2E testing framework
```

## 🐳 Deployment

### Docker Deployment

**Backend:**
```bash
cd backend
docker build -t mcp-registry-backend .
docker run -p 8000:8000 --env-file .env mcp-registry-backend
```

**Frontend:**
```bash
cd mcp-registry
npm run build
# Serve the dist/ directory with your preferred web server
```

### Production Considerations

- Replace in-memory storage with a database (PostgreSQL, MongoDB, etc.)
- Implement persistent execution history storage
- Set up proper authentication and authorization
- Configure HTTPS and security headers
- Set up monitoring and logging
- Use environment-specific configuration
- Implement rate limiting and request validation
- Set up CI/CD pipelines

## 📖 Documentation

- **[Architecture Documentation](docs/ARCHITECTURE.md)**: Detailed system architecture
- **[Backend README](backend/README.md)**: Backend-specific documentation
- **[Frontend README](mcp-registry/README.md)**: Frontend-specific documentation
- **[Workflow Guide](mcp-registry/docs/WORKFLOWS.md)**: How to create and manage workflows

## 🔧 Workflow Engines

### Flowise
- Default engine for backward compatibility
- Workflows stored with `flowiseId` and `flowiseData`

### LangChain
- **Agent Workflows**: Autonomous agents with tool use (ReAct, OpenAI Functions)
- **Chain Workflows**: Sequential chain execution with transforms
- Configure with `agentConfig` or `chainConfig`

### LangGraph
- Stateful graph-based workflows
- Supports conditional routing and state management
- Configure with `langgraphConfig` and `stateSchema`
- Real-time streaming execution

## 🔌 MCP Tool Integration

MCP tools are automatically converted to LangChain tools:
- Tool definitions are fetched from MCP Registry API
- Tools are wrapped as `MCPToolWrapper` (extends Langchain `BaseTool`)
- Persona-based tool filtering is supported
- Tools are cached for 5 minutes to improve performance

## 📊 Observability

The platform integrates with Langfuse for observability:
- Automatic tracing of LLM calls
- Execution tracking and monitoring
- Performance metrics
- Error tracking and debugging
- Feedback collection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

[Specify your license here]

## 🙏 Acknowledgments

- [LangChain](https://github.com/langchain-ai/langchain) - LLM application framework
- [LangGraph](https://github.com/langchain-ai/langgraph) - Stateful graph-based workflows
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Angular](https://angular.io/) - Web application framework
- [Langfuse](https://langfuse.com/) - LLM observability platform

## 📧 Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Note**: This is an active development project. Some features may be in development or experimental. Check the implementation status documents for current feature availability.

