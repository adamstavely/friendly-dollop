# LangFuse Integration Plan for MCP Registry

## Executive Summary

This plan outlines the integration of LangFuse (an open-source LLM observability platform) into the MCP Registry Angular application. LangFuse will provide comprehensive tracing, monitoring, and debugging capabilities for LLM-based workflows, tool executions, and agent interactions.

### 🎯 Priority Features (Weeks 1-4)

**1. Prompt Repository** - Centralized prompt storage, versioning, and management
- Prompt CRUD operations with version history
- Integration with LangFuse Prompts API
- Search, filter, and categorization
- Link prompts to workflows and tools

**2. Prompt Playground** - Interactive prompt testing and evaluation
- Real-time prompt execution
- A/B testing multiple versions
- Test dataset management
- Performance and cost analysis

**3. Observability Dashboard** - Real-time trace monitoring and analysis
- Trace visualization and filtering
- Generation (LLM call) viewer
- Performance metrics and analytics
- Score tracking and trends

**4. AI Security Capabilities** - Security scanning and threat detection
- PII detection and redaction
- Prompt injection detection
- Content filtering
- Security scoring and compliance monitoring

## Table of Contents

1. [Overview](#overview)
2. [Priority Features](#priority-features)
3. [Integration Architecture](#integration-architecture)
4. [Phase 1: Foundation Setup](#phase-1-foundation-setup)
5. [Phase 2: Core Service Integration](#phase-2-core-service-integration)
6. [Phase 3: Prompt Repository](#phase-3-prompt-repository) ⭐ **PRIORITY**
7. [Phase 4: Prompt Playground](#phase-4-prompt-playground) ⭐ **PRIORITY**
8. [Phase 5: Observability Dashboard](#phase-5-observability-dashboard) ⭐ **PRIORITY**
9. [Phase 6: AI Security Capabilities](#phase-6-ai-security-capabilities) ⭐ **PRIORITY**
10. [Phase 7: Workflow Execution Tracking](#phase-7-workflow-execution-tracking)
11. [Phase 8: Tool Usage Observability](#phase-8-tool-usage-observability)
12. [Phase 9: Quality & Feedback Integration](#phase-9-quality--feedback-integration)
13. [Configuration & Environment](#configuration--environment)
14. [Testing Strategy](#testing-strategy)
15. [Deployment Considerations](#deployment-considerations)

---

## Overview

### What is LangFuse?

LangFuse is an open-source LLM engineering platform that provides:
- **Traces**: Track complete LLM conversations and workflows
- **Generations**: Monitor individual LLM calls with inputs/outputs
- **Scores**: Capture quality scores and evaluations
- **Datasets**: Manage test datasets for evaluation
- **Prompts**: Version and manage prompts

### Integration Goals

1. **Observability**: Track all LLM interactions in workflows and tool executions
2. **Debugging**: Enable detailed trace analysis for troubleshooting
3. **Quality Monitoring**: Integrate quality scores and feedback with LangFuse traces
4. **Performance Analytics**: Monitor latency, costs, and success rates
5. **Agent Tracking**: Track agent persona interactions and negotiations

### Key Integration Points

- **Workflow Executions**: Track complete workflow runs with nested traces
- **MCP Tool Calls**: Monitor individual tool invocations
- **Quality Feedback**: Link quality scores to specific traces
- **Agent Personas**: Track persona-based interactions
- **Inspector Integration**: Connect MCP Inspector traces to LangFuse

---

## Priority Features

The following features are **CRITICAL** and will be implemented first:

### 🎯 Priority 1: Prompt Repository
- Centralized prompt storage and versioning
- Prompt templates for workflows and tools
- Version history and rollback capabilities
- Prompt search and categorization
- Integration with LangFuse Prompts API

### 🎯 Priority 2: Prompt Playground
- Interactive prompt testing interface
- Real-time prompt execution and evaluation
- A/B testing different prompt versions
- Performance metrics and cost analysis
- Integration with workflow builder

### 🎯 Priority 3: Observability Dashboard
- Real-time trace monitoring
- Trace visualization and analysis
- Generation (LLM call) viewer
- Performance metrics and analytics
- Filtering and search capabilities

### 🎯 Priority 4: AI Security Capabilities
- PII detection and redaction
- Prompt injection detection
- Output content filtering
- Security scoring and alerts
- Compliance monitoring

---

## Integration Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Registry (Angular)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Workflows   │  │     Tools    │  │   Quality    │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           │                                  │
│                  ┌────────▼─────────┐                        │
│                  │  LangFuse Service │                        │
│                  │   (TypeScript SDK)│                        │
│                  └────────┬─────────┘                        │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            │
┌───────────────────────────▼──────────────────────────────────┐
│              LangFuse Backend (Cloud/Self-hosted)            │
│                                                               │
│  • Traces API                                                │
│  • Generations API                                           │
│  • Scores API                                                │
│  • Datasets API                                              │
│  • Prompts API                                               │
└───────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Workflow Execution** → LangFuse Service creates trace → Logs to LangFuse
2. **Tool Invocation** → LangFuse Service creates generation → Links to trace
3. **Quality Feedback** → LangFuse Service creates score → Links to trace
4. **Agent Interaction** → LangFuse Service creates trace → Tracks persona

---

## Phase 1: Foundation Setup

### 1.1 LangFuse Backend Setup

**Options:**
- **LangFuse Cloud** (Recommended for initial setup)
  - Sign up at https://cloud.langfuse.com
  - Get Public Key and Secret Key
- **Self-Hosted** (For production/enterprise)
  - Deploy using Docker Compose
  - Or deploy on Kubernetes using Helm charts

**Decision:** Start with LangFuse Cloud, migrate to self-hosted if needed.

### 1.2 Install Dependencies

```bash
npm install langfuse
```

### 1.3 Environment Configuration

**File:** `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  authUrl: 'http://localhost:3000/api/auth',
  useMockData: true,
  inspectorUrl: 'http://localhost:6274',
  flowiseUrl: 'http://localhost:3000',
  // LangFuse Configuration
  langfuse: {
    enabled: true, // Feature flag
    publicKey: process.env['NG_APP_LANGFUSE_PUBLIC_KEY'] || '',
    secretKey: process.env['NG_APP_LANGFUSE_SECRET_KEY'] || '',
    host: process.env['NG_APP_LANGFUSE_HOST'] || 'https://cloud.langfuse.com',
    // Optional: Project-level configuration
    projectId: process.env['NG_APP_LANGFUSE_PROJECT_ID'] || '',
    // Feature flags
    trackWorkflows: true,
    trackToolCalls: true,
    trackQualityScores: true,
    trackAgentInteractions: true
  }
};
```

**File:** `src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  // ... existing config
  langfuse: {
    enabled: true,
    publicKey: process.env['NG_APP_LANGFUSE_PUBLIC_KEY'] || '',
    secretKey: process.env['NG_APP_LANGFUSE_SECRET_KEY'] || '',
    host: process.env['NG_APP_LANGFUSE_HOST'] || 'https://cloud.langfuse.com',
    projectId: process.env['NG_APP_LANGFUSE_PROJECT_ID'] || '',
    trackWorkflows: true,
    trackToolCalls: true,
    trackQualityScores: true,
    trackAgentInteractions: true
  }
};
```

### 1.4 Create LangFuse Models

**File:** `src/app/shared/models/langfuse.model.ts`

```typescript
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
}

export interface ToolCallMetadata {
  toolId: string;
  toolName: string;
  version?: string;
  agentPersona?: string;
}
```

---

## Phase 2: Core Service Integration

### 2.1 Create LangFuse Service

**File:** `src/app/core/services/langfuse.service.ts`

**Responsibilities:**
- Initialize LangFuse client
- Create and manage traces
- Create generations (LLM calls)
- Create scores (quality feedback)
- Create spans (sub-operations)
- **Prompt Management** (Priority Feature)
- **Security Scanning** (Priority Feature)
- Handle batching and flushing
- Error handling and fallback

**Key Methods:**

**Core Methods:**
- `initialize()` - Setup LangFuse client
- `createTrace()` - Start a new trace
- `updateTrace()` - Update trace with output
- `createGeneration()` - Log LLM call
- `createScore()` - Log quality score
- `createSpan()` - Log sub-operation
- `flush()` - Ensure all events are sent
- `isEnabled()` - Check if LangFuse is enabled

**Prompt Management Methods (Priority):**
- `createPrompt(name, prompt, config?)` - Create prompt in LangFuse
- `updatePrompt(promptId, prompt, config?)` - Update prompt (creates version)
- `getPrompt(promptId, version?)` - Get prompt from LangFuse
- `listPrompts(filters?)` - List all prompts
- `getPromptVersions(promptId)` - Get prompt version history
- `deletePrompt(promptId)` - Delete prompt

**Security Methods (Priority):**
- `scanTraceForSecurity(traceId)` - Scan trace for security issues
- `detectPII(text)` - Detect PII in text
- `redactPII(text, piiTypes?)` - Redact PII from text
- `detectPromptInjection(prompt, input)` - Detect injection attempts
- `calculateSecurityScore(trace)` - Calculate security score

**Observability Methods (Priority):**
- `getTraces(filters?)` - Get traces with filters
- `getTrace(id)` - Get trace details
- `getGenerations(traceId)` - Get generations for trace
- `getScores(traceId?)` - Get scores
- `getAnalytics(filters?)` - Get analytics/metrics

### 2.2 Integration with HTTP Interceptor

**File:** `src/app/core/interceptors/langfuse.interceptor.ts`

**Purpose:** Automatically track API calls that involve LLM operations

**Features:**
- Intercept workflow execution API calls
- Intercept tool invocation API calls
- Create traces for LLM-related requests
- Track latency and errors

### 2.3 Error Handling & Fallback

- Graceful degradation if LangFuse is unavailable
- Queue events locally if network fails
- Retry mechanism for failed events
- Feature flag to disable completely

---

## Phase 3: Prompt Repository ⭐ **PRIORITY**

### 3.1 Prompt Repository Service

**File:** `src/app/features/prompts/services/prompt.service.ts`

**Responsibilities:**
- CRUD operations for prompts
- Version management
- Prompt categorization and tagging
- Search and filtering
- Integration with LangFuse Prompts API

**Key Methods:**
- `getPrompts()` - List all prompts with filters
- `getPrompt(id, version?)` - Get prompt by ID and optional version
- `createPrompt()` - Create new prompt
- `updatePrompt()` - Update prompt (creates new version)
- `deletePrompt()` - Delete prompt
- `getPromptVersions(id)` - Get version history
- `rollbackPrompt(id, version)` - Rollback to specific version
- `searchPrompts(query)` - Search prompts by name/content
- `getPromptsByCategory(category)` - Filter by category
- `linkPromptToWorkflow(promptId, workflowId)` - Link prompt to workflow
- `linkPromptToTool(promptId, toolId)` - Link prompt to tool

### 3.2 Prompt Models

**File:** `src/app/shared/models/prompt.model.ts`

```typescript
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
```

### 3.3 Prompt List Component

**File:** `src/app/features/prompts/components/prompt-list/prompt-list.component.ts`

**Features:**
- Table/grid view of all prompts
- Filter by category, tags, status
- Search by name/description/content
- Sort by name, usage, last updated
- Quick actions: view, edit, duplicate, delete
- Version indicator
- Usage statistics
- Link to workflows/tools using prompt

### 3.4 Prompt Detail Component

**File:** `src/app/features/prompts/components/prompt-detail/prompt-detail.component.ts`

**Features:**
- Display prompt content with syntax highlighting
- Show version history with diff view
- Display variables and their types
- Show usage statistics and linked resources
- Performance metrics (avg latency, success rate)
- Cost analysis
- Actions: edit, duplicate, rollback, delete

### 3.5 Prompt Form Component

**File:** `src/app/features/prompts/components/prompt-form/prompt-form.component.ts`

**Features:**
- Rich text editor for prompt content
- Variable definition UI
- Category and tag selection
- Preview with sample variables
- Validation
- Save as new version option

### 3.6 Prompt Version History Component

**File:** `src/app/features/prompts/components/prompt-version-history/prompt-version-history.component.ts`

**Features:**
- List all versions with timestamps
- Diff view between versions
- Rollback functionality
- Version comparison
- Changelog display

### 3.7 Routes Configuration

**File:** `src/app/features/prompts/prompts.routes.ts`

```typescript
export const PROMPT_ROUTES: Routes = [
  {
    path: '',
    component: PromptListComponent
  },
  {
    path: 'new',
    component: PromptFormComponent
  },
  {
    path: ':id',
    component: PromptDetailComponent
  },
  {
    path: ':id/edit',
    component: PromptFormComponent
  },
  {
    path: ':id/versions',
    component: PromptVersionHistoryComponent
  }
];
```

### 3.8 LangFuse Integration

**Integration Points:**
- Sync prompts to LangFuse on create/update
- Pull prompts from LangFuse
- Version management via LangFuse API
- Track prompt usage in LangFuse traces

---

## Phase 4: Prompt Playground ⭐ **PRIORITY**

### 4.1 Prompt Playground Service

**File:** `src/app/features/prompts/services/prompt-playground.service.ts`

**Responsibilities:**
- Execute prompts with test inputs
- A/B test multiple prompt versions
- Evaluate prompt performance
- Track costs and latency
- Generate test datasets

**Key Methods:**
- `executePrompt(promptId, variables, options?)` - Execute prompt
- `compareVersions(promptId, versions, testInputs)` - A/B test versions
- `evaluatePrompt(promptId, testDataset)` - Run evaluation
- `estimateCost(promptId, variables)` - Estimate token cost
- `validateVariables(promptId, variables)` - Validate input variables

### 4.2 Prompt Playground Component

**File:** `src/app/features/prompts/components/prompt-playground/prompt-playground.component.ts`

**Features:**
- **Prompt Editor**: Edit prompt content with live preview
- **Variable Input Panel**: Input form for template variables
- **Execution Panel**: 
  - Execute button
  - Model selection (if multiple models available)
  - Temperature and other parameters
  - Execution history
- **Results Display**:
  - Output display with syntax highlighting
  - Token usage breakdown
  - Latency metrics
  - Cost calculation
  - Error messages
- **A/B Testing Panel**:
  - Select multiple prompt versions
  - Run side-by-side comparison
  - Compare outputs, latency, costs
- **Evaluation Panel**:
  - Load test dataset
  - Run batch evaluation
  - Display metrics (accuracy, latency, cost)
  - Export results

### 4.3 Prompt Comparison Component

**File:** `src/app/features/prompts/components/prompt-comparison/prompt-comparison.component.ts`

**Features:**
- Side-by-side prompt version comparison
- Parallel execution
- Metrics comparison (latency, cost, quality)
- Output diff view
- Save comparison results

### 4.4 Test Dataset Management

**File:** `src/app/features/prompts/components/test-dataset/test-dataset.component.ts`

**Features:**
- Create test datasets
- Import/export datasets (CSV, JSON)
- Manage test cases
- Run evaluations on datasets
- View evaluation results

### 4.5 Integration with Workflow Builder

**Features:**
- Select prompt from repository in workflow builder
- Test prompt before adding to workflow
- Preview prompt with workflow context
- Link prompt variables to workflow nodes

---

## Phase 5: Observability Dashboard ⭐ **PRIORITY**

### 5.1 Observability Service

**File:** `src/app/features/observability/services/observability.service.ts`

**Responsibilities:**
- Fetch traces from LangFuse
- Filter and search traces
- Get trace details
- Get generation details
- Get scores and analytics
- Real-time updates

**Key Methods:**
- `getTraces(filters?)` - Get traces with filters
- `getTrace(id)` - Get trace details
- `getGenerations(traceId)` - Get generations for trace
- `getScores(traceId?)` - Get scores
- `getAnalytics(filters?)` - Get analytics/metrics
- `searchTraces(query)` - Search traces
- `exportTraces(filters?)` - Export trace data

### 5.2 Observability Dashboard Component

**File:** `src/app/features/observability/components/observability-dashboard/observability-dashboard.component.ts`

**Features:**
- **Overview Metrics**:
  - Total traces
  - Success rate
  - Average latency
  - Total cost
  - Error rate
- **Time Series Charts**:
  - Traces over time
  - Latency trends
  - Cost trends
  - Error rate trends
- **Filter Panel**:
  - Date range picker
  - Filter by workflow, tool, status
  - Filter by user, session
  - Filter by tags
- **Recent Traces Table**:
  - List of recent traces
  - Status indicators
  - Quick actions
  - Link to detail view

### 5.3 Trace List Component

**File:** `src/app/features/observability/components/trace-list/trace-list.component.ts`

**Features:**
- Paginated table of traces
- Advanced filtering
- Sorting
- Bulk actions
- Export functionality
- Real-time updates (optional)

### 5.4 Trace Detail Component

**File:** `src/app/features/observability/components/trace-detail/trace-detail.component.ts`

**Features:**
- **Trace Tree Visualization**:
  - Hierarchical view of trace structure
  - Expand/collapse spans
  - Color coding by status
  - Timeline view
- **Trace Metadata**:
  - Input/output
  - Tags
  - User/session info
  - Timestamps
- **Generations View**:
  - List of LLM calls
  - Input/output for each
  - Token usage
  - Model parameters
- **Scores View**:
  - Quality scores
  - User feedback
  - Evaluation results
- **Actions**:
  - Link to workflow execution
  - Link to tool detail
  - Export trace
  - Create score

### 5.5 Generation Viewer Component

**File:** `src/app/features/observability/components/generation-viewer/generation-viewer.component.ts`

**Features:**
- Display generation input/output
- Syntax highlighting
- Token usage breakdown
- Model parameters
- Latency metrics
- Cost calculation
- Link to parent trace

### 5.6 Score Analytics Component

**File:** `src/app/features/observability/components/score-analytics/score-analytics.component.ts`

**Features:**
- Score distribution charts
- Score trends over time
- Correlation analysis
- Filter by score name
- Export analytics

### 5.7 Real-time Monitoring

**Features:**
- WebSocket connection for live updates
- Live trace feed
- Alert notifications
- Performance monitoring

### 5.8 Routes Configuration

**File:** `src/app/features/observability/observability.routes.ts`

```typescript
export const OBSERVABILITY_ROUTES: Routes = [
  {
    path: '',
    component: ObservabilityDashboardComponent
  },
  {
    path: 'traces',
    component: TraceListComponent
  },
  {
    path: 'traces/:id',
    component: TraceDetailComponent
  },
  {
    path: 'scores',
    component: ScoreAnalyticsComponent
  }
];
```

---

## Phase 6: AI Security Capabilities ⭐ **PRIORITY**

### 6.1 Security Service

**File:** `src/app/features/security/services/ai-security.service.ts`

**Responsibilities:**
- PII detection and redaction
- Prompt injection detection
- Content filtering
- Security scoring
- Threat detection
- Compliance monitoring

**Key Methods:**
- `detectPII(text)` - Detect PII in text
- `redactPII(text, piiTypes?)` - Redact PII
- `detectPromptInjection(prompt, input)` - Detect injection attempts
- `filterContent(content, rules)` - Apply content filters
- `calculateSecurityScore(trace)` - Calculate security score
- `checkCompliance(trace)` - Check compliance rules
- `scanTrace(traceId)` - Full security scan of trace

### 6.2 Security Models

**File:** `src/app/shared/models/security.model.ts`

```typescript
export interface SecurityScan {
  id: string;
  traceId: string;
  timestamp: string;
  score: number; // 0-100
  threats: SecurityThreat[];
  compliance: ComplianceCheck[];
  recommendations: string[];
}

export interface SecurityThreat {
  type: ThreatType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string; // Where in the trace
  detectedAt: string;
  mitigation?: string;
}

export type ThreatType = 
  | 'pii_exposure'
  | 'prompt_injection'
  | 'data_leakage'
  | 'unauthorized_access'
  | 'malicious_output'
  | 'compliance_violation';

export interface ComplianceCheck {
  rule: string;
  status: 'pass' | 'fail' | 'warning';
  description: string;
  details?: any;
}

export interface PIIDetection {
  type: PIIType;
  value: string;
  confidence: number;
  location: {
    start: number;
    end: number;
  };
}

export type PIIType = 
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'ip_address'
  | 'name'
  | 'address'
  | 'date_of_birth';

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  type: 'pii' | 'injection' | 'content' | 'compliance';
  enabled: boolean;
  config: Record<string, any>;
}
```

### 6.3 Security Dashboard Component

**File:** `src/app/features/security/components/security-dashboard/security-dashboard.component.ts`

**Features:**
- **Security Overview**:
  - Total threats detected
  - Security score trend
  - Compliance status
  - Recent threats
- **Threat Analysis**:
  - Threat type distribution
  - Severity breakdown
  - Threat trends over time
- **Compliance Status**:
  - Compliance rule status
  - Violations by rule
  - Compliance score
- **Recent Scans**:
  - List of recent security scans
  - Quick view of threats
  - Link to detailed scan

### 6.4 Security Scan Component

**File:** `src/app/features/security/components/security-scan/security-scan.component.ts`

**Features:**
- Display security scan results
- Threat details with severity
- Compliance check results
- Recommendations
- Actions to mitigate threats
- Re-scan functionality

### 6.5 PII Detection Component

**File:** `src/app/features/security/components/pii-detection/pii-detection.component.ts`

**Features:**
- Highlight PII in text
- Show PII types detected
- Redaction preview
- Redact button
- Export redacted version

### 6.6 Security Rules Management

**File:** `src/app/features/security/components/security-rules/security-rules.component.ts`

**Features:**
- List security rules
- Enable/disable rules
- Configure rule parameters
- Create custom rules
- Rule testing

### 6.7 Integration Points

**Trace Integration:**
- Automatic security scanning on trace creation
- Security score in trace metadata
- Threat alerts
- Compliance checks

**Prompt Integration:**
- Scan prompts for injection vulnerabilities
- Check prompts for PII
- Validate prompt security

**Workflow Integration:**
- Pre-execution security checks
- Runtime security monitoring
- Post-execution security analysis

### 6.8 Routes Configuration

**File:** `src/app/features/security/security.routes.ts`

```typescript
export const SECURITY_ROUTES: Routes = [
  {
    path: '',
    component: SecurityDashboardComponent
  },
  {
    path: 'scans',
    component: SecurityScanListComponent
  },
  {
    path: 'scans/:id',
    component: SecurityScanComponent
  },
  {
    path: 'rules',
    component: SecurityRulesComponent
  }
];
```

---

## Phase 7: Workflow Execution Tracking

### 3.1 Workflow Service Integration

**File:** `src/app/features/workflows/services/workflow.service.ts`

**Modifications:**
- Wrap `executeWorkflow()` with LangFuse trace
- Track workflow execution lifecycle
- Log workflow metadata (tools used, state, etc.)
- Track execution duration and status
- Link execution to workflow trace

**Trace Structure:**
```
Trace (Workflow Execution)
├── Span: Workflow Initialization
├── Span: Node Execution (for each node)
│   ├── Generation: LLM Call (if applicable)
│   └── Span: Tool Invocation (if MCP tool)
├── Span: Workflow Completion
└── Score: Quality Score (if available)
```

### 3.2 Execution Detail Component Enhancement

**File:** `src/app/features/workflows/components/execution-detail/execution-detail.component.ts`

**New Features:**
- Display LangFuse trace link
- Show trace visualization
- Display generation details
- Show quality scores linked to trace
- Link to LangFuse dashboard

### 3.3 Workflow Builder Integration

**File:** `src/app/features/workflows/components/workflow-builder/workflow-builder.component.ts`

**Features:**
- Track workflow creation/editing
- Log workflow definition changes
- Track template usage

---

## Phase 8: Tool Usage Observability

### 4.1 Tool Service Integration

**File:** `src/app/features/tools/services/tool.service.ts`

**Modifications:**
- Track tool invocations
- Log tool input/output
- Track tool version usage
- Monitor tool performance metrics
- Link tool calls to workflows

### 4.2 Tool Detail Component Enhancement

**File:** `src/app/features/tools/components/tool-detail/tool-detail.component.ts`

**New Features:**
- Display recent LangFuse traces for this tool
- Show tool usage statistics
- Display quality scores per tool
- Link to LangFuse dashboard filtered by tool

### 4.3 Inspector Service Integration

**File:** `src/app/features/inspector/services/inspector.service.ts`

**Features:**
- Connect MCP Inspector traces to LangFuse
- Forward inspector events to LangFuse
- Maintain trace continuity between inspector and registry

---

## Phase 9: Quality & Feedback Integration

### 5.1 Quality Service Integration

**File:** `src/app/features/quality/services/quality.service.ts`

**Modifications:**
- Link quality scores to LangFuse traces
- Create scores in LangFuse when feedback is submitted
- Track quality trends over time
- Correlate quality scores with specific tool/workflow executions

### 5.2 Feedback Form Enhancement

**File:** `src/app/features/quality/components/feedback-form/feedback-form.component.ts`

**Features:**
- Link feedback to specific trace ID
- Allow users to select trace from recent executions
- Auto-populate trace context
- Submit score to LangFuse

### 5.3 Quality Dashboard Integration

**File:** `src/app/features/quality/components/quality-dashboard/quality-dashboard.component.ts`

**Features:**
- Display LangFuse scores alongside quality metrics
- Show trace-based quality trends
- Link to LangFuse for detailed analysis

---

## Navigation Integration

**File:** `src/app/layout/sidebar/` (Update sidebar)

**Add:**
- "Prompts" menu item (with submenu: Repository, Playground)
- "Observability" menu item
- "Security" menu item
- Quick access to recent traces
- Link to LangFuse dashboard

---

## Configuration & Environment

### Environment Variables

```bash
# .env.local (for development)
NG_APP_LANGFUSE_PUBLIC_KEY=pk-lf-...
NG_APP_LANGFUSE_SECRET_KEY=sk-lf-...
NG_APP_LANGFUSE_HOST=https://cloud.langfuse.com
NG_APP_LANGFUSE_PROJECT_ID=...

# Production (set in CI/CD)
NG_APP_LANGFUSE_PUBLIC_KEY=${LANGFUSE_PUBLIC_KEY}
NG_APP_LANGFUSE_SECRET_KEY=${LANGFUSE_SECRET_KEY}
NG_APP_LANGFUSE_HOST=${LANGFUSE_HOST}
NG_APP_LANGFUSE_PROJECT_ID=${LANGFUSE_PROJECT_ID}
```

### Feature Flags

- `langfuse.enabled` - Master switch
- `langfuse.trackWorkflows` - Track workflow executions
- `langfuse.trackToolCalls` - Track tool invocations
- `langfuse.trackQualityScores` - Track quality feedback
- `langfuse.trackAgentInteractions` - Track agent personas

### Configuration Service Extension

**File:** `src/app/core/services/config.service.ts`

**Add:**
- `getLangFuseConfig()` - Get LangFuse configuration
- `isLangFuseEnabled()` - Check if enabled
- `getLangFuseFeatureFlags()` - Get feature flags

---

## Testing Strategy

### 7.1 Unit Tests

- Test LangFuse service methods
- Test trace creation
- Test error handling
- Test feature flags

### 7.2 Integration Tests

- Test workflow execution tracking
- Test tool call tracking
- Test quality score integration
- Test trace linking

### 7.3 E2E Tests

- Test complete workflow execution with tracing
- Test trace viewing in UI
- Test quality feedback submission
- Test observability dashboard

### 7.4 Mock LangFuse

- Create mock LangFuse service for testing
- Test without actual LangFuse backend
- Validate trace structure
- Test error scenarios

---

## Deployment Considerations

### 7.1 Security

- **Never expose secret keys in frontend code**
- Use backend proxy for LangFuse API calls (recommended)
- Or use public key only (less secure, but acceptable for read-only)
- Implement rate limiting
- Sanitize data before sending to LangFuse

### 7.2 Performance

- Batch events to reduce API calls
- Use async/background processing
- Implement queue for offline scenarios
- Flush events periodically, not on every action

### 7.3 Privacy & Compliance

- Review data sent to LangFuse
- Implement PII filtering
- Comply with data retention policies
- Allow users to opt-out of tracking

### 7.4 Backend Proxy (Recommended)

**Alternative Architecture:**
Instead of calling LangFuse directly from Angular, create a backend proxy:

```
Angular App → Backend API → LangFuse
```

**Benefits:**
- Keep secret keys secure
- Add additional processing
- Implement rate limiting
- Add data filtering/transformation

**Implementation:**
- Add LangFuse endpoints to NestJS backend
- Proxy requests from Angular to backend
- Backend calls LangFuse with secret key

---

## Implementation Phases Summary

### ⭐ Priority Phases (Weeks 1-4)

#### Phase 1: Foundation (Week 1)
- ✅ Setup LangFuse account/instance
- ✅ Install dependencies
- ✅ Configure environment
- ✅ Create models
- ✅ Create LangFuse service skeleton

#### Phase 2: Core Integration (Week 1-2)
- ✅ Implement LangFuse service
- ✅ Add HTTP interceptor
- ✅ Error handling & fallback
- ✅ Feature flags

#### Phase 3: Prompt Repository (Week 2-3) ⭐ **PRIORITY**
- ✅ Create prompt service
- ✅ Prompt CRUD operations
- ✅ Version management
- ✅ Prompt list/detail components
- ✅ LangFuse integration

#### Phase 4: Prompt Playground (Week 3) ⭐ **PRIORITY**
- ✅ Playground service
- ✅ Interactive prompt testing
- ✅ A/B testing component
- ✅ Test dataset management
- ✅ Integration with workflow builder

#### Phase 5: Observability Dashboard (Week 3-4) ⭐ **PRIORITY**
- ✅ Observability service
- ✅ Dashboard component
- ✅ Trace list/detail components
- ✅ Generation viewer
- ✅ Score analytics

#### Phase 6: AI Security Capabilities (Week 4) ⭐ **PRIORITY**
- ✅ Security service
- ✅ PII detection
- ✅ Prompt injection detection
- ✅ Security dashboard
- ✅ Security rules management

### Secondary Phases (Weeks 5+)

#### Phase 7: Workflow Execution Tracking (Week 5)
- ✅ Integrate with workflow service
- ✅ Track executions
- ✅ Enhance execution detail view

#### Phase 8: Tool Tracking (Week 6)
- ✅ Integrate with tool service
- ✅ Track tool calls
- ✅ Enhance tool detail view

#### Phase 9: Quality Integration (Week 7)
- ✅ Integrate with quality service
- ✅ Link scores to traces
- ✅ Enhance feedback forms

---

## Success Metrics

1. **Coverage**: 100% of workflow executions tracked
2. **Performance**: <50ms overhead per trace
3. **Reliability**: 99.9% successful trace submissions
4. **Adoption**: All quality scores linked to traces
5. **Insights**: Reduced debugging time by 50%

---

## Next Steps

1. **Review & Approve Plan**: Get stakeholder approval
2. **Setup LangFuse**: Create account or deploy instance
3. **Start Phase 1**: Begin foundation setup
4. **Iterate**: Implement phases incrementally
5. **Monitor**: Track success metrics
6. **Optimize**: Refine based on usage patterns

---

## References

- [LangFuse Documentation](https://langfuse.com/docs)
- [LangFuse TypeScript SDK](https://github.com/langfuse/langfuse-js)
- [LangFuse GitHub](https://github.com/langfuse/langfuse)
- [LangFuse API Reference](https://langfuse.com/docs/api-reference)

---

## Appendix: Code Structure

```
src/app/
├── core/
│   ├── services/
│   │   └── langfuse.service.ts            # Core LangFuse service
│   └── interceptors/
│       └── langfuse.interceptor.ts        # HTTP interceptor
├── features/
│   ├── prompts/                           # ⭐ NEW: Prompt Repository & Playground
│   │   ├── components/
│   │   │   ├── prompt-list/
│   │   │   ├── prompt-detail/
│   │   │   ├── prompt-form/
│   │   │   ├── prompt-version-history/
│   │   │   ├── prompt-playground/
│   │   │   ├── prompt-comparison/
│   │   │   └── test-dataset/
│   │   ├── services/
│   │   │   ├── prompt.service.ts
│   │   │   └── prompt-playground.service.ts
│   │   └── prompts.routes.ts
│   ├── observability/                     # ⭐ NEW: Observability Dashboard
│   │   ├── components/
│   │   │   ├── observability-dashboard/
│   │   │   ├── trace-list/
│   │   │   ├── trace-detail/
│   │   │   ├── generation-viewer/
│   │   │   └── score-analytics/
│   │   ├── services/
│   │   │   └── observability.service.ts
│   │   └── observability.routes.ts
│   ├── security/                          # ⭐ NEW: AI Security
│   │   ├── components/
│   │   │   ├── security-dashboard/
│   │   │   ├── security-scan/
│   │   │   ├── pii-detection/
│   │   │   └── security-rules/
│   │   ├── services/
│   │   │   └── ai-security.service.ts
│   │   └── security.routes.ts
│   ├── workflows/
│   │   └── services/
│   │       └── workflow.service.ts        # Modified
│   ├── tools/
│   │   └── services/
│   │       └── tool.service.ts             # Modified
│   └── quality/
│       └── services/
│           └── quality.service.ts         # Modified
└── shared/
    ├── components/
    │   └── langfuse-trace-viewer/          # New component
    └── models/
        ├── langfuse.model.ts               # New models
        ├── prompt.model.ts                 # ⭐ NEW
        └── security.model.ts                # ⭐ NEW
```

---

**Document Version:** 2.0  
**Last Updated:** 2024  
**Author:** AI Assistant  
**Status:** Updated - Priority Features Identified

## Priority Implementation Roadmap

### Immediate Focus (Weeks 1-4)
1. **Week 1**: Foundation + Core Service
2. **Week 2**: Prompt Repository
3. **Week 3**: Prompt Playground + Observability Dashboard (Start)
4. **Week 4**: Observability Dashboard (Complete) + AI Security

### Success Criteria for Priority Features
- ✅ Prompt Repository: 100% of workflow prompts stored and versioned
- ✅ Prompt Playground: <2s execution time for prompt testing
- ✅ Observability: Real-time trace visibility for all workflows
- ✅ Security: 100% of traces scanned, <1% false positive rate


