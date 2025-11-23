import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { WorkflowDefinition, WorkflowNode, WorkflowConnection } from '../../../../shared/models/workflow.model';

@Component({
  selector: 'app-langgraph-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatExpansionModule,
    MatChipsModule,
    MatSelectModule
  ],
  template: `
    <div class="langgraph-config">
      <mat-tab-group>
        <mat-tab label="State Schema">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>State Schema Configuration</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Define the state schema for your LangGraph workflow using JSON Schema format.</p>
                <mat-form-field class="full-width">
                  <mat-label>State Schema (JSON)</mat-label>
                  <textarea 
                    matInput 
                    [(ngModel)]="stateSchemaJson" 
                    (ngModelChange)="onStateSchemaChange()"
                    rows="15"
                    placeholder='{"type": "object", "properties": {...}}'>
                  </textarea>
                </mat-form-field>
                <div class="validation-message" *ngIf="schemaValidationError">
                  <mat-icon color="warn">error</mat-icon>
                  <span>{{ schemaValidationError }}</span>
                </div>
                <div class="validation-message success" *ngIf="!schemaValidationError && stateSchemaJson">
                  <mat-icon color="primary">check_circle</mat-icon>
                  <span>Valid JSON Schema</span>
                </div>
                <button mat-raised-button (click)="loadExampleSchema()" class="example-button">
                  <mat-icon>description</mat-icon>
                  Load Example Schema
                </button>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Node Configuration">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Node Configuration</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="nodes-list">
                  <mat-expansion-panel *ngFor="let node of nodes" [expanded]="selectedNodeId === node.id">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon>{{ getNodeIcon(node.type) }}</mat-icon>
                        {{ node.label || node.id }}
                      </mat-panel-title>
                      <mat-panel-description>
                        {{ node.type }}
                      </mat-panel-description>
                    </mat-expansion-panel-header>
                    
                    <div class="node-config">
                      <mat-form-field class="full-width">
                        <mat-label>Node ID</mat-label>
                        <input matInput [(ngModel)]="node.id" readonly>
                      </mat-form-field>
                      
                      <mat-form-field class="full-width">
                        <mat-label>Node Label</mat-label>
                        <input matInput [(ngModel)]="node.label" (ngModelChange)="onNodeConfigChange()">
                      </mat-form-field>
                      
                      <mat-form-field class="full-width">
                        <mat-label>Node Type</mat-label>
                        <input matInput [(ngModel)]="node.type" readonly>
                      </mat-form-field>
                      
                      <div *ngIf="node.type === 'llm'" class="llm-config">
                        <h4>LLM Configuration</h4>
                        <mat-form-field>
                          <mat-label>Provider</mat-label>
                          <mat-select [(ngModel)]="node.data.llm.provider" (selectionChange)="onNodeConfigChange()">
                            <mat-option value="openai">OpenAI</mat-option>
                            <mat-option value="anthropic">Anthropic</mat-option>
                          </mat-select>
                        </mat-form-field>
                        <mat-form-field>
                          <mat-label>Model</mat-label>
                          <input matInput [(ngModel)]="node.data.llm.model" (ngModelChange)="onNodeConfigChange()" placeholder="gpt-4">
                        </mat-form-field>
                        <mat-form-field>
                          <mat-label>Temperature</mat-label>
                          <input matInput type="number" [(ngModel)]="node.data.llm.temperature" (ngModelChange)="onNodeConfigChange()" min="0" max="2" step="0.1">
                        </mat-form-field>
                        <mat-form-field>
                          <mat-label>System Message</mat-label>
                          <textarea matInput [(ngModel)]="node.data.llm.system_message" (ngModelChange)="onNodeConfigChange()" rows="3"></textarea>
                        </mat-form-field>
                      </div>
                      
                      <div *ngIf="node.type === 'transform'" class="transform-config">
                        <h4>Transform Configuration</h4>
                        <mat-form-field>
                          <mat-label>Transform Type</mat-label>
                          <mat-select [(ngModel)]="node.data.transform.type" (selectionChange)="onNodeConfigChange()">
                            <mat-option value="passthrough">Passthrough</mat-option>
                            <mat-option value="to_string">To String</mat-option>
                            <mat-option value="to_json">To JSON</mat-option>
                            <mat-option value="extract_field">Extract Field</mat-option>
                            <mat-option value="merge">Merge</mat-option>
                            <mat-option value="uppercase">Uppercase</mat-option>
                            <mat-option value="lowercase">Lowercase</mat-option>
                          </mat-select>
                        </mat-form-field>
                        <mat-form-field *ngIf="node.data.transform.type === 'extract_field'">
                          <mat-label>Field Name</mat-label>
                          <input matInput [(ngModel)]="node.data.transform.config.field" (ngModelChange)="onNodeConfigChange()">
                        </mat-form-field>
                      </div>
                      
                      <div *ngIf="node.type === 'mcp-tool'">
                        <mat-form-field class="full-width">
                          <mat-label>MCP Tool ID</mat-label>
                          <input matInput [(ngModel)]="node.mcpToolId" (ngModelChange)="onNodeConfigChange()">
                        </mat-form-field>
                      </div>
                    </div>
                  </mat-expansion-panel>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Graph Preview">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Compiled Graph Structure</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="graph-info">
                  <div class="info-item">
                    <strong>Nodes:</strong> {{ nodes.length }}
                  </div>
                  <div class="info-item">
                    <strong>Connections:</strong> {{ connections.length }}
                  </div>
                  <div class="info-item">
                    <strong>Entry Point:</strong> {{ getEntryPoint() }}
                  </div>
                </div>
                
                <div class="graph-structure">
                  <h4>Node List</h4>
                  <div class="nodes-preview">
                    <mat-chip *ngFor="let node of nodes" [class]="'node-chip-' + node.type">
                      <mat-icon>{{ getNodeIcon(node.type) }}</mat-icon>
                      {{ node.label || node.id }}
                    </mat-chip>
                  </div>
                  
                  <h4>Connection Graph</h4>
                  <div class="connections-preview">
                    <div *ngFor="let conn of connections" class="connection-item">
                      <mat-icon>arrow_forward</mat-icon>
                      <span>{{ conn.source }}</span>
                      <mat-icon>arrow_right</mat-icon>
                      <span>{{ conn.target }}</span>
                    </div>
                  </div>
                </div>
                
                <button mat-raised-button color="primary" (click)="validateGraph()">
                  <mat-icon>check_circle</mat-icon>
                  Validate Graph
                </button>
                <div class="validation-result" *ngIf="validationResult">
                  <div *ngIf="validationResult.valid" class="success">
                    <mat-icon>check_circle</mat-icon>
                    Graph is valid
                  </div>
                  <div *ngIf="!validationResult.valid" class="error">
                    <mat-icon>error</mat-icon>
                    <div *ngFor="let error of validationResult.errors">
                      {{ error }}
                    </div>
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
    .langgraph-config {
      padding: 20px;
    }
    .tab-content {
      padding: 20px;
    }
    .full-width {
      width: 100%;
    }
    .validation-message {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      padding: 8px;
      border-radius: 4px;
    }
    .validation-message.success {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    .validation-message.error {
      background-color: #ffebee;
      color: #c62828;
    }
    .example-button {
      margin-top: 16px;
    }
    .nodes-list {
      margin-top: 16px;
    }
    .node-config {
      padding: 16px;
    }
    .llm-config, .transform-config {
      margin-top: 16px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    .graph-info {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
    }
    .info-item {
      padding: 8px 16px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    .nodes-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 16px 0;
    }
    .connections-preview {
      margin: 16px 0;
    }
    .connection-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      margin: 4px 0;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    .validation-result {
      margin-top: 16px;
      padding: 16px;
      border-radius: 4px;
    }
    .validation-result.success {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    .validation-result.error {
      background-color: #ffebee;
      color: #c62828;
    }
  `]
})
export class LanggraphConfigComponent implements OnInit {
  @Input() definition!: WorkflowDefinition;
  @Input() selectedNodeId?: string;
  @Output() definitionChange = new EventEmitter<WorkflowDefinition>();
  @Output() validationRequest = new EventEmitter<void>();

