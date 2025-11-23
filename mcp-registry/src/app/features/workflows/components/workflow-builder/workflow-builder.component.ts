import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { WorkflowService } from '../../services/workflow.service';
import { ToolService } from '../../../tools/services/tool.service';
import { 
  Workflow, 
  WorkflowDefinition, 
  WorkflowNode, 
  WorkflowConnection 
} from '../../../../shared/models/workflow.model';
import { Tool } from '../../../../shared/models/tool.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-workflow-builder',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatTabsModule,
    MatChipsModule,
    LoadingSpinnerComponent,
    ErrorDisplayComponent
  ],
  template: `
    <div class="workflow-builder-container">
      <app-loading-spinner *ngIf="loading" message="Loading workflow..."></app-loading-spinner>
      <app-error-display 
        *ngIf="error && !loading" 
        [title]="'Failed to Load Workflow'"
        [message]="error"
        [showRetry]="true"
        (onRetry)="retryLoad()">
      </app-error-display>

      <div *ngIf="!loading && !error" class="builder-content">
        <mat-card>
          <mat-card-header>
            <div class="header-content">
              <div>
                <mat-card-title>{{ isEditMode ? 'Edit Workflow' : 'New Workflow' }}</mat-card-title>
              </div>
              <div class="header-actions">
                <button mat-raised-button color="primary" (click)="saveWorkflow()" [disabled]="!canSave()">
                  <mat-icon>save</mat-icon>
                  Save
                </button>
                <button mat-raised-button (click)="cancel()">
                  Cancel
                </button>
              </div>
            </div>
          </mat-card-header>
          <mat-card-content>
            <mat-tab-group>
              <mat-tab label="Basic Info">
                <div class="tab-content">
                  <mat-form-field class="full-width">
                    <mat-label>Workflow Name</mat-label>
                    <input matInput [(ngModel)]="workflow.name" placeholder="Enter workflow name" required>
                  </mat-form-field>

                  <mat-form-field class="full-width">
                    <mat-label>Description</mat-label>
                    <textarea matInput [(ngModel)]="workflow.description" rows="4" placeholder="Describe what this workflow does"></textarea>
                  </mat-form-field>

                  <mat-form-field>
                    <mat-label>Status</mat-label>
                    <mat-select [(ngModel)]="workflow.status">
                      <mat-option value="draft">Draft</mat-option>
                      <mat-option value="active">Active</mat-option>
                      <mat-option value="archived">Archived</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
              </mat-tab>

              <mat-tab label="Workflow Builder">
                <div class="tab-content">
                  <div class="builder-toolbar">
                    <button mat-raised-button (click)="addNode('input')">
                      <mat-icon>input</mat-icon>
                      Add Input
                    </button>
                    <button mat-raised-button (click)="addNode('mcp-tool')">
                      <mat-icon>build</mat-icon>
                      Add MCP Tool
                    </button>
                    <button mat-raised-button (click)="addNode('llm')">
                      <mat-icon>psychology</mat-icon>
                      Add LLM
                    </button>
                    <button mat-raised-button (click)="addNode('output')">
                      <mat-icon>output</mat-icon>
                      Add Output
                    </button>
                  </div>

                  <div class="workflow-canvas">
                    <div class="canvas-placeholder" *ngIf="definition.nodes.length === 0">
                      <mat-icon>account_tree</mat-icon>
                      <p>Start building your workflow by adding nodes</p>
                      <p class="hint">Use the buttons above to add workflow steps</p>
                    </div>

                    <div class="node-list" *ngIf="definition.nodes.length > 0">
                      <div 
                        *ngFor="let node of definition.nodes" 
                        class="workflow-node"
                        [class.selected]="selectedNode?.id === node.id"
                        (click)="selectNode(node)">
                        <div class="node-header">
                          <mat-icon>{{ getNodeIcon(node.type) }}</mat-icon>
                          <span class="node-label">{{ node.label }}</span>
                          <button mat-icon-button (click)="removeNode(node.id); $event.stopPropagation()">
                            <mat-icon>close</mat-icon>
                          </button>
                        </div>
                        <div class="node-content" *ngIf="selectedNode?.id === node.id">
                          <div *ngIf="node.type === 'mcp-tool'">
                            <mat-form-field class="full-width">
                              <mat-label>MCP Tool</mat-label>
                              <mat-select [(ngModel)]="node.mcpToolId" (selectionChange)="onToolSelected(node, $event.value)">
                                <mat-option *ngFor="let tool of availableTools" [value]="tool.toolId">
                                  {{ tool.name }}
                                </mat-option>
                              </mat-select>
                            </mat-form-field>
                          </div>
                          <div class="node-connections">
                            <p>Connections: {{ getNodeConnections(node.id).length }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </mat-tab>

              <mat-tab label="MCP Tools">
                <div class="tab-content">
                  <h3>Available MCP Tools</h3>
                  <div class="tools-list">
                    <mat-card *ngFor="let tool of availableTools" class="tool-card">
                      <mat-card-content>
                        <div class="tool-card-header">
                          <h4>{{ tool.name }}</h4>
                          <button mat-raised-button color="primary" (click)="addToolToWorkflow(tool)">
                            <mat-icon>add</mat-icon>
                            Add to Workflow
                          </button>
                        </div>
                        <p>{{ tool.description }}</p>
                        <div class="tool-meta">
                          <mat-chip>{{ tool.domain }}</mat-chip>
                          <mat-chip>{{ tool.securityClass }}</mat-chip>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </div>
                </div>
              </mat-tab>
            </mat-tab-group>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .workflow-builder-container {
      padding: 20px;
    }
    .builder-content {
      min-height: 600px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .header-actions {
      display: flex;
      gap: 8px;
    }
    .tab-content {
      padding: 20px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    .builder-toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .workflow-canvas {
      min-height: 400px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 20px;
      background: #fafafa;
    }
    .canvas-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      color: #999;
    }
    .canvas-placeholder mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }
    .canvas-placeholder .hint {
      font-size: 14px;
      margin-top: 8px;
    }
    .node-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .workflow-node {
      background: white;
      border: 2px solid #ddd;
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .workflow-node:hover {
      border-color: #6366f1;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
    }
    .workflow-node.selected {
      border-color: #6366f1;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
    .node-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .node-label {
      flex: 1;
      font-weight: 500;
    }
    .node-content {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #eee;
    }
    .node-connections {
      margin-top: 8px;
      font-size: 12px;
      color: #666;
    }
    .tools-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    .tool-card {
      margin-bottom: 16px;
    }
    .tool-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .tool-card-header h4 {
      margin: 0;
    }
    .tool-meta {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
  `]
})
export class WorkflowBuilderComponent implements OnInit {
  workflow: Partial<Workflow> = {
    name: '',
    description: '',
    status: 'draft',
    mcpTools: []
  };
  definition: WorkflowDefinition = {
    nodes: [],
    connections: [],
    viewport: { x: 0, y: 0, zoom: 1 }
  };
  availableTools: Tool[] = [];
  selectedNode: WorkflowNode | null = null;
  loading: boolean = false;
  error: string | null = null;
  isEditMode: boolean = false;
  workflowId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workflowService: WorkflowService,
    private toolService: ToolService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.workflowId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.workflowId;

