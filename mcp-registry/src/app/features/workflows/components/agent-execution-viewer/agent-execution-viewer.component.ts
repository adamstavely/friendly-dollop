import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { WorkflowExecution } from '../../../../shared/models/workflow.model';

interface ToolCall {
  tool: string;
  input: any;
  output: string;
  timestamp: string;
}

interface ReasoningStep {
  step: number;
  thought: string;
  action?: string;
  observation?: string;
}

@Component({
  selector: 'app-agent-execution-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatExpansionModule,
    MatChipsModule,
    MatListModule
  ],
  template: `
    <div class="agent-execution-viewer">
      <mat-tab-group>
        <mat-tab label="Tool Calls">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Tool Invocations</mat-card-title>
                <mat-card-subtitle>{{ toolCalls.length }} tool call(s)</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="tool-calls-list">
                  <mat-expansion-panel *ngFor="let toolCall of toolCalls; let i = index" [expanded]="i === 0">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon>build</mat-icon>
                        {{ toolCall.tool }}
                      </mat-panel-title>
                      <mat-panel-description>
                        {{ toolCall.timestamp | date:'short' }}
                      </mat-panel-description>
                    </mat-expansion-panel-header>
                    <div class="tool-call-details">
                      <div class="detail-section">
                        <h4>Input</h4>
                        <pre>{{ formatInput(toolCall.input) }}</pre>
                      </div>
                      <div class="detail-section">
                        <h4>Output</h4>
                        <pre>{{ toolCall.output }}</pre>
                      </div>
                    </div>
                  </mat-expansion-panel>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Reasoning Steps">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Agent Reasoning</mat-card-title>
                <mat-card-subtitle>{{ reasoningSteps.length }} reasoning step(s)</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="reasoning-steps">
                  <div *ngFor="let step of reasoningSteps; let i = index" class="reasoning-step">
                    <div class="step-number">{{ step.step }}</div>
                    <div class="step-content">
                      <div class="step-thought" *ngIf="step.thought">
                        <mat-icon>psychology</mat-icon>
                        <strong>Thought:</strong> {{ step.thought }}
                      </div>
                      <div class="step-action" *ngIf="step.action">
                        <mat-icon>play_arrow</mat-icon>
                        <strong>Action:</strong> {{ step.action }}
                      </div>
                      <div class="step-observation" *ngIf="step.observation">
                        <mat-icon>visibility</mat-icon>
                        <strong>Observation:</strong> {{ step.observation }}
                      </div>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Intermediate Steps">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Intermediate Steps</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="intermediate-steps">
                  <mat-list>
                    <mat-list-item *ngFor="let step of intermediateSteps; let i = index">
                      <mat-icon matListItemIcon>arrow_forward</mat-icon>
                      <div matListItemTitle>Step {{ i + 1 }}</div>
                      <div matListItemLine>{{ formatStep(step) }}</div>
                    </mat-list-item>
                  </mat-list>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Decision Tree">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Agent Decision Tree</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="decision-tree">
                  <div class="tree-node root">
                    <mat-icon>play_circle</mat-icon>
                    <span>Agent Started</span>
                    <mat-chip>Input: {{ formatInput(execution.input) }}</mat-chip>
                  </div>
                  
                  <div *ngFor="let step of reasoningSteps; let i = index" class="tree-branch">
                    <div class="tree-node">
                      <mat-icon>psychology</mat-icon>
                      <span>Step {{ step.step }}</span>
                      <div class="node-details">
                        <div *ngIf="step.thought" class="detail-item">
                          <strong>Thought:</strong> {{ step.thought }}
                        </div>
                        <div *ngIf="step.action" class="detail-item">
                          <strong>Action:</strong> {{ step.action }}
                        </div>
                      </div>
                    </div>
                    
                    <div *ngIf="step.observation" class="tree-node observation">
                      <mat-icon>visibility</mat-icon>
                      <span>Observation</span>
                      <div class="node-details">
                        {{ step.observation }}
                      </div>
                    </div>
                  </div>
                  
                  <div class="tree-node end">
                    <mat-icon>{{ execution.status === 'completed' ? 'check_circle' : 'error' }}</mat-icon>
                    <span>Agent {{ execution.status }}</span>
                    <mat-chip *ngIf="execution.output">{{ formatOutput(execution.output) }}</mat-chip>
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
    .agent-execution-viewer {
      padding: 20px;
    }
    .tab-content {
      padding: 20px;
    }
    .tool-calls-list {
      margin-top: 16px;
    }
    .tool-call-details {
      padding: 16px;
    }
    .detail-section {
      margin-bottom: 16px;
    }
    .detail-section h4 {
      margin-bottom: 8px;
      color: #333;
    }
    .detail-section pre {
      background-color: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
    }
    .reasoning-steps {
      margin-top: 16px;
    }
    .reasoning-step {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      padding: 16px;
      background-color: #f9f9f9;
      border-radius: 4px;
      border-left: 4px solid #2196f3;
    }
    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #2196f3;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      flex-shrink: 0;
    }
    .step-content {
      flex: 1;
    }
    .step-thought, .step-action, .step-observation {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 8px;
    }
    .intermediate-steps {
      margin-top: 16px;
    }
    .decision-tree {
      margin-top: 16px;
    }
    .tree-node {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      margin: 8px 0;
      background-color: #f5f5f5;
      border-radius: 4px;
      border-left: 4px solid #2196f3;
      flex-wrap: wrap;
    }
    .tree-node.root {
      background-color: #e3f2fd;
      border-left-color: #2196f3;
    }
    .tree-node.observation {
      background-color: #fff3e0;
      border-left-color: #ff9800;
      margin-left: 32px;
    }
    .tree-node.end {
      background-color: #e8f5e9;
      border-left-color: #4caf50;
    }
    .tree-branch {
      margin-left: 16px;
      border-left: 2px solid #ddd;
      padding-left: 16px;
    }
    .node-details {
      width: 100%;
      margin-top: 8px;
      padding-left: 44px;
    }
    .detail-item {
      margin-bottom: 4px;
      font-size: 14px;
    }
  `]
})
export class AgentExecutionViewerComponent implements OnInit {
  @Input() execution!: WorkflowExecution;

