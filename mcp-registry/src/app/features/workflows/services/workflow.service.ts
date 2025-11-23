import { Injectable } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { 
  Workflow, 
  WorkflowDefinition, 
  WorkflowExecution,
  WorkflowTemplate 
} from '../../../shared/models/workflow.model';
import { environment } from '../../../../environments/environment';

export interface WorkflowSearchParams {
  q?: string;
  status?: string;
  tags?: string;
  mcpTool?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private flowiseApiUrl: string;

  constructor(
    private api: ApiService,
    private mockData: MockDataService
  ) {
    // Flowise API URL - defaults to localhost:3000 if not configured
    this.flowiseApiUrl = (environment as any).flowiseUrl || 'http://localhost:3000';
  }

  // Get all workflows
  getWorkflows(params?: WorkflowSearchParams): Observable<{ workflows: Workflow[]; total: number }> {
    // Try Flowise API first
    return this.api.get<{ workflows: Workflow[]; total: number }>('/workflows', params).pipe(
      catchError(() => {
        // Fallback to mock data
        let workflows = this.getMockWorkflows();
        
        // Apply filters
        if (params?.q) {
          const query = params.q.toLowerCase();
          workflows = workflows.filter(w => 
            w.name.toLowerCase().includes(query) ||
            w.description?.toLowerCase().includes(query)
          );
        }
        if (params?.status) {
          workflows = workflows.filter(w => w.status === params.status);
        }
        if (params?.mcpTool) {
          workflows = workflows.filter(w => 
            w.mcpTools?.includes(params.mcpTool!)
          );
        }
        
        return of({ workflows, total: workflows.length });
      })
    );
  }

  // Get workflow by ID
  getWorkflowById(id: string): Observable<Workflow> {
    return this.api.get<Workflow>(`/workflows/${id}`).pipe(
      catchError(() => {
        const workflow = this.getMockWorkflow(id);
        if (workflow) {
          return of(workflow);
        }
        throw new Error('Workflow not found');
      })
    );
  }

  // Get workflow definition (nodes and connections)
  getWorkflowDefinition(id: string): Observable<WorkflowDefinition> {
    // Try Flowise API
    return this.api.get<WorkflowDefinition>(`/workflows/${id}/definition`).pipe(
      catchError(() => {
        // Fallback to mock
        return of(this.getMockWorkflowDefinition(id));
      })
    );
  }