    if (this.isEditMode && this.workflowId) {
      this.loadWorkflow(this.workflowId);
    }

    // Check for toolId query parameter (when creating workflow from tool detail)
    const toolId = this.route.snapshot.queryParamMap.get('toolId');
    if (toolId && !this.isEditMode) {
      // Pre-add the tool to the workflow
      this.toolService.getToolById(toolId).subscribe({
        next: (tool) => {
          this.addToolToWorkflow(tool);
        },
        error: (err) => {
          console.error('Error loading tool:', err);
        }
      });
    }

    this.loadAvailableTools();
  }

  loadWorkflow(id: string): void {
    this.loading = true;
    this.error = null;
    
    this.workflowService.getWorkflowById(id).subscribe({
      next: (workflow) => {
        this.workflow = workflow;
        this.loadWorkflowDefinition(id);
      },
      error: (err) => {
        console.error('Error loading workflow:', err);
        this.error = err.message || 'Failed to load workflow';
        this.loading = false;
      }
    });
  }

  loadWorkflowDefinition(id: string): void {
    this.workflowService.getWorkflowDefinition(id).subscribe({
      next: (definition) => {
        this.definition = definition;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading workflow definition:', err);
        this.loading = false;
      }
    });
  }

  loadAvailableTools(): void {
    this.toolService.getTools({ limit: 100 }).subscribe({
      next: (response) => {
        this.availableTools = response.tools;
      },
      error: (err) => {
        console.error('Error loading tools:', err);
      }
    });
  }

  retryLoad(): void {
    if (this.workflowId) {
      this.loadWorkflow(this.workflowId);
    }
  }

  addNode(type: string): void {
    const nodeId = `node-${Date.now()}`;
    const node: WorkflowNode = {
      id: nodeId,
      type,
      label: this.getNodeLabel(type),
      position: {
        x: Math.random() * 300 + 50,
        y: Math.random() * 200 + 50
      },
      data: {}
    };
    this.definition.nodes.push(node);
    this.selectedNode = node;
  }

  removeNode(nodeId: string): void {
    this.definition.nodes = this.definition.nodes.filter(n => n.id !== nodeId);
    this.definition.connections = this.definition.connections.filter(
      c => c.source !== nodeId && c.target !== nodeId
    );
    if (this.selectedNode?.id === nodeId) {
      this.selectedNode = null;
    }
  }

  selectNode(node: WorkflowNode): void {
    this.selectedNode = this.selectedNode?.id === node.id ? null : node;
  }

  getNodeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'input': 'input',
      'output': 'output',
      'mcp-tool': 'build',
      'llm': 'psychology',
      'condition': 'code',
      'transform': 'transform'
    };
    return icons[type] || 'circle';
  }

  getNodeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'input': 'Input',
      'output': 'Output',
      'mcp-tool': 'MCP Tool',
      'llm': 'LLM',
      'condition': 'Condition',
      'transform': 'Transform'
    };
    return labels[type] || 'Node';
  }

  getNodeConnections(nodeId: string): WorkflowConnection[] {
    return this.definition.connections.filter(
      c => c.source === nodeId || c.target === nodeId
    );
  }

  onToolSelected(node: WorkflowNode, toolId: string): void {
    node.mcpToolId = toolId;
    if (!this.workflow.mcpTools) {
      this.workflow.mcpTools = [];
    }
    if (!this.workflow.mcpTools.includes(toolId)) {
      this.workflow.mcpTools.push(toolId);
    }
  }

  addToolToWorkflow(tool: Tool): void {
    // Add a new MCP tool node
    this.addNode('mcp-tool');
    if (this.selectedNode) {
      this.selectedNode.mcpToolId = tool.toolId;
      this.selectedNode.label = tool.name;
      if (!this.workflow.mcpTools) {
        this.workflow.mcpTools = [];
      }
      if (!this.workflow.mcpTools.includes(tool.toolId)) {
        this.workflow.mcpTools.push(tool.toolId);
      }
    }
  }

  canSave(): boolean {
    return !!(this.workflow.name && this.workflow.name.trim());
  }

  saveWorkflow(): void {
    if (!this.canSave()) {
      this.toastService.error('Please provide a workflow name');
      return;
    }

    if (this.isEditMode && this.workflowId) {
      // Update existing workflow
      this.workflowService.updateWorkflow(this.workflowId, this.workflow).subscribe({
        next: () => {
          this.workflowService.updateWorkflowDefinition(this.workflowId!, this.definition).subscribe({
            next: () => {
              this.toastService.success('Workflow updated successfully');
              this.router.navigate(['/workflows', this.workflowId]);
            },
            error: (err) => {
              this.toastService.error(err.message || 'Failed to update workflow definition');
            }
          });
        },
        error: (err) => {
          this.toastService.error(err.message || 'Failed to update workflow');
        }
      });
    } else {
      // Create new workflow
      this.workflowService.createWorkflow(this.workflow).subscribe({
        next: (created) => {
          this.workflowService.updateWorkflowDefinition(created.id, this.definition).subscribe({
            next: () => {
              this.toastService.success('Workflow created successfully');
              this.router.navigate(['/workflows', created.id]);
            },
            error: (err) => {
              this.toastService.error(err.message || 'Failed to save workflow definition');
            }
          });
        },
        error: (err) => {
          this.toastService.error(err.message || 'Failed to create workflow');
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/workflows']);
  }
}