  toolCalls: ToolCall[] = [];
  reasoningSteps: ReasoningStep[] = [];
  intermediateSteps: any[] = [];

  ngOnInit() {
    this.processExecution();
  }

  private processExecution() {
    // Extract tool calls
    if (this.execution.toolCalls && this.execution.toolCalls.length > 0) {
      this.toolCalls = this.execution.toolCalls.map((call: any, index: number) => ({
        tool: call.tool || `Tool ${index + 1}`,
        input: call.input || {},
        output: call.output || '',
        timestamp: this.execution.startedAt
      }));
    }

    // Extract reasoning steps
    if (this.execution.reasoningSteps && this.execution.reasoningSteps.length > 0) {
      this.reasoningSteps = this.execution.reasoningSteps.map((step: string, index: number) => ({
        step: index + 1,
        thought: step
      }));
    }

    // Extract intermediate steps
    if ((this.execution as any).intermediateSteps) {
      this.intermediateSteps = (this.execution as any).intermediateSteps;
    }
  }

  formatInput(input: any): string {
    if (typeof input === 'string') {
      return input;
    }
    return JSON.stringify(input, null, 2);
  }

  formatOutput(output: any): string {
    if (typeof output === 'string') {
      return output.length > 100 ? output.substring(0, 100) + '...' : output;
    }
    const str = JSON.stringify(output);
    return str.length > 100 ? str.substring(0, 100) + '...' : str;
  }

  formatStep(step: any): string {
    if (typeof step === 'string') {
      return step;
    }
    return JSON.stringify(step);
  }
}

