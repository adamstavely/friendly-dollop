import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError, switchMap, tap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { LangFuseService } from '../../../core/services/langfuse.service';
import { 
  Workflow, 
  WorkflowDefinition, 
  WorkflowExecution,
  WorkflowTemplate,
  WorkflowEngine,
  AgentConfig,
  ChainConfig
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
  private langchainBackendUrl: string;
  private http: HttpClient;

  constructor(
    private api: ApiService,
    private mockData: MockDataService,
    private langfuse: LangFuseService,
    http: HttpClient
  ) {
    // Flowise API URL - defaults to localhost:3000 if not configured
    this.flowiseApiUrl = (environment as any).flowiseUrl || 'http://localhost:3000';
    // Langchain/Langgraph backend URL
    this.langchainBackendUrl = (environment as any).langchainBackendUrl || 'http://localhost:8000/api';
    this.http = http;
  }

  /**
   * Get the appropriate API URL based on workflow engine
   */
  private getApiUrl(engine?: WorkflowEngine): string {
    if (engine === 'langchain' || engine === 'langgraph') {
      return this.langchainBackendUrl;
    }
    // Default to main API (Flowise or main backend)
    return environment.apiUrl;
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
  executeWorkflow(id: string, input?: any, engine?: WorkflowEngine): Observable<WorkflowExecution> {
    // Get workflow to determine engine if not provided
    if (!engine) {
      return this.getWorkflowById(id).pipe(
        catchError(() => of(null as any)),
        switchMap((workflow: Workflow | null) => {
          if (!workflow) {
            return throwError(() => new Error('Workflow not found'));
          }
          engine = workflow.engine || 'flowise';
          const apiUrl = this.getApiUrl(engine);
          return this.http.post<WorkflowExecution>(`${apiUrl}/workflows/${id}/execute`, { input });
        }),
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
    
    const apiUrl = this.getApiUrl(engine);
    
    // Create LangFuse trace if enabled
    let traceId: string | null = null;
    if (environment.langfuse?.enabled && environment.langfuse?.trackWorkflows) {
      this.getWorkflowById(id).subscribe(workflow => {
        traceId = this.langfuse.createWorkflowTrace(
          id,
          workflow.name,
          `exec-${Date.now()}`,
          input,
          {
            workflowId: id,
            workflowName: workflow.name,
            executionId: `exec-${Date.now()}`,
            mcpTools: workflow.mcpTools,
            lifecycleState: workflow.lifecycleState,
            engine: workflow.engine,
            workflowType: workflow.workflowType
          }
        );
      });
    }
    
    return this.http.post<WorkflowExecution>(`${apiUrl}/workflows/${id}/execute`, { input }).pipe(
      tap((execution: WorkflowExecution) => {
        // Update LangFuse trace with execution result
        if (traceId && environment.langfuse?.enabled) {
          this.langfuse.updateTraceOutput(execution.id, execution.output);
          
          // Create score if quality score exists
          if (execution.output?.qualityScore !== undefined) {
            this.langfuse.createScore(
              execution.id,
              'quality_score',
              execution.output.qualityScore
            );
          }
          
          // End trace
          this.langfuse.endTrace(execution.id, execution.output);
        }
      }),
      catchError((error) => {
        // End trace with error
        if (traceId && environment.langfuse?.enabled) {
          this.langfuse.updateTraceOutput(traceId, { error: error.message });
          this.langfuse.endTrace(traceId, { error: error.message });
        }
        
        // Mock execution
        const execution: WorkflowExecution = {
          id: `exec-${Date.now()}`,
          workflowId: id,
          status: 'failed',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          duration: 0,
          input,
          output: { error: error.message },
          error: error.message
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

  // Compile workflow to target engine
  compileWorkflow(id: string, targetEngine?: WorkflowEngine): Observable<any> {
    return this.getWorkflowById(id).pipe(
      catchError(() => of(null as any)),
      switchMap((workflow: Workflow | null) => {
        if (!workflow) {
          return throwError(() => new Error('Workflow not found'));
        }
        const engine = targetEngine || workflow.engine || 'flowise';
        const apiUrl = this.getApiUrl(engine);
        return this.http.post<any>(`${apiUrl}/workflows/${id}/compile`, { target_engine: engine });
      }),
      catchError(() => of({ message: 'Compilation not available' }))
    );
  }

  // Migrate workflow between engines
  migrateWorkflow(id: string, targetEngine: WorkflowEngine): Observable<any> {
    const apiUrl = this.getApiUrl('langchain'); // Migration endpoint is on langchain backend
    return this.http.post<any>(`${apiUrl}/workflows/${id}/migrate`, { target_engine: targetEngine }).pipe(
      catchError(() => of({ success: false, error: 'Migration failed' }))
    );
  }

  // Execute agent directly
  executeAgent(config: AgentConfig, inputText: string): Observable<any> {
    const apiUrl = this.langchainBackendUrl;
    return this.http.post<any>(`${apiUrl}/agents/execute`, {
      agent_config: config,
      input_text: inputText
    }).pipe(
      catchError(() => of({ output: 'Agent execution failed', error: true }))
    );
  }

  // Execute chain directly
  executeChain(config: ChainConfig, inputData: any, llmConfig?: any): Observable<any> {
    const apiUrl = this.langchainBackendUrl;
    return this.http.post<any>(`${apiUrl}/chains/execute`, {
      chain_config: config,
      input_data: inputData,
      llm_config: llmConfig
    }).pipe(
      catchError(() => of({ output: null, error: 'Chain execution failed', success: false }))
    );
  }

  // Stream execution updates (Server-Sent Events)
  streamExecution(workflowId: string, executionId: string): Observable<any> {
    const apiUrl = this.langchainBackendUrl;
    return new Observable(observer => {
      const eventSource = new EventSource(`${apiUrl}/workflows/${workflowId}/executions/${executionId}/stream`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          observer.next(data);
        } catch (e) {
          observer.error(e);
        }
      };
      
      eventSource.onerror = (error) => {
        observer.error(error);
        eventSource.close();
      };
      
      return () => {
        eventSource.close();
      };
    });
  }

  // Get agent types
  getAgentTypes(): Observable<string[]> {
    const apiUrl = this.langchainBackendUrl;
    return this.http.get<string[]>(`${apiUrl}/agents/types`).pipe(
      catchError(() => of(['react', 'openai-functions']))
    );
  }

  // Get chain types
  getChainTypes(): Observable<string[]> {
    const apiUrl = this.langchainBackendUrl;
    return this.http.get<string[]>(`${apiUrl}/chains/types`).pipe(
      catchError(() => of(['sequential', 'transform']))
    );
  }

  // Get tools for persona
  getToolsForPersona(persona: string): Observable<any[]> {
    const apiUrl = this.langchainBackendUrl;
    return this.http.get<any[]>(`${apiUrl}/agents/tools`, {
      params: { persona }
    }).pipe(
      catchError(() => of([]))
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