  // Create new workflow
  createWorkflow(workflow: Partial<Workflow>): Observable<Workflow> {
    return this.api.post<Workflow>('/workflows', workflow).pipe(
      catchError(() => {
        const newWorkflow: Workflow = {
          ...workflow as Workflow,
          id: `workflow-${Date.now()}`,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return of(newWorkflow);
      })
    );
  }

  // Update workflow
  updateWorkflow(id: string, workflow: Partial<Workflow>): Observable<Workflow> {
    return this.api.put<Workflow>(`/workflows/${id}`, workflow).pipe(
      catchError(() => {
        const existing = this.getMockWorkflow(id);
        if (existing) {
          const updated = { 
            ...existing, 
            ...workflow, 
            updatedAt: new Date().toISOString() 
          };
          return of(updated as Workflow);
        }
        throw new Error('Workflow not found');
      })
    );
  }

  // Update workflow definition (nodes and connections)
  updateWorkflowDefinition(id: string, definition: WorkflowDefinition): Observable<WorkflowDefinition> {
    return this.api.put<WorkflowDefinition>(`/workflows/${id}/definition`, definition).pipe(
      catchError(() => {
        // In mock mode, just return the definition
        return of(definition);
      })
    );
  }

  // Delete workflow
  deleteWorkflow(id: string): Observable<void> {
    return this.api.delete<void>(`/workflows/${id}`).pipe(
      catchError(() => of(undefined as void))
    );
  }

  // Execute workflow
  executeWorkflow(id: string, input?: any): Observable<WorkflowExecution> {
    return this.api.post<WorkflowExecution>(`/workflows/${id}/execute`, { input }).pipe(
      catchError(() => {
        // Mock execution
        const execution: WorkflowExecution = {
          id: `exec-${Date.now()}`,
          workflowId: id,
          status: 'completed',
          startedAt: new Date().toISOString(),
          completedAt: new Date(Date.now() + 2000).toISOString(),
          duration: 2000,
          input,
          output: { result: 'Mock execution result' }
        };
        return of(execution);
      })
    );
  }

  // Get execution history
  getExecutionHistory(id: string, limit?: number): Observable<WorkflowExecution[]> {
    return this.api.get<WorkflowExecution[]>(`/workflows/${id}/executions`, { limit }).pipe(
      catchError(() => {
        return of([]);
      })
    );
  }

  // Get execution by ID
  getExecution(workflowId: string, executionId: string): Observable<WorkflowExecution> {
    return this.api.get<WorkflowExecution>(`/workflows/${workflowId}/executions/${executionId}`).pipe(
      catchError(() => {
        throw new Error('Execution not found');
      })
    );
  }

  // Get workflows using a specific MCP tool
  getWorkflowsByTool(toolId: string): Observable<Workflow[]> {
    return this.api.get<Workflow[]>(`/workflows/by-tool/${toolId}`).pipe(
      catchError(() => {
        const workflows = this.getMockWorkflows();
        return of(workflows.filter(w => w.mcpTools?.includes(toolId)));
      })
    );
  }

  // Get workflow templates
  getTemplates(): Observable<WorkflowTemplate[]> {
    return this.api.get<WorkflowTemplate[]>('/workflows/templates').pipe(
      catchError(() => {
        return of([]);
      })
    );
  }

  // Duplicate workflow
  duplicateWorkflow(id: string, name?: string): Observable<Workflow> {
    return this.api.post<Workflow>(`/workflows/${id}/duplicate`, { name }).pipe(
      catchError(() => {
        const existing = this.getMockWorkflow(id);
        if (existing) {
          const duplicated: Workflow = {
            ...existing,
            id: `workflow-${Date.now()}`,
            name: name || `${existing.name} (Copy)`,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return of(duplicated);
        }
        throw new Error('Workflow not found');
      })
    );
  }

  // Flowise API methods
  private getFlowiseUrl(endpoint: string): string {
    return `${this.flowiseApiUrl}/api/v1/${endpoint}`;
  }

  // Mock data helpers
  private getMockWorkflows(): Workflow[] {
    return [
      {
        id: 'workflow-1',
        name: 'Document Processing Pipeline',
        description: 'Processes documents using OCR and NLP tools',
        status: 'active',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        mcpTools: ['tool-1', 'tool-2'],
        lifecycleState: 'production',
        qualityScore: 85,
        executionCount: 1250,
        lastExecuted: new Date(Date.now() - 3600000).toISOString(),
        successRate: 0.98,
        avgExecutionTime: 2500
      },
      {
        id: 'workflow-2',
        name: 'Data Analysis Workflow',
        description: 'Analyzes data using multiple MCP tools',
        status: 'draft',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        mcpTools: ['tool-3'],
        lifecycleState: 'development',
        qualityScore: 0,
        executionCount: 0
      }
    ];
  }

  private getMockWorkflow(id: string): Workflow | null {
    const workflows = this.getMockWorkflows();
    return workflows.find(w => w.id === id) || null;
  }

  private getMockWorkflowDefinition(id: string): WorkflowDefinition {
    return {
      nodes: [
        {
          id: 'node-1',
          type: 'input',
          label: 'Input',
          position: { x: 100, y: 100 },
          data: {}
        },
        {
          id: 'node-2',
          type: 'mcp-tool',
          label: 'MCP Tool',
          position: { x: 300, y: 100 },
          data: {},
          mcpToolId: 'tool-1'
        },
        {
          id: 'node-3',
          type: 'output',
          label: 'Output',
          position: { x: 500, y: 100 },
          data: {}
        }
      ],
      connections: [
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'node-2'
        },
        {
          id: 'conn-2',
          source: 'node-2',
          target: 'node-3'
        }
      ],
      viewport: { x: 0, y: 0, zoom: 1 }
    };
  }
}

