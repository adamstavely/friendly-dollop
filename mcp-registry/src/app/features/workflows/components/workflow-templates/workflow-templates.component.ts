import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { WorkflowService } from '../../services/workflow.service';
import { WorkflowTemplate } from '../../../../shared/models/workflow.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ToastService } from '../../../../core/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-workflow-templates',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatInputModule,
    FormsModule,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="templates-container">
      <mat-card>
        <mat-card-header>
          <div class="header-content">
            <div>
              <mat-card-title>Workflow Templates</mat-card-title>
              <mat-card-subtitle>Start from a template to quickly create workflows</mat-card-subtitle>
            </div>
            <button mat-raised-button color="primary" routerLink="/workflows/new">
              <mat-icon>add</mat-icon>
              Create from Scratch
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>
          <div class="search-bar">
            <mat-form-field>
              <mat-label>Search Templates</mat-label>
              <input matInput [(ngModel)]="searchQuery" (ngModelChange)="filterTemplates()" placeholder="Search by name or category...">
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>
          </div>

          <app-loading-spinner *ngIf="loading" message="Loading templates..."></app-loading-spinner>
          <app-error-display 
            *ngIf="error && !loading" 
            [title]="'Failed to Load Templates'"
            [message]="error"
            [showRetry]="true"
            (onRetry)="loadTemplates()">
          </app-error-display>

          <div *ngIf="!loading && !error" class="templates-grid">
            <mat-card *ngFor="let template of filteredTemplates" class="template-card">
              <mat-card-header>
                <mat-card-title>{{ template.name }}</mat-card-title>
                <mat-card-subtitle *ngIf="template.category">{{ template.category }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p *ngIf="template.description">{{ template.description }}</p>
                <div class="template-meta">
                  <mat-chip *ngIf="template.mcpTools && template.mcpTools.length > 0">
                    {{ template.mcpTools.length }} MCP Tool(s)
                  </mat-chip>
                  <span class="node-count">
                    {{ (template.definition && template.definition.nodes) ? template.definition.nodes.length : 0 }} nodes
                  </span>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button color="primary" (click)="useTemplate(template)">
                  <mat-icon>play_arrow</mat-icon>
                  Use Template
                </button>
              </mat-card-actions>
            </mat-card>
          </div>

          <app-empty-state
            *ngIf="!loading && !error && filteredTemplates.length === 0"
            icon="description"
            title="No Templates Found"
            message="No templates match your search criteria.">
          </app-empty-state>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .templates-container {
      padding: 20px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .search-bar {
      margin-bottom: 24px;
    }
    .search-bar mat-form-field {
      width: 100%;
      max-width: 400px;
    }
    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    .template-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .template-card mat-card-content {
      flex: 1;
    }
    .template-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
    }
    .node-count {
      font-size: 12px;
      color: #666;
    }
  `]
})
export class WorkflowTemplatesComponent implements OnInit {
  templates: WorkflowTemplate[] = [];
  filteredTemplates: WorkflowTemplate[] = [];
  searchQuery = '';
  loading = false;
  error: string | null = null;

  constructor(
    private workflowService: WorkflowService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading = true;
    this.error = null;
    this.workflowService.getTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
        this.filteredTemplates = templates;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading templates:', err);
        this.error = err.message || 'Failed to load templates';
        this.loading = false;
      }
    });
  }

  filterTemplates(): void {
    if (!this.searchQuery.trim()) {
      this.filteredTemplates = this.templates;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredTemplates = this.templates.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.category?.toLowerCase().includes(query)
    );
  }

  useTemplate(template: WorkflowTemplate): void {
    // Create a new workflow from template
    const workflow = {
      name: `${template.name} (Copy)`,
      description: template.description,
      status: 'draft' as const,
      mcpTools: template.mcpTools || []
    };

    this.workflowService.createWorkflow(workflow).subscribe({
      next: (created) => {
        // Update workflow definition with template definition
        if (template.definition) {
          this.workflowService.updateWorkflowDefinition(created.id, template.definition).subscribe({
            next: () => {
              this.toastService.success('Workflow created from template');
              this.router.navigate(['/workflows', created.id, 'edit']);
            },
            error: (err) => {
              console.error('Error updating workflow definition:', err);
              this.toastService.error('Failed to apply template definition');
            }
          });
        } else {
          this.toastService.success('Workflow created from template');
          this.router.navigate(['/workflows', created.id, 'edit']);
        }
      },
      error: (err) => {
        console.error('Error creating workflow from template:', err);
        this.toastService.error('Failed to create workflow from template');
      }
    });
  }
}

