import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { WorkflowService, WorkflowSearchParams } from '../../services/workflow.service';
import { Workflow } from '../../../../shared/models/workflow.model';
import { LifecycleStateComponent } from '../../../../shared/components/lifecycle-state/lifecycle-state.component';
import { QualityScoreComponent } from '../../../../shared/components/quality-score/quality-score.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-workflow-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatMenuModule,
    LifecycleStateComponent,
    QualityScoreComponent,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
    EmptyStateComponent,
    StatusBadgeComponent
  ],
  template: `
    <div class="workflow-list-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>AI Workflows</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <app-loading-spinner *ngIf="loading" message="Loading workflows..."></app-loading-spinner>
          <app-error-display 
            *ngIf="error && !loading" 
            [title]="'Failed to Load Workflows'"
            [message]="error"
            [showRetry]="true"
            (onRetry)="retryLoad()">
          </app-error-display>

          <div *ngIf="!loading && !error">
          <div class="filters">
            <mat-form-field>
              <mat-label>Search</mat-label>
              <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" placeholder="Search workflows...">
            </mat-form-field>
            
            <mat-form-field>
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="filters.status" (selectionChange)="loadWorkflows()">
                <mat-option value="">All</mat-option>
                <mat-option value="active">Active</mat-option>
                <mat-option value="draft">Draft</mat-option>
                <mat-option value="archived">Archived</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-raised-button color="primary" routerLink="/workflows/new">
              <mat-icon>add</mat-icon>
              New Workflow
            </button>
          </div>

          <table mat-table [dataSource]="workflows" class="workflows-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let workflow">
                <a [routerLink]="['/workflows', workflow.id]">{{ workflow.name }}</a>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let workflow">
                <app-status-badge [status]="workflow.status"></app-status-badge>
              </td>
            </ng-container>

            <ng-container matColumnDef="lifecycleState">
              <th mat-header-cell *matHeaderCellDef>Lifecycle</th>
              <td mat-cell *matCellDef="let workflow">
                <app-lifecycle-state [state]="workflow.lifecycleState || 'development'"></app-lifecycle-state>
              </td>
            </ng-container>

            <ng-container matColumnDef="qualityScore">
              <th mat-header-cell *matHeaderCellDef>Quality</th>
              <td mat-cell *matCellDef="let workflow">
                <app-quality-score [score]="workflow.qualityScore || 0"></app-quality-score>
              </td>
            </ng-container>

            <ng-container matColumnDef="mcpTools">
              <th mat-header-cell *matHeaderCellDef>MCP Tools</th>
              <td mat-cell *matCellDef="let workflow">
                <mat-chip *ngFor="let toolId of workflow.mcpTools?.slice(0, 2)">
                  {{ toolId }}
                </mat-chip>
                <span *ngIf="(workflow.mcpTools?.length || 0) > 2">
                  +{{ (workflow.mcpTools?.length || 0) - 2 }} more
                </span>
                <span *ngIf="!workflow.mcpTools || workflow.mcpTools.length === 0">None</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="executionCount">
              <th mat-header-cell *matHeaderCellDef>Executions</th>
              <td mat-cell *matCellDef="let workflow">
                {{ workflow.executionCount || 0 }}
              </td>
            </ng-container>

            <ng-container matColumnDef="lastExecuted">
              <th mat-header-cell *matHeaderCellDef>Last Executed</th>
              <td mat-cell *matCellDef="let workflow">
                {{ workflow.lastExecuted ? (workflow.lastExecuted | date:'short') : 'Never' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let workflow">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item [routerLink]="['/workflows', workflow.id]">
                    <mat-icon>visibility</mat-icon>
                    <span>View</span>
                  </button>
                  <button mat-menu-item [routerLink]="['/workflows', workflow.id, 'edit']">
                    <mat-icon>edit</mat-icon>
                    <span>Edit</span>
                  </button>
                  <button mat-menu-item (click)="duplicateWorkflow(workflow.id)">
                    <mat-icon>content_copy</mat-icon>
                    <span>Duplicate</span>
                  </button>
                  <button mat-menu-item (click)="deleteWorkflow(workflow.id, workflow.name)">
                    <mat-icon>delete</mat-icon>
                    <span>Delete</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>

          <mat-paginator
            *ngIf="workflows.length > 0"
            [length]="total"
            [pageSize]="pageSize"
            [pageIndex]="pageIndex"
            [pageSizeOptions]="[10, 25, 50, 100]"
            (page)="onPageChange($event)">
          </mat-paginator>

          <app-empty-state
            *ngIf="!loading && !error && workflows.length === 0"
            icon="account_tree"
            title="No Workflows Found"
            message="No workflows match your search criteria. Create your first workflow to get started."
            actionLabel="Create Workflow"
            (onAction)="createNewWorkflow()">
          </app-empty-state>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .workflow-list-container {
      padding: 0;
    }
    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      align-items: flex-end;
    }
    .filters mat-form-field {
      flex: 1;
      min-width: 200px;
    }
    .workflows-table {
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
    }
    .workflows-table a {
      color: #6366f1;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
    }
    .workflows-table a:hover {
      color: #8b5cf6;
      text-decoration: underline;
    }
  `]
})
export class WorkflowListComponent implements OnInit {
  workflows: Workflow[] = [];
  total = 0;
  pageSize = 25;
  pageIndex = 0;
  searchQuery = '';
  filters: WorkflowSearchParams = {};
  loading: boolean = false;
  error: string | null = null;

  displayedColumns: string[] = [
    'name',
    'status',
    'lifecycleState',
    'qualityScore',
    'mcpTools',
    'executionCount',
    'lastExecuted',
    'actions'
  ];

  constructor(private workflowService: WorkflowService) {}

  ngOnInit(): void {
    this.loadWorkflows();
  }

  loadWorkflows(): void {
    this.loading = true;
    this.error = null;
    const params: WorkflowSearchParams = {
      ...this.filters,
      page: this.pageIndex,
      limit: this.pageSize
    };
    if (this.searchQuery) {
      params.q = this.searchQuery;
    }

    this.workflowService.getWorkflows(params).subscribe({
      next: (response) => {
        this.workflows = response.workflows;
        this.total = response.total;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading workflows:', err);
        this.error = err.message || 'Failed to load workflows';
        this.loading = false;
      }
    });
  }

  retryLoad(): void {
    this.loadWorkflows();
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.loadWorkflows();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadWorkflows();
  }

  createNewWorkflow(): void {
    // Navigation handled by routerLink in template
  }

  duplicateWorkflow(id: string): void {
    this.workflowService.duplicateWorkflow(id).subscribe({
      next: () => {
        this.loadWorkflows();
      },
      error: (err) => {
        console.error('Error duplicating workflow:', err);
      }
    });
  }

  deleteWorkflow(id: string, name: string): void {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      this.workflowService.deleteWorkflow(id).subscribe({
        next: () => {
          this.loadWorkflows();
        },
        error: (err) => {
          console.error('Error deleting workflow:', err);
        }
      });
    }
  }
}

