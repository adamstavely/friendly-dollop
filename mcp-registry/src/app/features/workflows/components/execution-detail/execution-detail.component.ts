import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { WorkflowExecution, ExecutionLog } from '../../../../shared/models/workflow.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-execution-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatTabsModule,
    MatListModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    StatusBadgeComponent,
    DatePipe
  ],
  template: `
    <div class="execution-detail-dialog">
      <h2 mat-dialog-title>Execution Details</h2>
      <mat-dialog-content>
        <div *ngIf="execution">
          <mat-card>
            <mat-card-header>
              <div class="header-content">
                <div>
                  <mat-card-title>Execution {{ execution.id }}</mat-card-title>
                  <mat-card-subtitle>
                    Started: {{ execution.startedAt | date:'short' }}
                  </mat-card-subtitle>
                </div>
                <app-status-badge [status]="execution.status"></app-status-badge>
              </div>
            </mat-card-header>
            <mat-card-content>
              <mat-tab-group>
                <mat-tab label="Overview">
                  <div class="tab-content">
                    <mat-list>
                      <mat-list-item>
                        <span matListItemTitle>Status</span>
                        <span matListItemLine>
                          <app-status-badge [status]="execution.status"></app-status-badge>
                        </span>
                      </mat-list-item>
                      <mat-list-item>
                        <span matListItemTitle>Started At</span>
                        <span matListItemLine>{{ execution.startedAt | date:'medium' }}</span>
                      </mat-list-item>
                      <mat-list-item *ngIf="execution.completedAt">
                        <span matListItemTitle>Completed At</span>
                        <span matListItemLine>{{ execution.completedAt | date:'medium' }}</span>
                      </mat-list-item>
                      <mat-list-item *ngIf="execution.duration">
                        <span matListItemTitle>Duration</span>
                        <span matListItemLine>{{ execution.duration }}ms</span>
                      </mat-list-item>
                      <mat-list-item *ngIf="execution.error">
                        <span matListItemTitle>Error</span>
                        <span matListItemLine class="error-text">{{ execution.error }}</span>
                      </mat-list-item>
                    </mat-list>
                  </div>
                </mat-tab>

                <mat-tab label="Input">
                  <div class="tab-content">
                    <pre *ngIf="execution.input" class="json-view">{{ formatJson(execution.input) }}</pre>
                    <p *ngIf="!execution.input">No input data</p>
                  </div>
                </mat-tab>

                <mat-tab label="Output">
                  <div class="tab-content">
                    <pre *ngIf="execution.output" class="json-view">{{ formatJson(execution.output) }}</pre>
                    <p *ngIf="!execution.output">No output data</p>
                  </div>
                </mat-tab>

                <mat-tab label="Logs">
                  <div class="tab-content">
                    <div *ngIf="execution.logs && execution.logs.length > 0" class="logs-container">
                      <div *ngFor="let log of execution.logs" class="log-entry" [class]="'log-' + log.level">
                        <div class="log-header">
                          <span class="log-timestamp">{{ log.timestamp | date:'medium' }}</span>
                          <mat-chip [class]="'log-level-' + log.level">{{ log.level }}</mat-chip>
                          <span *ngIf="log.nodeId" class="log-node">Node: {{ log.nodeId }}</span>
                        </div>
                        <div class="log-message">{{ log.message }}</div>
                      </div>
                    </div>
                    <p *ngIf="!execution.logs || execution.logs.length === 0">No logs available</p>
                  </div>
                </mat-tab>
              </mat-tab-group>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button mat-button (click)="close()">Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .execution-detail-dialog {
      min-width: 600px;
      max-width: 900px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .tab-content {
      padding: 20px;
    }
    .json-view {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }
    .error-text {
      color: #ef4444;
      font-weight: 500;
    }
    .logs-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .log-entry {
      padding: 12px;
      border-radius: 4px;
      border-left: 4px solid #ddd;
    }
    .log-entry.log-info {
      background: #eff6ff;
      border-left-color: #3b82f6;
    }
    .log-entry.log-warn {
      background: #fffbeb;
      border-left-color: #f59e0b;
    }
    .log-entry.log-error {
      background: #fef2f2;
      border-left-color: #ef4444;
    }
    .log-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .log-timestamp {
      font-size: 12px;
      color: #666;
    }
    .log-node {
      font-size: 12px;
      color: #6366f1;
      font-weight: 500;
    }
    .log-message {
      font-size: 14px;
      color: #1f2937;
    }
    .log-level-info {
      background: #3b82f6;
      color: white;
    }
    .log-level-warn {
      background: #f59e0b;
      color: white;
    }
    .log-level-error {
      background: #ef4444;
      color: white;
    }
  `]
})
export class ExecutionDetailComponent {
  execution: WorkflowExecution;

  constructor(
    public dialogRef: MatDialogRef<ExecutionDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { execution: WorkflowExecution }
  ) {
    this.execution = data.execution;
  }

  formatJson(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  close(): void {
    this.dialogRef.close();
  }
}


