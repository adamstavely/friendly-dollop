export interface Prompt {
  id: string;
  name: string;
  description?: string;
  content: string; // The actual prompt template
  version: string;
  langfusePromptId?: string; // ID in LangFuse
  langfuseVersionId?: string; // Version ID in LangFuse
  category?: PromptCategory;
  tags?: string[];
  variables?: PromptVariable[]; // Template variables
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  isActive: boolean;
  usageCount?: number; // How many times used
  linkedWorkflows?: string[]; // Workflow IDs using this prompt
  linkedTools?: string[]; // Tool IDs using this prompt
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  required: boolean;
  defaultValue?: any;
}

export interface PromptCategory {
  id: string;
  name: string;
  description?: string;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  version: string;
  content: string;
  changelog?: string;
  createdAt: string;
  createdBy?: string;
  isActive: boolean;
  langfuseVersionId?: string;
}

export interface PromptUsage {
  promptId: string;
  version: string;
  workflowId?: string;
  toolId?: string;
  executionId?: string;
  traceId?: string;
  timestamp: string;
  success: boolean;
  latency?: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface PromptExecutionResult {
  output: string;
  latency: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
  traceId?: string;
}

