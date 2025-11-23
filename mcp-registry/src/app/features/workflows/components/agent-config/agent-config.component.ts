import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AgentConfig } from '../../../../shared/models/workflow.model';
import { Tool } from '../../../../shared/models/tool.model';

@Component({
  selector: 'app-agent-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCheckboxModule
  ],
  template: `
    <div class="agent-config">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Agent Configuration</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="config-section">
            <h3>Agent Type</h3>
            <mat-form-field class="full-width">
              <mat-label>Agent Type</mat-label>
              <mat-select [(ngModel)]="config.agentType" (selectionChange)="onConfigChange()">
                <mat-option value="react">ReAct Agent</mat-option>
                <mat-option value="openai-functions">OpenAI Functions Agent</mat-option>
                <mat-option value="plan-and-execute">Plan and Execute Agent</mat-option>
                <mat-option value="conversational">Conversational Agent</mat-option>
              </mat-select>
            </mat-form-field>
            <p class="help-text">ReAct: Reasoning and acting agent. OpenAI Functions: Uses function calling. Plan and Execute: Plans before acting.</p>
          </div>

          <div class="config-section">
            <h3>LLM Configuration</h3>
            <div class="form-row">
              <mat-form-field>
                <mat-label>LLM Provider</mat-label>
                <mat-select [(ngModel)]="config.llmProvider" (selectionChange)="onConfigChange()">
                  <mat-option value="openai">OpenAI</mat-option>
                  <mat-option value="anthropic">Anthropic</mat-option>
                </mat-select>
              </mat-form-field>
              
              <mat-form-field>
                <mat-label>Model</mat-label>
                <input matInput [(ngModel)]="config.llmModel" (ngModelChange)="onConfigChange()" placeholder="gpt-4">
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field>
                <mat-label>Temperature</mat-label>
                <input matInput type="number" [(ngModel)]="config.temperature" (ngModelChange)="onConfigChange()" min="0" max="2" step="0.1" placeholder="0.7">
              </mat-form-field>
              
              <mat-form-field>
                <mat-label>Max Tokens</mat-label>
                <input matInput type="number" [(ngModel)]="config.maxTokens" (ngModelChange)="onConfigChange()" placeholder="Optional">
              </mat-form-field>
            </div>
          </div>

          <div class="config-section">
            <h3>System Message</h3>
            <mat-form-field class="full-width">
              <mat-label>System Message</mat-label>
              <textarea 
                matInput 
                [(ngModel)]="config.systemMessage" 
                (ngModelChange)="onConfigChange()"
                rows="4"
                placeholder="You are a helpful assistant...">
              </textarea>
            </mat-form-field>
          </div>

          <div class="config-section">
            <h3>Persona</h3>
            <mat-form-field class="full-width">
              <mat-label>Agent Persona</mat-label>
              <mat-select [(ngModel)]="config.persona" (selectionChange)="onPersonaChange()">
                <mat-option value="">None</mat-option>
                <mat-option value="developer">Developer</mat-option>
                <mat-option value="analyst">Analyst</mat-option>
                <mat-option value="researcher">Researcher</mat-option>
                <mat-option value="assistant">Assistant</mat-option>
              </mat-select>
            </mat-form-field>
            <p class="help-text">Selecting a persona will automatically load tools available for that persona.</p>
          </div>

          <div class="config-section">
            <h3>Tools</h3>
            <div class="tools-selection">
              <div class="available-tools">
                <h4>Available Tools</h4>
                <div class="tools-list">
                  <mat-card *ngFor="let tool of availableTools" class="tool-card">
                    <mat-card-content>
                      <div class="tool-header">
                        <div>
                          <h5>{{ tool.name }}</h5>
                          <p>{{ tool.description }}</p>
                        </div>
                        <mat-checkbox 
                          [checked]="isToolSelected(tool.toolId)"
                          (change)="toggleTool(tool.toolId, $event.checked)">
                        </mat-checkbox>
                      </div>
                      <div class="tool-meta">
                        <mat-chip>{{ tool.domain }}</mat-chip>
                        <mat-chip>{{ tool.securityClass }}</mat-chip>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
              
              <div class="selected-tools">
                <h4>Selected Tools ({{ selectedToolIds.length }})</h4>
                <div class="selected-tools-list">
                  <mat-chip *ngFor="let toolId of selectedToolIds" (removed)="removeTool(toolId)">
                    {{ getToolName(toolId) }}
                    <mat-icon matChipRemove>cancel</mat-icon>
                  </mat-chip>
                </div>
                <p *ngIf="selectedToolIds.length === 0" class="empty-state">No tools selected</p>
              </div>
            </div>
          </div>

          <div class="config-actions">
            <button mat-raised-button color="primary" (click)="validateConfig()">
              <mat-icon>check_circle</mat-icon>
              Validate Configuration
            </button>
            <button mat-raised-button (click)="loadDefaults()">
              <mat-icon>refresh</mat-icon>
              Load Defaults
            </button>
          </div>

          <div class="validation-result" *ngIf="validationResult">
            <div *ngIf="validationResult.valid" class="success">
              <mat-icon>check_circle</mat-icon>
              Configuration is valid
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
  `,
  styles: [`
    .agent-config {
      padding: 20px;
    }
    .full-width {
      width: 100%;
    }
    .config-section {
      margin-bottom: 32px;
    }
    .config-section h3 {
      margin-bottom: 16px;
      color: #333;
    }
    .form-row {
      display: flex;
      gap: 16px;
    }
    .form-row mat-form-field {
      flex: 1;
    }
    .help-text {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
    }
    .tools-selection {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .tools-list {
      max-height: 400px;
      overflow-y: auto;
    }
    .tool-card {
      margin-bottom: 8px;
    }
    .tool-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .tool-meta {
      margin-top: 8px;
      display: flex;
      gap: 8px;
    }
    .selected-tools-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }
    .empty-state {
      color: #999;
      font-style: italic;
    }
    .config-actions {
      display: flex;
      gap: 16px;
      margin-top: 24px;
    }
    .validation-result {
      margin-top: 16px;
      padding: 16px;
      border-radius: 4px;
    }
    .validation-result.success {
      background-color: #e8f5e9;
      color: #2e7d32;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .validation-result.error {
      background-color: #ffebee;
      color: #c62828;
    }
  `]
})
export class AgentConfigComponent implements OnInit {
  @Input() config!: AgentConfig;
  @Input() availableTools: Tool[] = [];
  @Output() configChange = new EventEmitter<AgentConfig>();
  @Output() validationRequest = new EventEmitter<void>();

