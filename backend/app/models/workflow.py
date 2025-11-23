"""Workflow models matching Angular interfaces."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class WorkflowEngine(str, Enum):
    """Workflow execution engine."""
    FLOWISE = "flowise"
    LANGCHAIN = "langchain"
    LANGGRAPH = "langgraph"


class WorkflowType(str, Enum):
    """Workflow type."""
    AGENT = "agent"
    CHAIN = "chain"
    GRAPH = "graph"


class WorkflowStatus(str, Enum):
    """Workflow status."""
    ACTIVE = "active"
    DRAFT = "draft"
    ARCHIVED = "archived"


class WorkflowNode(BaseModel):
    """Workflow node definition."""
    id: str
    type: str
    label: str
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0, "y": 0})
    data: Dict[str, Any] = Field(default_factory=dict)
    mcpToolId: Optional[str] = None


class WorkflowConnection(BaseModel):
    """Workflow connection definition."""
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


class WorkflowDefinition(BaseModel):
    """Workflow definition with nodes and connections."""
    nodes: List[WorkflowNode] = Field(default_factory=list)
    connections: List[WorkflowConnection] = Field(default_factory=list)
    viewport: Optional[Dict[str, Any]] = None
    langgraphConfig: Optional[Dict[str, Any]] = None
    stateSchema: Optional[Dict[str, Any]] = None


class LangchainConfig(BaseModel):
    """Langchain-specific configuration."""
    agentType: Optional[str] = None
    chainType: Optional[str] = None
    llmProvider: Optional[str] = None
    llmModel: Optional[str] = None
    temperature: Optional[float] = None
    maxTokens: Optional[int] = None


class ChainConfig(BaseModel):
    """Chain configuration."""
    chainType: str
    nodes: List[str]  # Node IDs in order
    transforms: Optional[Dict[str, Any]] = None


class AgentConfig(BaseModel):
    """Agent configuration."""
    agentType: str  # ReActAgent, PlanAndExecuteAgent, etc.
    llmProvider: str
    llmModel: str
    temperature: Optional[float] = 0.7
    maxTokens: Optional[int] = None
    systemMessage: Optional[str] = None
    persona: Optional[str] = None
    tools: List[str] = Field(default_factory=list)  # MCP tool IDs


class Workflow(BaseModel):
    """Workflow model matching Angular interface."""
    id: str
    name: str
    description: Optional[str] = None
    status: WorkflowStatus = WorkflowStatus.DRAFT
    createdAt: str
    updatedAt: str
    createdBy: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    
    # Engine selection
    engine: WorkflowEngine = WorkflowEngine.FLOWISE
    workflowType: Optional[WorkflowType] = None
    
    # Flowise-specific fields
    flowiseId: Optional[str] = None
    flowiseData: Optional[Dict[str, Any]] = None
    
    # MCP Registry integration
    mcpTools: List[str] = Field(default_factory=list)
    lifecycleState: Optional[str] = None
    qualityScore: Optional[float] = None
    
    # Execution metadata
    executionCount: int = 0
    lastExecuted: Optional[str] = None
    successRate: Optional[float] = None
    avgExecutionTime: Optional[int] = None
    
    # Langchain/Langgraph configuration
    langchainConfig: Optional[LangchainConfig] = None
    chainConfig: Optional[ChainConfig] = None
    agentConfig: Optional[AgentConfig] = None


class WorkflowCreate(BaseModel):
    """Workflow creation request."""
    name: str
    description: Optional[str] = None
    status: WorkflowStatus = WorkflowStatus.DRAFT
    engine: WorkflowEngine = WorkflowEngine.FLOWISE
    workflowType: Optional[WorkflowType] = None
    tags: List[str] = Field(default_factory=list)
    mcpTools: List[str] = Field(default_factory=list)
    langchainConfig: Optional[LangchainConfig] = None
    chainConfig: Optional[ChainConfig] = None
    agentConfig: Optional[AgentConfig] = None


class WorkflowUpdate(BaseModel):
    """Workflow update request."""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[WorkflowStatus] = None
    engine: Optional[WorkflowEngine] = None
    workflowType: Optional[WorkflowType] = None
    tags: Optional[List[str]] = None
    mcpTools: Optional[List[str]] = None
    langchainConfig: Optional[LangchainConfig] = None
    chainConfig: Optional[ChainConfig] = None
    agentConfig: Optional[AgentConfig] = None

