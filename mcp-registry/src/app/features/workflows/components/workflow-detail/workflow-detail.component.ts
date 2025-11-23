import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { DatePipe } from '@angular/common';
import { WorkflowService } from '../../services/workflow.service';
import { Workflow, WorkflowExecution, WorkflowDefinition } from '../../../../shared/models/workflow.model';
import { LifecycleStateComponent } from '../../../../shared/components/lifecycle-state/lifecycle-state.component';
import { QualityScoreComponent } from '../../../../shared/components/quality-score/quality-score.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { MatDialog } from '@angular/material/dialog';
import { ExecutionDetailComponent } from '../execution-detail/execution-detail.component';
import { WorkflowCanvasComponent } from '../workflow-builder/workflow-canvas.component';

@Component({
  selector: 'app-workflow-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatTableModule,
    LifecycleStateComponent,
    QualityScoreComponent,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
    StatusBadgeComponent,
    DatePipe,
    WorkflowCanvasComponent
  ],
  template: `
    <div class="workflow-detail-container">
      <app-loading-spinner *ngIf="loading" message="Loading workflow..."></app-loading-spinner>
      <app-error-display 
        *ngIf="error && !loading" 
        [title]="'Failed to Load Workflow'"
        [message]="error"
        [showRetry]="true"
        (onRetry)="retryLoad()">
      </app-error-display>
      
      <div *ngIf="workflow && !loading">
      <mat-card>
        <mat-card-header>
          <div class="header-content">
            <div>
              <mat-card-title>{{ workflow.name }}</mat-card-title>
              <mat-card-subtitle>{{ workflow.id }}</mat-card-subtitle>
            </div>
          </div>
        </mat-card-header>
        <mat-card-content>
          <div class="workflow-header">
            <div class="workflow-meta">
              <app-status-badge [status]="workflow.status"></app-status-badge>
              <app-lifecycle-state [state]="workflow.lifecycleState || 'development'"></app-lifecycle-state>
              <app-quality-score [score]="workflow.qualityScore || 0"></app-quality-score>
            </div>
            <div class="workflow-actions">
              <button mat-raised-button color="primary" [routerLink]="['/workflows', workflow.id, 'edit']">
                <mat-icon>edit</mat-icon>
                Edit
              </button>
              <button mat-raised-button color="accent" (click)="executeWorkflow()" [disabled]="workflow.status !== 'active'">
                <mat-icon>play_arrow</mat-icon>
                Execute
              </button>
              <button mat-raised-button color="warn" (click)="deleteWorkflow()">
                <mat-icon>delete</mat-icon>
                Delete
              </button>
            </div>
          </div>

          <mat-tab-group>
            <mat-tab label="Overview">
              <div class="tab-content">
                <h3>Description</h3>
                <p>{{ workflow.description || 'No description provided' }}</p>

                <h3>MCP Tools Used</h3>
                <div *ngIf="workflow.mcpTools && workflow.mcpTools.length > 0" class="mcp-tools">
                  <mat-list>
                    <mat-list-item *ngFor="let toolId of workflow.mcpTools">
                      <a [routerLink]="['/tools', toolId]">{{ toolId }}</a>
                    </mat-list-item>
                  </mat-list>
                </div>
                <p *ngIf="!workflow.mcpTools || workflow.mcpTools.length === 0">
                  No MCP tools configured in this workflow
                </p>

                <h3>Execution Statistics</h3>
                <div class="execution-stats">
                  <mat-list>
                    <mat-list-item>
                      <span matListItemTitle>Total Executions</span>
                      <span matListItemLine>{{ workflow.executionCount || 0 }}</span>
                    </mat-list-item>
                    <mat-list-item>
                      <span matListItemTitle>Success Rate</span>
                      <span matListItemLine>{{ ((workflow.successRate || 0) * 100).toFixed(2) }}%</span>
                    </mat-list-item>
                    <mat-list-item>
                      <span matListItemTitle>Average Execution Time</span>
                      <span matListItemLine>{{ workflow.avgExecutionTime || 0 }}ms</span>
                    </mat-list-item>
                    <mat-list-item>
                      <span matListItemTitle>Last Executed</span>
                      <span matListItemLine>{{ workflow.lastExecuted ? (workflow.lastExecuted | date:'short') : 'Never' }}</span>
                    </mat-list-item>
                  </mat-list>
                </div>

                <h3>Metadata</h3>
                <mat-list>
                  <mat-list-item>
                    <span matListItemTitle>Created</span>
                    <span matListItemLine>{{ workflow.createdAt | date:'short' }}</span>
                  </mat-list-item>
                  <mat-list-item>
                    <span matListItemTitle>Last Updated</span>
                    <span matListItemLine>{{ workflow.updatedAt | date:'short' }}</span>
                  </mat-list-item>
                  <mat-list-item *ngIf="workflow.createdBy">
                    <span matListItemTitle>Created By</span>
                    <span matListItemLine>{{ workflow.createdBy }}</span>
                  </mat-list-item>
                  <mat-list-item *ngIf="workflow.tags && workflow.tags.length > 0">
                    <span matListItemTitle>Tags</span>
                    <span matListItemLine>
                      <mat-chip *ngFor="let tag of workflow.tags">{{ tag }}</mat-chip>
                    </span>
                  </mat-list-item>
                </mat-list>
              </div>
            </mat-tab>

            <mat-tab label="Execution History">
              <div class="tab-content">
                <h3>Recent Executions</h3>
                <table mat-table [dataSource]="executions" *ngIf="executions.length > 0">
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let execution">
                      <app-status-badge [status]="execution.status"></app-status-badge>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="startedAt">
                    <th mat-header-cell *matHeaderCellDef>Started</th>
                    <td mat-cell *matCellDef="let execution">
                      {{ execution.startedAt | date:'short' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="duration">
                    <th mat-header-cell *matHeaderCellDef>Duration</th>
                    <td mat-cell *matCellDef="let execution">
                      {{ execution.duration ? execution.duration + 'ms' : 'N/A' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let execution">
                      <button mat-icon-button (click)="viewExecution(execution.id)">
                        <mat-icon>visibility</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="executionColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: executionColumns"></tr>
                </table>
                <p *ngIf="executions.length === 0">No execution history available</p>
              </div>
            </mat-tab>

            <mat-tab label="Workflow Graph">
              <div class="tab-content">
                <h3>Workflow Visualization</h3>
                <div *ngIf="workflowDefinition && workflowDefinition.nodes.length > 0" class="workflow-graph-container">
                  <app-workflow-canvas
                    [nodes]="workflowDefinition.nodes"
                    [connections]="workflowDefinition.connections"
                    [selectedNodeId]="null"
                    (nodeSelected)="onGraphNodeSelected($event)">
                  </app-workflow-canvas>
                </div>
                <div *ngIf="!workflowDefinition || workflowDefinition.nodes.length === 0" class="workflow-graph-placeholder">
                  <p>No workflow definition available</p>
                  <p class="hint">Edit the workflow to create a visual representation</p>
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
    .workflow-detail-container {
      padding: 20px;
    }
    .workflow-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .workflow-meta {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .workflow-actions {
      display: flex;
      gap: 8px;
    }
    .tab-content {
      padding: 20px;
    }
    .tab-content h3 {
      margin-top: 20px;
      margin-bottom: 10px;
    }
    .mcp-tools mat-list-item a {
      color: #6366f1;
      text-decoration: none;
    }
    .mcp-tools mat-list-item a:hover {
      text-decoration: underline;
    }
    .execution-stats {
      margin-bottom: 16px;
    }
    .workflow-graph-container {
      margin-top: 16px;
    }
    .workflow-graph-placeholder {
      padding: 40px;
      text-align: center;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .workflow-graph-placeholder .hint {
      color: #666;
      font-size: 14px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
    }
  `]
})
export class WorkflowDetailComponent implements OnInit {
  workflow: Workflow | null = null;
  executions: WorkflowExecution[] = [];
  workflowDefinition: WorkflowDefinition | null = null;
  loading: boolean = false;
  error: string | null = null;

