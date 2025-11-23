# System Architecture Documentation

## Overview

The MCP Registry is a comprehensive platform for managing Model Context Protocol (MCP) tools, workflows, and agent interactions. It supports multiple workflow execution engines including Flowise, LangChain, and LangGraph.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Angular)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Workflows   │  │     Tools    │  │ Observability│      │
│  │   Builder    │  │  Management  │  │  Dashboard   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           │                                  │
│                  ┌────────▼─────────┐                        │
│                  │  Workflow Service │                        │
│                  └────────┬─────────┘                        │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │ HTTP/REST
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                    Backend (FastAPI)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Workflow    │  │   LangGraph  │  │   LangChain  │      │
│  │  Executor    │  │   Service    │  │   Services   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           │                                  │
│                  ┌────────▼─────────┐                        │
│                  │   MCP Adapter    │                        │
│                  └────────┬─────────┘                        │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │ HTTP/REST
                            │
┌───────────────────────────▼──────────────────────────────────┐
│              MCP Registry API (Main Backend)                  │
│  • Tool Registry                                             │
│  • Tool Execution                                            │
│  • Persona Management                                         │
└───────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

#### Workflow Builder
- **Location**: `mcp-registry/src/app/features/workflows/components/workflow-builder/`
- **Purpose**: Visual workflow creation and editing
- **Features**:
  - Drag-and-drop node creation
  - Visual connection editor
  - Engine-specific configuration tabs
  - Real-time validation

#### Configuration Components
- **LangGraph Config**: State schema editor, node configuration, graph preview
- **Agent Config**: Agent type selection, LLM configuration, tool selection
- **Chain Config**: Chain type selection, node ordering, transform configuration

#### Execution Viewers
- **LangGraph Viewer**: Timeline, state visualization, state diff, execution tree
- **Agent Viewer**: Tool calls, reasoning steps, decision tree
- **Execution Detail**: Unified view with engine-specific tabs

### Backend Services

#### LanggraphService
- **Location**: `backend/app/services/langgraph_service.py`
- **Responsibilities**:
  - Create LangGraph StateGraph from workflow definitions
  - Execute graphs with state management
  - Stream execution updates
  - Handle LLM node execution
  - Apply transform functions
  - Manage state checkpoints

#### ChainService
- **Location**: `backend/app/services/chain_service.py`
- **Responsibilities**:
  - Create sequential and transform chains
  - Execute chains with error handling
  - Apply transform functions
  - Manage chain configuration

#### AgentService
- **Location**: `backend/app/services/agent_service.py`
- **Responsibilities**:
  - Create ReAct and OpenAI Functions agents
  - Execute agents with tool support
  - Extract tool calls and reasoning steps
  - Handle persona-based tool filtering

#### LLMService
- **Location**: `backend/app/services/llm_service.py`
- **Responsibilities**:
  - Create LLM instances for multiple providers (OpenAI, Anthropic)
  - Invoke LLM with messages
  - Stream LLM responses
  - Handle LLM errors

#### MCPAdapter
- **Location**: `backend/app/services/mcp_adapter.py`
- **Responsibilities**:
  - Fetch MCP tool definitions from registry
  - Convert MCP tools to LangChain tools
  - Filter tools by persona
  - Execute MCP tools

#### WorkflowExecutor
- **Location**: `backend/app/services/workflow_executor.py`
- **Responsibilities**:
  - Route workflows to appropriate engine
  - Execute workflows with error handling
  - Track execution state
  - Link executions to workflows

## Data Flow

### Workflow Execution Flow

1. **User initiates execution** via frontend
2. **Frontend calls** `POST /api/workflows/{id}/execute`
3. **WorkflowExecutor** determines engine type
4. **Engine-specific service** executes workflow:
   - LangGraph: `LanggraphService.execute_graph()`
   - LangChain Agent: `AgentService.execute_agent()`
   - LangChain Chain: `ChainService.execute_chain()`
5. **MCP tools** are invoked via `MCPAdapter`
6. **LLM calls** are made via `LLMService`
7. **Results** are returned to frontend
8. **Execution** is stored and tracked

### Streaming Execution Flow

1. **User requests stream** via `GET /api/workflows/{id}/executions/{exec_id}/stream`
2. **Backend creates** Server-Sent Events (SSE) connection
3. **LanggraphService.stream_execution()** yields events
4. **Each node execution** sends an update event
5. **Frontend receives** events and updates UI in real-time
6. **Connection closes** when execution completes

### State Management Flow (LangGraph)

1. **Workflow definition** includes state schema
2. **StateValidator** validates schema
3. **Initial state** is created with defaults from schema
4. **Each node execution** updates state
5. **State checkpoints** are saved at key points
6. **Final state** is returned with execution result

## Integration Points

### LangGraph Integration

- **State Management**: Uses LangGraph's StateGraph for stateful workflows
- **Node Execution**: Custom node functions for LLM, tools, transforms
- **Streaming**: Uses LangGraph's `astream()` for real-time updates
- **Checkpointing**: Custom checkpoint system for state persistence

### LangChain Integration

- **Agents**: Uses LangChain's AgentExecutor with ReAct and OpenAI Functions agents
- **Chains**: Uses LangChain's SequentialChain and TransformChain
- **Tools**: MCP tools wrapped as LangChain BaseTool instances
- **LLMs**: Uses LangChain's ChatOpenAI and ChatAnthropic

### MCP Tool Integration

- **Tool Fetching**: HTTP requests to MCP Registry API
- **Tool Wrapping**: MCP tools converted to LangChain tools
- **Tool Execution**: Tools executed via MCP Registry API
- **Persona Filtering**: Tools filtered based on agent persona rules

## Error Handling Architecture

### Exception Hierarchy

```
WorkflowExecutionError (base)
├── LLMExecutionError
├── ToolExecutionError
├── StateValidationError
├── GraphCompilationError
└── TransformExecutionError
```

### Retry Logic

- **Configurable retries**: Max attempts, delays, exponential backoff
- **Retryable exceptions**: Transient failures are retried
- **Error context**: All errors include context for debugging

## Security Considerations

- **API Keys**: Stored in environment variables, never in code
- **Tool Execution**: Validated through MCP Registry API
- **State Validation**: Prevents invalid state from being processed
- **Error Sanitization**: Sensitive data removed from error messages

## Performance Optimizations

- **Graph Caching**: Compiled graphs cached for reuse
- **Tool Caching**: MCP tool definitions cached for 5 minutes
- **State Checkpointing**: Limited to 100 checkpoints per execution
- **Async Execution**: All I/O operations are async

## Future Enhancements

- **Database Persistence**: Replace in-memory storage
- **Distributed Execution**: Support for distributed workflow execution
- **Advanced State Management**: Persistent state storage
- **Workflow Versioning**: Track workflow definition versions
- **Execution Replay**: Replay executions from checkpoints