  validationResult: { valid: boolean; errors: string[] } | null = null;

  get selectedToolIds(): string[] {
    return this.config?.tools || [];
  }

  ngOnInit() {
    if (!this.config) {
      this.loadDefaults();
    }
  }

  onConfigChange() {
    this.configChange.emit(this.config);
  }

  onPersonaChange() {
    // When persona changes, tools will be automatically loaded by the backend
    // This is just for UI feedback
    this.onConfigChange();
  }

  isToolSelected(toolId: string): boolean {
    return this.selectedToolIds.includes(toolId);
  }

  toggleTool(toolId: string, selected: boolean) {
    if (!this.config.tools) {
      this.config.tools = [];
    }
    
    if (selected && !this.config.tools.includes(toolId)) {
      this.config.tools.push(toolId);
    } else if (!selected) {
      this.config.tools = this.config.tools.filter(id => id !== toolId);
    }
    
    this.onConfigChange();
  }

  removeTool(toolId: string) {
    if (this.config.tools) {
      this.config.tools = this.config.tools.filter(id => id !== toolId);
      this.onConfigChange();
    }
  }

  getToolName(toolId: string): string {
    const tool = this.availableTools.find(t => t.toolId === toolId);
    return tool?.name || toolId;
  }

  validateConfig() {
    this.validationRequest.emit();
  }

  loadDefaults() {
    if (!this.config) {
      this.config = {
        agentType: 'react',
        llmProvider: 'openai',
        llmModel: 'gpt-4',
        temperature: 0.7,
        systemMessage: 'You are a helpful assistant.',
        tools: []
      };
    } else {
      this.config.agentType = this.config.agentType || 'react';
      this.config.llmProvider = this.config.llmProvider || 'openai';
      this.config.llmModel = this.config.llmModel || 'gpt-4';
      this.config.temperature = this.config.temperature ?? 0.7;
    }
    this.onConfigChange();
  }
}

