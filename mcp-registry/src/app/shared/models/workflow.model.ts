export type WorkflowEngine = 'flowise' | 'langchain' | 'langgraph';
export type WorkflowType = 'agent' | 'chain' | 'graph';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  tags?: string[];
  
  // Engine selection
  engine?: WorkflowEngine; // Default: 'flowise' for backward compatibility
  workflowType?: WorkflowType; // For Langchain workflows
  
  // Flowise-specific fields
  flowiseId?: string; // ID in Flowise system
  flowiseData?: any; // Full workflow definition from Flowise
  
  // MCP Registry integration
  mcpTools?: string[]; // Array of MCP tool IDs used in this workflow
  lifecycleState?: 'development' | 'staging' | 'pilot' | 'production' | 'deprecated' | 'retired';
  qualityScore?: number;
  
  // Execution metadata
  executionCount?: number;
  lastExecuted?: string;
  successRate?: number;
  avgExecutionTime?: number;
  
  // Langchain/Langgraph configuration
  langchainConfig?: LangchainConfig;
  chainConfig?: ChainConfig;
  agentConfig?: AgentConfig;
}

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  data: any;
  mcpToolId?: string; // If this node uses an MCP tool
}

export interface WorkflowConnection {
  id: string;
  source: string; // Source node ID
  target: string; // Target node ID
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  viewport?: { x: number; y: number; zoom: number };
  langgraphConfig?: any; // Langgraph-specific configuration
  stateSchema?: any; // State schema for Langgraph
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  input?: any;
  output?: any;
  error?: string;
  logs?: ExecutionLog[];
  
  // Langchain/Langgraph specific
  state?: any; // For Langgraph state
  toolCalls?: any[]; // For agent executions
  reasoningSteps?: string[]; // For agent reasoning
}

export interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  nodeId?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  definition: WorkflowDefinition;
  mcpTools?: string[];
}

// Langchain/Langgraph configuration interfaces
export interface LangchainConfig {
  agentType?: string;
  chainType?: string;
  llmProvider?: string;
  llmModel?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChainConfig {
  chainType: string;
  nodes: string[]; // Node IDs in order
  transforms?: { [key: string]: any };
}

export interface AgentConfig {
  agentType: string; // ReActAgent, PlanAndExecuteAgent, etc.
  llmProvider: string;
  llmModel: string;
  temperature?: number;
  maxTokens?: number;
  systemMessage?: string;
  persona?: string;
  tools?: string[]; // MCP tool IDs
}

