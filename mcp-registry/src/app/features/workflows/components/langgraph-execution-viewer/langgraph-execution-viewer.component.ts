import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { WorkflowExecution } from '../../../../shared/models/workflow.model';
import { WorkflowService } from '../../services/workflow.service';
import { Subscription } from 'rxjs';

interface ExecutionStep {
  nodeId: string;
  timestamp: string;
  state: any;
  output?: any;
  error?: string;
}

@Component({
  selector: 'app-langgraph-execution-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatExpansionModule,
    MatChipsModule,
    MatProgressBarModule
  ],
  template: `
    <div class="langgraph-execution-viewer">
      <mat-tab-group>
        <mat-tab label="Execution Timeline">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Execution Timeline</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="timeline">
                  <div *ngFor="let step of executionSteps; let i = index" class="timeline-item">
                    <div class="timeline-marker" [class.completed]="step.output" [class.error]="step.error">
                      <mat-icon>{{ step.error ? 'error' : (step.output ? 'check_circle' : 'radio_button_unchecked') }}</mat-icon>
                    </div>
                    <div class="timeline-content">
                      <div class="step-header">
                        <h4>{{ step.nodeId }}</h4>
                        <span class="timestamp">{{ step.timestamp | date:'short' }}</span>
                      </div>
                      <div *ngIf="step.output" class="step-output">
                        <strong>Output:</strong>
                        <pre>{{ formatOutput(step.output) }}</pre>
                      </div>
                      <div *ngIf="step.error" class="step-error">
                        <mat-icon color="warn">error</mat-icon>
                        <span>{{ step.error }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="State Visualization">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>State at Each Step</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="state-list">
                  <mat-expansion-panel *ngFor="let step of executionSteps">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon>code</mat-icon>
                        {{ step.nodeId }}
                      </mat-panel-title>
                      <mat-panel-description>
                        {{ step.timestamp | date:'short' }}
                      </mat-panel-description>
                    </mat-expansion-panel-header>
                    <div class="state-content">
                      <pre>{{ formatState(step.state) }}</pre>
                    </div>
                  </mat-expansion-panel>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="State Diff">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>State Changes</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="state-diff-list">
                  <div *ngFor="let diff of stateDiffs; let i = index" class="diff-item">
                    <h4>Step {{ i + 1 }}: {{ diff.nodeId }}</h4>
                    <div class="diff-content">
                      <div class="diff-added" *ngIf="diff.added && diff.added.length > 0">
                        <strong>Added/Changed:</strong>
                        <ul>
                          <li *ngFor="let item of diff.added">{{ item }}</li>
                        </ul>
                      </div>
                      <div class="diff-removed" *ngIf="diff.removed && diff.removed.length > 0">
                        <strong>Removed:</strong>
                        <ul>
                          <li *ngFor="let item of diff.removed">{{ item }}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Execution Tree">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Execution Tree</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="execution-tree">
                  <div class="tree-node root">
                    <mat-icon>play_circle</mat-icon>
                    <span>Execution Start</span>
                  </div>
                  <div *ngFor="let step of executionSteps" class="tree-node">
                    <mat-icon>{{ getNodeIcon(step.nodeId) }}</mat-icon>
                    <span>{{ step.nodeId }}</span>
                    <mat-chip *ngIf="step.error" color="warn">Error</mat-chip>
                    <mat-chip *ngIf="step.output && !step.error" color="primary">Success</mat-chip>
                  </div>
                  <div class="tree-node end">
                    <mat-icon>{{ execution.status === 'completed' ? 'check_circle' : 'error' }}</mat-icon>
                    <span>Execution {{ execution.status }}</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .langgraph-execution-viewer {
      padding: 20px;
    }
    .tab-content {
      padding: 20px;
    }
    .timeline {
      position: relative;
      padding-left: 40px;
    }
    .timeline-item {
      display: flex;
      margin-bottom: 24px;
      position: relative;
    }
    .timeline-item:not(:last-child)::before {
      content: '';
      position: absolute;
      left: 19px;
      top: 32px;
      width: 2px;
      height: calc(100% + 8px);
      background-color: #ddd;
    }
    .timeline-marker {
      position: absolute;
      left: -40px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #ddd;
    }
    .timeline-marker.completed {
      background-color: #4caf50;
      border-color: #4caf50;
      color: white;
    }
    .timeline-marker.error {
      background-color: #f44336;
      border-color: #f44336;
      color: white;
    }
    .timeline-content {
      flex: 1;
      padding: 12px;
      background-color: #f9f9f9;
      border-radius: 4px;
    }
    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .step-header h4 {
      margin: 0;
    }
    .timestamp {
      font-size: 12px;
      color: #666;
    }
    .step-output pre {
      background-color: #f5f5f5;
      padding: 8px;
      border-radius: 4px;
      margin-top: 8px;
      font-size: 12px;
      overflow-x: auto;
    }
    .step-error {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      margin-top: 8px;
    }
    .state-list {
      margin-top: 16px;
    }
    .state-content pre {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
    }
    .state-diff-list {
      margin-top: 16px;
    }
    .diff-item {
      margin-bottom: 24px;
      padding: 16px;
      background-color: #f9f9f9;
      border-radius: 4px;
    }
    .diff-content {
      margin-top: 12px;
    }
    .diff-added {
      color: #4caf50;
      margin-bottom: 8px;
    }
    .diff-removed {
      color: #f44336;
    }
    .execution-tree {
      margin-top: 16px;
    }
    .tree-node {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      margin: 8px 0;
      background-color: #f5f5f5;
      border-radius: 4px;
      border-left: 4px solid #2196f3;
    }
    .tree-node.root {
      background-color: #e3f2fd;
      border-left-color: #2196f3;
    }
    .tree-node.end {
      background-color: #e8f5e9;
      border-left-color: #4caf50;
    }
  `]
})
export class LanggraphExecutionViewerComponent implements OnInit, OnDestroy {
  @Input() execution!: WorkflowExecution;
  @Input() workflowId!: string;

