import { Injectable } from '@angular/core';
import { Observable, of, catchError, switchMap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { LangFuseService } from '../../../core/services/langfuse.service';
import { LangFuseTrace, LangFuseGeneration, LangFuseScore, LangFuseTraceFilter, LangFuseAnalytics } from '../../../shared/models/langfuse.model';

export interface TraceFilters {
  userId?: string;
  sessionId?: string;
  name?: string;
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
    const params: any = {
      limit: filters?.limit || 50,
      page: filters?.page || 1
    };

    if (filters?.userId) params.userId = filters.userId;
    if (filters?.sessionId) params.sessionId = filters.sessionId;
    if (filters?.name) params.name = filters.name;
    if (filters?.tags && filters.tags.length > 0) params.tags = filters.tags.join(',');
    if (filters?.fromTimestamp) params.fromTimestamp = filters.fromTimestamp.toISOString();
    if (filters?.toTimestamp) params.toTimestamp = filters.toTimestamp.toISOString();

    return this.api.get<{ traces: LangFuseTrace[]; total: number; page: number; limit: number }>('/langfuse/traces', params).pipe(
      catchError(() => {
        return of({ traces: this.getMockTraces(), total: 10 });
      }),
      switchMap((response) => {
        return of({ traces: response.traces || [], total: response.total || 0 });
      })
    );
  }

  /**
   * Get trace by ID
   */
  getTrace(id: string): Observable<LangFuseTrace | null> {
    return this.api.get<LangFuseTrace>(`/langfuse/traces/${id}`).pipe(
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
    return this.api.get<{ generations: LangFuseGeneration[] }>(`/langfuse/traces/${traceId}/generations`).pipe(
      catchError(() => {
        // Mock generations
        return of({
          generations: [{
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
          }]
        });
      }),
      switchMap((response) => {
        return of(response.generations || []);
      })
    );
  }

  /**
   * Get scores for traces
   */
  getScores(traceId?: string): Observable<LangFuseScore[]> {
    const endpoint = traceId 
      ? `/langfuse/traces/${traceId}/scores`
      : '/langfuse/scores';
    
    const params = traceId ? {} : { traceId };
    
    return this.api.get<{ scores: LangFuseScore[] }>(endpoint, params).pipe(
      catchError(() => {
        return of({ scores: [] });
      }),
      switchMap((response) => {
        return of(response.scores || []);
      })
    );
  }

  /**
   * Get observability metrics
   */
  getMetrics(filters?: TraceFilters): Observable<ObservabilityMetrics> {
    const params: any = {};
    if (filters?.fromTimestamp) params.fromTimestamp = filters.fromTimestamp.toISOString();
    if (filters?.toTimestamp) params.toTimestamp = filters.toTimestamp.toISOString();

    return this.api.get<ObservabilityMetrics>('/langfuse/analytics', params).pipe(
      catchError(() => {
        // Fallback to mock data
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
   * Export traces to CSV/JSON
   */
  exportTraces(filters?: TraceFilters, format: 'csv' | 'json' = 'json', traceIds?: string[]): Observable<Blob> {
    // If specific trace IDs are provided, fetch those traces
    const fetchObservable = traceIds && traceIds.length > 0
      ? this.getTraces({ ...filters, limit: 1000 }).pipe(
          switchMap(result => {
            const filtered = result.traces.filter(t => traceIds.includes(t.id || ''));
            return of({ traces: filtered, total: filtered.length });
          })
        )
      : this.getTraces({ ...filters, limit: 1000 });

    return fetchObservable.pipe(
      switchMap((result) => {
        const traces = result.traces;
        let blob: Blob;

        if (format === 'csv') {
          // Enhanced CSV export with more fields
          const headers = [
            'ID', 'Name', 'Timestamp', 'Status', 'Tags', 'User ID', 'Session ID',
            'Input', 'Output', 'Metadata', 'Release', 'Version'
          ];
          const rows = traces.map(trace => [
            trace.id || '',
            trace.name || '',
            trace.timestamp ? new Date(trace.timestamp).toISOString() : '',
            trace.output && typeof trace.output === 'object' && 'error' in trace.output ? 'error' : 'success',
            (trace.tags || []).join(';'),
            trace.userId || '',
            trace.sessionId || '',
            JSON.stringify(trace.input || {}),
            JSON.stringify(trace.output || {}),
            JSON.stringify(trace.metadata || {}),
            trace.release || '',
            trace.version || ''
          ]);

          const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          ].join('\n');

          blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        } else {
          // Enhanced JSON export with metadata
          const exportData = {
            exportedAt: new Date().toISOString(),
            totalTraces: traces.length,
            filters: filters || {},
            traceIds: traceIds || [],
            traces: traces.map(trace => ({
              ...trace,
              status: trace.output && typeof trace.output === 'object' && 'error' in trace.output ? 'error' : 'success',
              exportedAt: new Date().toISOString()
            }))
          };
          const jsonContent = JSON.stringify(exportData, null, 2);
          blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        }

        return of(blob);
      }),
      catchError(() => {
        // Return empty blob on error
        return of(new Blob([], { type: 'application/json' }));
      })
    );
  }

  /**
   * Search traces
   */
  searchTraces(query: string): Observable<LangFuseTrace[]> {
    return this.api.post<{ traces: LangFuseTrace[] }>('/langfuse/traces/search', { query }).pipe(
      catchError(() => {
        const traces = this.getMockTraces();
        const lowerQuery = query.toLowerCase();
        return of({
          traces: traces.filter(t => 
            t.name.toLowerCase().includes(lowerQuery) ||
            JSON.stringify(t.input || {}).toLowerCase().includes(lowerQuery)
          )
        });
      }),
      switchMap((response) => {
        return of(response.traces || []);
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
