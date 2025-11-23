// LangFuse Trace Types
export interface LangFuseTrace {
  id?: string;
  name: string;
  userId?: string;
  sessionId?: string;
  input?: any;
  output?: any;
  metadata?: Record<string, any>;
  tags?: string[];
  timestamp?: string;
  release?: string;
  version?: string;
}

export interface LangFuseGeneration {
  id?: string;
  traceId?: string;
  name: string;
  model?: string;
  modelParameters?: Record<string, any>;
  input?: any;
  output?: any;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  metadata?: Record<string, any>;
  level?: 'DEFAULT' | 'DEBUG';
  statusMessage?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface LangFuseScore {
  id?: string;
  traceId?: string;
  name: string;
  value: number;
  comment?: string;
  observationId?: string;
}

export interface LangFuseSpan {
  id?: string;
  traceId?: string;
  name: string;
  input?: any;
  output?: any;
  metadata?: Record<string, any>;
  startTime?: Date;
  endTime?: Date;
  level?: 'DEFAULT' | 'DEBUG';
}

// Integration-specific types
export interface WorkflowTraceMetadata {
  workflowId: string;
  workflowName: string;
  executionId: string;
  mcpTools?: string[];
  lifecycleState?: string;
  engine?: string;
  workflowType?: string;
}

export interface ToolCallMetadata {
  toolId: string;
  toolName: string;
  version?: string;
  agentPersona?: string;
}

export interface LangFusePrompt {
  id?: string;
  name: string;
  prompt: string;
  version?: number;
  labels?: string[];
  config?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  tags?: string[];
  created?: string;
  updated?: string;
}

export interface LangFuseTraceFilter {
  userId?: string;
  sessionId?: string;
  name?: string;
  tags?: string[];
  fromTimestamp?: Date;
  toTimestamp?: Date;
  limit?: number;
  page?: number;
}

export interface LangFuseAnalytics {
  totalTraces: number;
  successRate: number;
  averageLatency: number;
  totalCost: number;
  errorRate: number;
  tracesOverTime: Array<{ date: string; count: number }>;
  latencyTrends: Array<{ date: string; avgLatency: number }>;
  costTrends: Array<{ date: string; totalCost: number }>;
}
