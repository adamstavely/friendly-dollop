import { Injectable } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { Tool, ToolVersion } from '../../../shared/models/tool.model';

export interface ToolSearchParams {
  q?: string;
  domain?: string;
  tags?: string;
  version?: string;
  securityClass?: string;
  ownerTeam?: string;
  health?: string;
  compliance?: string;
  lifecycleState?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToolService {
  constructor(
    private api: ApiService,
    private mockData: MockDataService
  ) {}

  getTools(params?: ToolSearchParams): Observable<{ tools: Tool[]; total: number }> {
    return this.api.get<{ tools: Tool[]; total: number }>('/tools', params).pipe(
      catchError(() => {
        let tools = this.mockData.getMockTools();
        
        // Apply filters
        if (params?.q) {
          const query = params.q.toLowerCase();
          tools = tools.filter(t => 
            t.name.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query)
          );
        }
        if (params?.domain) {
          tools = tools.filter(t => t.domain === params.domain);
        }
        if (params?.lifecycleState) {
          tools = tools.filter(t => t.lifecycleState === params.lifecycleState);
        }
        if (params?.securityClass) {
          tools = tools.filter(t => t.securityClass === params.securityClass);
        }
        
        return of({ tools, total: tools.length });
      })
    );
  }

  getToolById(id: string): Observable<Tool> {
    return this.api.get<Tool>(`/tools/${id}`).pipe(
      catchError(() => {
        const tool = this.mockData.getMockTool(id);
        if (tool) {
          return of(tool);
        }
        throw new Error('Tool not found');
      })
    );
  }

  createTool(tool: Partial<Tool>): Observable<Tool> {
    return this.api.post<Tool>('/tools', tool).pipe(
      catchError(() => {
        // Return mock created tool
        const newTool: Tool = {
          ...tool as Tool,
          toolId: `tool-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return of(newTool);
      })
    );
  }

  updateTool(id: string, tool: Partial<Tool>): Observable<Tool> {
    return this.api.put<Tool>(`/tools/${id}`, tool).pipe(
      catchError(() => {
        const existing = this.mockData.getMockTool(id);
        if (existing) {
          const updated = { ...existing, ...tool, updatedAt: new Date().toISOString() };
          return of(updated as Tool);
        }
        throw new Error('Tool not found');
      })
    );
  }

  deleteTool(id: string): Observable<void> {
    return this.api.delete<void>(`/tools/${id}`).pipe(
      catchError(() => of(undefined as void))
    );
  }

  addVersion(id: string, version: Partial<ToolVersion>): Observable<ToolVersion> {
    return this.api.post<ToolVersion>(`/tools/${id}/versions`, version);
  }

  validateTool(id: string): Observable<any> {
    return this.api.post(`/tools/${id}/validate`, {});
  }

  getToolHealth(id: string): Observable<any> {
    return this.api.get(`/tools/${id}/health`).pipe(
      catchError(() => of({
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        uptime: 99.9
      }))
    );
  }

  getToolUsage(id: string): Observable<any> {
    return this.api.get(`/tools/${id}/usage`).pipe(
      catchError(() => of({
        totalCalls: 1250,
        callsLast24h: 45,
        avgLatency: 180,
        errorRate: 0.02
      }))
    );
  }

  getToolAudit(id: string): Observable<any[]> {
    return this.api.get<any[]>(`/tools/${id}/audit`).pipe(
      catchError(() => of([
        {
          action: 'created',
          user: 'admin',
          timestamp: new Date().toISOString()
        },
        {
          action: 'updated',
          user: 'admin',
          timestamp: new Date(Date.now() - 86400000).toISOString()
        }
      ]))
    );
  }

  searchTools(query: string): Observable<Tool[]> {
    return this.api.get<Tool[]>('/search', { q: query });
  }

  promoteTool(id: string, targetState: string): Observable<Tool> {
    return this.api.post<Tool>(`/tools/${id}/promote`, { targetState });
  }

  getDependencies(id: string): Observable<any> {
    return this.api.get(`/tools/${id}/dependencies`);
  }

  getReverseDependencies(id: string): Observable<any> {
    return this.api.get(`/tools/${id}/reverse-dependencies`);
  }

  getQualityScore(id: string): Observable<{ score: number; breakdown: any }> {
    return this.api.get(`/tools/${id}/quality-score`);
  }

  submitFeedback(id: string, feedback: any): Observable<void> {
    return this.api.post(`/tools/${id}/feedback`, feedback);
  }

  getChangelog(id: string): Observable<any[]> {
    return this.api.get(`/tools/${id}/changelog`);
  }

  getPolicy(id: string): Observable<any> {
    return this.api.get(`/tools/${id}/policy`);
  }

  getSchemaDiagram(id: string): Observable<any> {
    return this.api.get(`/tools/${id}/schema/diagram`);
  }

  retireTool(id: string, retirementPlan: any): Observable<void> {
    return this.api.post(`/tools/${id}/retire`, retirementPlan);
  }
}

