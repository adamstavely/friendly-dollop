import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
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
  constructor(private api: ApiService) {}

  getTools(params?: ToolSearchParams): Observable<{ tools: Tool[]; total: number }> {
    return this.api.get<{ tools: Tool[]; total: number }>('/tools', params);
  }

  getToolById(id: string): Observable<Tool> {
    return this.api.get<Tool>(`/tools/${id}`);
  }

  createTool(tool: Partial<Tool>): Observable<Tool> {
    return this.api.post<Tool>('/tools', tool);
  }

  updateTool(id: string, tool: Partial<Tool>): Observable<Tool> {
    return this.api.put<Tool>(`/tools/${id}`, tool);
  }

  deleteTool(id: string): Observable<void> {
    return this.api.delete<void>(`/tools/${id}`);
  }

  addVersion(id: string, version: Partial<ToolVersion>): Observable<ToolVersion> {
    return this.api.post<ToolVersion>(`/tools/${id}/versions`, version);
  }

  validateTool(id: string): Observable<any> {
    return this.api.post(`/tools/${id}/validate`, {});
  }

  getToolHealth(id: string): Observable<any> {
    return this.api.get(`/tools/${id}/health`);
  }

  getToolUsage(id: string): Observable<any> {
    return this.api.get(`/tools/${id}/usage`);
  }

  getToolAudit(id: string): Observable<any[]> {
    return this.api.get(`/tools/${id}/audit`);
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

