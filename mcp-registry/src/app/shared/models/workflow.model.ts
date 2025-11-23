export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  tags?: string[];
  
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

