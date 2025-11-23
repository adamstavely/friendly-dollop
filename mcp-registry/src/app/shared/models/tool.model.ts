export interface Tool {
  toolId: string;
  name: string;
  description: string;
  domain: string;
  capabilities: string[];
  versions: ToolVersion[];
  ownerTeam: string;
  contact: string;
  securityClass: 'public' | 'internal' | 'restricted' | 'highly-restricted';
  policyRef?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  
  // Extended fields from updated PRD
  lifecycleState?: 'development' | 'staging' | 'pilot' | 'production' | 'deprecated' | 'retired';
  promotionRequirements?: PromotionRequirement[];
  dependencyGraph?: DependencyGraph;
  reverseDependencies?: string[];
  qualityScore?: number;
  changelog?: ChangelogEntry[];
  bundleMembership?: string[];
  rateLimits?: RateLimits;
  gitOpsSource?: GitOpsSource;
  retirementPlan?: RetirementPlan;
  agentPersonaRules?: Record<string, boolean>;
  schemaVisualization?: SchemaVisualization;
  agentFeedback?: AgentFeedback;
  telemetryAutoDemotion?: TelemetryAutoDemotion;
  complianceTags?: string[];
  
  // Optional fields from original PRD
  exampleInputs?: any;
  exampleOutputs?: any;
  sampleCall?: string;
  instrumentationConfig?: any;
  costMetadata?: any;
  deploymentEnvironment?: 'dev' | 'staging' | 'prod';
  healthcheck?: HealthcheckConfig;
}

export interface ToolVersion {
  version: string;
  schema: any; // MCP schema JSON
  openapi?: any; // OpenAPI 3.1 reference
  deployment?: {
    env: 'dev' | 'staging' | 'prod';
    endpoint?: string;
  };
  health?: {
    lastCheck: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
  };
  deprecated: boolean;
  createdAt?: string;
}

export interface PromotionRequirement {
  type: 'automated' | 'human-approval';
  name: string;
  status: 'pending' | 'passed' | 'failed';
  description?: string;
}

export interface DependencyGraph {
  dependsOnTools: string[];
  dependsOnServices: string[];
  modelDependencies: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  breakingChanges?: string[];
  migrationNotes?: string;
}

export interface RateLimits {
  maxPerMinute?: number;
  maxConcurrency?: number;
  timeoutMs?: number;
  retryPolicy?: 'exponential' | 'linear' | 'fixed';
}

export interface GitOpsSource {
  repo: string;
  commit: string;
  branch?: string;
}

export interface RetirementPlan {
  autoSunset: boolean;
  retirementDate?: string;
  replacementToolId?: string;
}

export interface SchemaVisualization {
  diagramUrl?: string;
}

export interface AgentFeedback {
  successRate: number;
  avgLatencyMs: number;
  failureRate: number;
  toolFitRating?: number;
}

export interface TelemetryAutoDemotion {
  enabled: boolean;
  demoted: boolean;
  reason?: string;
}

export interface HealthcheckConfig {
  endpoint?: string;
  interval?: number;
  timeout?: number;
}

