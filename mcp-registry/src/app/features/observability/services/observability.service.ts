import { Injectable } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { LangFuseService } from '../../../core/services/langfuse.service';
import { LangFuseTrace, LangFuseGeneration, LangFuseScore } from '../../../shared/models/langfuse.model';

export interface TraceFilters {
  userId?: string;
  sessionId?: string;
  tags?: string[];
  fromTimestamp?: Date;
  toTimestamp?: Date;
  workflowId?: string;
  toolId?: string;
  status?: 'success' | 'error';
  limit?: number;
  page?: number;
}

export interface ObservabilityMetrics {
  totalTraces: number;
  successRate: number;
  averageLatency: number;
  totalCost: number;
  errorRate: number;
  tracesOverTime: Array<{ date: string; count: number }>;
  latencyTrend: Array<{ date: string; latency: number }>;
}

@Injectable({
  providedIn: 'root'
})
export class ObservabilityService {
  constructor(
    private api: ApiService,
    private langfuse: LangFuseService
  ) {}

  /**
   * Get traces with filters
   */
  getTraces(filters?: TraceFilters): Observable<{ traces: LangFuseTrace[]; total: number }> {
    return this.api.get<{ traces: LangFuseTrace[]; total: number }>('/observability/traces', filters).pipe(
      catchError(() => {
        // Mock data fallback
        return of({
          traces: this.getMockTraces(),
          total: 10
        });
      })
    );
  }

  /**
   * Get trace by ID
   */
  getTrace(id: string): Observable<LangFuseTrace | null> {
    return this.api.get<LangFuseTrace>(`/observability/traces/${id}`).pipe(
      catchError(() => {
        const traces = this.getMockTraces();
        return of(traces.find(t => t.id === id) || null);
      })
    );
  }

  /**
   * Get generations for a trace
   */
  getGenerations(traceId: string): Observable<LangFuseGeneration[]> {
    return this.api.get<LangFuseGeneration[]>(`/observability/traces/${traceId}/generations`).pipe(
      catchError(() => {
        // Mock generations
        return of([
          {
            id: 'gen-1',
            traceId,
            name: 'LLM Call',
            model: 'gpt-4',
            input: { prompt: 'Test prompt' },
            output: 'Test output',
            usage: {
              promptTokens: 100,
              completionTokens: 50,
              totalTokens: 150
            }
          }
        ]);
      })
    );
  }

  /**
   * Get scores for traces
   */
  getScores(traceId?: string): Observable<LangFuseScore[]> {
    const endpoint = traceId 
      ? `/observability/traces/${traceId}/scores`
      : '/observability/scores';
    
    return this.api.get<LangFuseScore[]>(endpoint).pipe(
      catchError(() => {
        return of([]);
      })
    );
  }

  /**
   * Get observability metrics
   */
  getMetrics(filters?: TraceFilters): Observable<ObservabilityMetrics> {
    return this.api.get<ObservabilityMetrics>('/observability/metrics', filters).pipe(
      catchError(() => {
        // Mock metrics
        return of({
          totalTraces: 1250,
          successRate: 0.98,
          averageLatency: 1250,
          totalCost: 45.50,
          errorRate: 0.02,
          tracesOverTime: this.generateTimeSeries(30),
          latencyTrend: this.generateLatencyTrend(30)
        });
      })
    );
  }

  /**
   * Search traces
   */
  searchTraces(query: string): Observable<LangFuseTrace[]> {
    return this.api.get<LangFuseTrace[]>('/observability/traces/search', { q: query }).pipe(
      catchError(() => {
        const traces = this.getMockTraces();
        const lowerQuery = query.toLowerCase();
        return of(traces.filter(t => 
          t.name.toLowerCase().includes(lowerQuery) ||
          JSON.stringify(t.input || {}).toLowerCase().includes(lowerQuery)
        ));
      })
    );
  }

  // Mock data helpers
  private getMockTraces(): LangFuseTrace[] {
    return [
      {
        id: 'trace-1',
        name: 'Workflow Execution: Document Processing',
        input: { document: 'test.pdf' },
        output: { summary: 'Document processed successfully' },
        metadata: { workflowId: 'workflow-1', executionId: 'exec-1' },
        tags: ['workflow', 'document-processing'],
        timestamp: new Date().toISOString()
      },
      {
        id: 'trace-2',
        name: 'Tool Invocation: Search Tool',
        input: { query: 'test query' },
        output: { results: [] },
        metadata: { toolId: 'tool-1' },
        tags: ['tool', 'search'],
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ];
  }

  private generateTimeSeries(days: number): Array<{ date: string; count: number }> {
    const series: Array<{ date: string; count: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      series.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 100) + 50
      });
    }
    return series;
  }

  private generateLatencyTrend(days: number): Array<{ date: string; latency: number }> {
    const trend: Array<{ date: string; latency: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trend.push({
        date: date.toISOString().split('T')[0],
        latency: Math.floor(Math.random() * 500) + 1000
      });
    }
    return trend;
  }
}