  stateSchemaJson: string = '';
  schemaValidationError: string = '';
  validationResult: { valid: boolean; errors: string[] } | null = null;

  get nodes(): WorkflowNode[] {
    return this.definition?.nodes || [];
  }

  get connections(): WorkflowConnection[] {
    return this.definition?.connections || [];
  }

  ngOnInit() {
    if (this.definition?.stateSchema) {
      this.stateSchemaJson = JSON.stringify(this.definition.stateSchema, null, 2);
    }
    
    // Initialize node data structures
    this.nodes.forEach(node => {
      if (!node.data) {
        node.data = {};
      }
      if (node.type === 'llm' && !node.data.llm) {
        node.data.llm = { provider: 'openai', model: 'gpt-4', temperature: 0.7 };
      }
      if (node.type === 'transform' && !node.data.transform) {
        node.data.transform = { type: 'passthrough', config: {} };
      }
    });
  }

  onStateSchemaChange() {
    try {
      const schema = JSON.parse(this.stateSchemaJson);
      this.schemaValidationError = '';
      
      if (!this.definition) {
        this.definition = { nodes: [], connections: [] };
      }
      
      this.definition.stateSchema = schema;
      this.definitionChange.emit(this.definition);
    } catch (e: any) {
      this.schemaValidationError = `Invalid JSON: ${e.message}`;
    }
  }

  onNodeConfigChange() {
    this.definitionChange.emit(this.definition);
  }

  loadExampleSchema() {
    const example = {
      type: "object",
      properties: {
        input: { type: "string" },
        output: { type: "string" },
        messages: {
          type: "array",
          items: { type: "object" }
        }
      },
      required: ["input"]
    };
    this.stateSchemaJson = JSON.stringify(example, null, 2);
    this.onStateSchemaChange();
  }

  getNodeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'input': 'input',
      'output': 'output',
      'llm': 'psychology',
      'mcp-tool': 'build',
      'transform': 'transform',
      'condition': 'code'
    };
    return icons[type] || 'circle';
  }

  getEntryPoint(): string {
    const inputNodes = this.nodes.filter(n => n.type === 'input');
    return inputNodes.length > 0 ? inputNodes[0].id : (this.nodes[0]?.id || 'N/A');
  }

  validateGraph() {
    this.validationRequest.emit();
  }
}