  executionColumns: string[] = ['status', 'startedAt', 'duration', 'actions'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workflowService: WorkflowService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadWorkflow(id);
      this.loadExecutionHistory(id);
    }
  }

  loadWorkflow(id: string): void {
    this.loading = true;
    this.error = null;
    this.workflowService.getWorkflowById(id).subscribe({
      next: (workflow) => {
        this.workflow = workflow;
        this.loadWorkflowDefinition(id);
        this.loading = false;
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
        this.workflowDefinition = definition;
      },
      error: (err) => {
        console.error('Error loading workflow definition:', err);
      }
    });
  }

  loadExecutionHistory(id: string): void {
    this.workflowService.getExecutionHistory(id, 10).subscribe({
      next: (executions) => {
        this.executions = executions;
      },
      error: (err) => {
        console.error('Error loading execution history:', err);
      }
    });
  }

  retryLoad(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadWorkflow(id);
    }
  }

  executeWorkflow(): void {
    if (!this.workflow) return;
    this.workflowService.executeWorkflow(this.workflow.id).subscribe({
      next: (execution) => {
        this.toastService.success('Workflow execution started');
        this.loadExecutionHistory(this.workflow!.id);
      },
      error: (err) => {
        this.toastService.error(err.message || 'Failed to execute workflow');
      }
    });
  }

  deleteWorkflow(): void {
    if (!this.workflow) return;
    this.confirmationService.confirmDelete(this.workflow.name).subscribe(confirmed => {
      if (confirmed) {
        this.workflowService.deleteWorkflow(this.workflow!.id).subscribe({
          next: () => {
            this.toastService.success(`Workflow "${this.workflow!.name}" deleted successfully`);
            this.router.navigate(['/workflows']);
          },
          error: (err) => {
            this.toastService.error(err.message || 'Failed to delete workflow');
          }
        });
      }
    });
  }

  viewExecution(executionId: string): void {
    if (!this.workflow) return;
    // Load execution details
    this.workflowService.getExecution(this.workflow.id, executionId).subscribe({
      next: (execution) => {
        this.dialog.open(ExecutionDetailComponent, {
          width: '900px',
          maxWidth: '90vw',
          data: { execution }
        });
      },
      error: (err) => {
        console.error('Error loading execution:', err);
        this.toastService.error('Failed to load execution details');
      }
    });
  }

  onGraphNodeSelected(node: any): void {
    // Handle node selection in read-only graph view
    // Could show node details in a side panel
  }
}