  executionSteps: ExecutionStep[] = [];
  stateDiffs: Array<{ nodeId: string; added: string[]; removed: string[] }> = [];
  private streamSubscription?: Subscription;

  constructor(private workflowService: WorkflowService) {}

  ngOnInit() {
    this.processExecution();
    
    // If execution is still running, stream updates
    if (this.execution.status === 'running') {
      this.streamExecution();
    }
  }

  ngOnDestroy() {
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
    }
  }

  private processExecution() {
    // Process execution state to extract steps
    if (this.execution.state) {
      // Extract steps from state snapshots if available
      const checkpoints = (this.execution as any).checkpoints || [];
      checkpoints.forEach((checkpoint: any, index: number) => {
        this.executionSteps.push({
          nodeId: checkpoint.nodeId || `Step ${index + 1}`,
          timestamp: checkpoint.timestamp || this.execution.startedAt,
          state: checkpoint.state || {},
          output: checkpoint.output,
          error: checkpoint.error
        });
      });
    }

    // Calculate state diffs
    this.calculateStateDiffs();
  }

  private calculateStateDiffs() {
    for (let i = 1; i < this.executionSteps.length; i++) {
      const prevState = this.executionSteps[i - 1].state || {};
      const currState = this.executionSteps[i].state || {};
      
      const added: string[] = [];
      const removed: string[] = [];

      // Find added/changed keys
      Object.keys(currState).forEach(key => {
        if (JSON.stringify(prevState[key]) !== JSON.stringify(currState[key])) {
          added.push(`${key}: ${JSON.stringify(currState[key])}`);
        }
      });

      // Find removed keys
      Object.keys(prevState).forEach(key => {
        if (!(key in currState)) {
          removed.push(key);
        }
      });

      this.stateDiffs.push({
        nodeId: this.executionSteps[i].nodeId,
        added,
        removed
      });
    }
  }

  private streamExecution() {
    this.streamSubscription = this.workflowService.streamExecution(this.workflowId, this.execution.id).subscribe({
      next: (update: any) => {
        if (update.nodeId) {
          this.executionSteps.push({
            nodeId: update.nodeId,
            timestamp: new Date().toISOString(),
            state: update.state || {},
            output: update.nodeOutput,
            error: update.error
          });
          this.calculateStateDiffs();
        }
      },
      error: (err) => {
        console.error('Stream error:', err);
      }
    });
  }

  formatOutput(output: any): string {
    if (typeof output === 'string') {
      return output;
    }
    return JSON.stringify(output, null, 2);
  }

  formatState(state: any): string {
    return JSON.stringify(state, null, 2);
  }

  getNodeIcon(nodeId: string): string {
    // Extract node type from nodeId or use default
    if (nodeId.includes('input')) return 'input';
    if (nodeId.includes('output')) return 'output';
    if (nodeId.includes('llm')) return 'psychology';
    if (nodeId.includes('tool')) return 'build';
    return 'circle';
  }
}

