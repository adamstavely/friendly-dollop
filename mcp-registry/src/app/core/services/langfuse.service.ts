import { Injectable } from '@angular/core';
import { Langfuse } from 'langfuse';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LangFuseTrace,
  LangFuseGeneration,
  LangFuseScore,
  LangFuseSpan,
  WorkflowTraceMetadata,
  ToolCallMetadata,
  LangFusePrompt,
  LangFuseTraceFilter,
  LangFuseAnalytics
} from '../../shared/models/langfuse.model';

@Injectable({
  providedIn: 'root'
})
export class LangFuseService {
  private client: Langfuse | null = null;
  private enabled: boolean = false;
  private activeTraces: Map<string, any> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const config = environment.langfuse;
    
    if (!config || !config.enabled) {
      console.log('LangFuse is disabled');
      return;
    }

    if (!config.publicKey || !config.secretKey) {
      console.warn('LangFuse keys not configured');
      return;
    }

    try {
      this.client = new Langfuse({
        publicKey: config.publicKey,
        secretKey: config.secretKey,
        baseUrl: config.host,
        flushAt: 20, // Flush after 20 events
        flushInterval: 10000 // Flush every 10 seconds
      });

      this.enabled = true;
      console.log('LangFuse initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LangFuse:', error);
      this.enabled = false;
    }
  }

  /**
   * Check if LangFuse is enabled and configured
   */
  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  /**
   * Create a trace for workflow execution
   */
  createWorkflowTrace(
    workflowId: string,
    workflowName: string,
    executionId: string,
    input?: any,
    metadata?: Partial<WorkflowTraceMetadata>
  ): string | null {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const traceMetadata: WorkflowTraceMetadata = {
        workflowId,
        workflowName,
        executionId,
        ...metadata
      };

      const trace = this.client!.trace({
        name: `Workflow: ${workflowName}`,
        userId: metadata?.workflowId,
        sessionId: executionId,
        input,
        metadata: traceMetadata,
        tags: ['workflow', workflowId]
      });

      this.activeTraces.set(executionId, trace);
      return trace.id || null;
    } catch (error) {
      console.error('Failed to create workflow trace:', error);
      return null;
    }
  }

  /**
   * Create a generation (LLM call) within a trace
   */
  createGeneration(
    executionId: string,
    name: string,
    input: any,
    output?: any,
    model?: string,
    usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number },
    metadata?: Record<string, any>
  ): string | null {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const trace = this.activeTraces.get(executionId);
      if (!trace) {
        console.warn(`Trace not found for execution ${executionId}`);
        return null;
      }

      const generation = trace.generation({
        name,
        model,
        input,
        output,
        usage,
        metadata
      });

      return generation.id || null;
    } catch (error) {
      console.error('Failed to create generation:', error);
      return null;
    }
  }

  /**
   * Create a span for tool execution
   */
  createToolSpan(
    executionId: string,
    toolName: string,
    toolId: string,
    input: any,
    output?: any,
    metadata?: Partial<ToolCallMetadata>
  ): string | null {
    if (!this.isEnabled() || !environment.langfuse?.trackToolCalls) {
      return null;
    }

    try {
      const trace = this.activeTraces.get(executionId);
      if (!trace) {
        console.warn(`Trace not found for execution ${executionId}`);
        return null;
      }

      const spanMetadata: ToolCallMetadata = {
        toolId,
        toolName,
        ...metadata
      };

      const span = trace.span({
        name: `Tool: ${toolName}`,
        input,
        output,
        metadata: spanMetadata,
        tags: ['tool', toolId]
      });

      return span.id || null;
    } catch (error) {
      console.error('Failed to create tool span:', error);
      return null;
    }
  }

  /**
   * Create a score for quality feedback
   */
  createScore(
    executionId: string,
    name: string,
    value: number,
    comment?: string
  ): string | null {
    if (!this.isEnabled() || !environment.langfuse?.trackQualityScores) {
      return null;
    }

    try {
      const trace = this.activeTraces.get(executionId);
      if (!trace) {
        console.warn(`Trace not found for execution ${executionId}`);
        return null;
      }

      const score = trace.score({
        name,
        value,
        comment
      });

      return score.id || null;
    } catch (error) {
      console.error('Failed to create score:', error);
      return null;
    }
  }

  /**
   * Update trace output
   */
  updateTraceOutput(executionId: string, output: any): void {
    if (!this.isEnabled()) {
      return;
    }

    try {
      const trace = this.activeTraces.get(executionId);
      if (trace) {
        trace.update({
          output
        });
      }
    } catch (error) {
      console.error('Failed to update trace output:', error);
    }
  }

  /**
   * End a trace
   */
  endTrace(executionId: string, output?: any): void {
    if (!this.isEnabled()) {
      return;
    }

    try {
      const trace = this.activeTraces.get(executionId);
      if (trace) {
        trace.update({
          output: output || trace.output
        });
        this.activeTraces.delete(executionId);
      }
    } catch (error) {
      console.error('Failed to end trace:', error);
    }
  }

  /**
   * Flush pending events
   */
  async flush(): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      await this.client!.flush();
    } catch (error) {
      console.error('Failed to flush LangFuse events:', error);
    }
  }

  /**
   * Get trace by ID (from LangFuse API)
   */
  getTrace(traceId: string): Observable<LangFuseTrace> {
    // This would call LangFuse API to fetch trace details
    // For now, return mock data
    return of({
      id: traceId,
      name: 'Workflow Execution',
      input: {},
      output: {}
    });
  }

  /**
   * Search traces with filters
   */
  searchTraces(filter: LangFuseTraceFilter): Observable<LangFuseTrace[]> {
    // This would call LangFuse API to search traces
    // For now, return empty array
    return of([]);
  }

  /**
   * Get analytics
   */
  getAnalytics(filter?: LangFuseTraceFilter): Observable<LangFuseAnalytics> {
    // This would call LangFuse API to get analytics
    // For now, return mock data
    return of({
      totalTraces: 0,
      successRate: 0,
      averageLatency: 0,
      totalCost: 0,
      errorRate: 0,
      tracesOverTime: [],
      latencyTrends: [],
      costTrends: []
    });
  }
}
