import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChainConfig } from '../../../../shared/models/workflow.model';
import { WorkflowNode } from '../../../../shared/models/workflow.model';

@Component({
  selector: 'app-chain-config',
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
    MatListModule,
    DragDropModule
  ],
  template: `
    <div class="chain-config">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Chain Configuration</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="config-section">
            <h3>Chain Type</h3>
            <mat-form-field class="full-width">
              <mat-label>Chain Type</mat-label>
              <mat-select [(ngModel)]="config.chainType" (selectionChange)="onConfigChange()">
                <mat-option value="sequential">Sequential Chain</mat-option>
                <mat-option value="transform">Transform Chain</mat-option>
                <mat-option value="router">Router Chain</mat-option>
              </mat-select>
            </mat-form-field>
            <p class="help-text">
              Sequential: Execute nodes in order. Transform: Apply transformations. Router: Route based on conditions.
            </p>
          </div>

          <div class="config-section">
            <h3>Node Ordering</h3>
            <p>Drag and drop to reorder nodes in the chain:</p>
            <div class="nodes-list" cdkDropList (cdkDropListDropped)="dropNode($event)">
              <div 
                *ngFor="let nodeId of config.nodes" 
                cdkDrag 
                class="node-item"
                [class.selected]="selectedNodeId === nodeId">
                <mat-icon cdkDragHandle>drag_handle</mat-icon>
                <mat-icon>{{ getNodeIcon(nodeId) }}</mat-icon>
                <span>{{ getNodeLabel(nodeId) }}</span>
                <button mat-icon-button (click)="removeNode(nodeId)" class="remove-button">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>
            <p *ngIf="config.nodes.length === 0" class="empty-state">No nodes in chain. Add nodes from the workflow builder.</p>
          </div>

          <div class="config-section" *ngIf="config.chainType === 'transform'">
            <h3>Transform Functions</h3>
            <div class="transforms-list">
              <div *ngFor="let nodeId of config.nodes" class="transform-item">
                <h4>{{ getNodeLabel(nodeId) }}</h4>
                <mat-form-field>
                  <mat-label>Transform Type</mat-label>
                  <mat-select [(ngModel)]="getTransformConfig(nodeId).type" (selectionChange)="onConfigChange()">
                    <mat-option value="passthrough">Passthrough</mat-option>
                    <mat-option value="to_string">To String</mat-option>
                    <mat-option value="to_json">To JSON</mat-option>
                    <mat-option value="extract_field">Extract Field</mat-option>
                    <mat-option value="merge">Merge</mat-option>
                    <mat-option value="uppercase">Uppercase</mat-option>
                    <mat-option value="lowercase">Lowercase</mat-option>
                    <mat-option value="trim">Trim</mat-option>
                    <mat-option value="replace">Replace</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field *ngIf="getTransformConfig(nodeId).type === 'extract_field'">
                  <mat-label>Field Name</mat-label>
                  <input matInput [(ngModel)]="getTransformConfig(nodeId).config.field" (ngModelChange)="onConfigChange()">
                </mat-form-field>
                <mat-form-field *ngIf="getTransformConfig(nodeId).type === 'replace'">
                  <mat-label>Old Value</mat-label>
                  <input matInput [(ngModel)]="getTransformConfig(nodeId).config.old" (ngModelChange)="onConfigChange()">
                </mat-form-field>
                <mat-form-field *ngIf="getTransformConfig(nodeId).type === 'replace'">
                  <mat-label>New Value</mat-label>
                  <input matInput [(ngModel)]="getTransformConfig(nodeId).config.new" (ngModelChange)="onConfigChange()">
                </mat-form-field>
              </div>
            </div>
          </div>

          <div class="config-section">
            <h3>Chain Preview</h3>
            <div class="chain-preview">
              <div class="preview-nodes">
                <div *ngFor="let nodeId of config.nodes; let i = index" class="preview-node">
                  <div class="node-box">
                    <mat-icon>{{ getNodeIcon(nodeId) }}</mat-icon>
                    <span>{{ getNodeLabel(nodeId) }}</span>
                  </div>
                  <mat-icon *ngIf="i < config.nodes.length - 1" class="arrow">arrow_forward</mat-icon>
                </div>
              </div>
            </div>
          </div>

          <div class="config-actions">
            <button mat-raised-button color="primary" (click)="validateConfig()">
              <mat-icon>check_circle</mat-icon>
              Validate Configuration
            </button>
            <button mat-raised-button (click)="autoOrderNodes()">
              <mat-icon>auto_fix_high</mat-icon>
              Auto-Order Nodes
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
    .chain-config {
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
    .help-text {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
    }
    .nodes-list {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 8px;
      min-height: 100px;
    }
    .node-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      margin: 4px 0;
      background-color: #f5f5f5;
      border-radius: 4px;
      cursor: move;
    }
    .node-item.selected {
      background-color: #e3f2fd;
      border: 2px solid #2196f3;
    }
    .node-item:hover {
      background-color: #eeeeee;
    }
    .remove-button {
      margin-left: auto;
    }
    .empty-state {
      color: #999;
      font-style: italic;
      text-align: center;
      padding: 20px;
    }
    .transforms-list {
      margin-top: 16px;
    }
    .transform-item {
      padding: 16px;
      margin-bottom: 16px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    .chain-preview {
      margin-top: 16px;
    }
    .preview-nodes {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .preview-node {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .node-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: #e3f2fd;
      border-radius: 4px;
      border: 1px solid #2196f3;
    }
    .arrow {
      color: #2196f3;
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
export class ChainConfigComponent implements OnInit {
  @Input() config!: ChainConfig;
  @Input() nodes: WorkflowNode[] = [];
  @Input() selectedNodeId?: string;
  @Output() configChange = new EventEmitter<ChainConfig>();
  @Output() validationRequest = new EventEmitter<void>();

  validationResult: { valid: boolean; errors: string[] } | null = null;

  ngOnInit() {
    if (!this.config) {
      this.loadDefaults();
    }
    if (!this.config.transforms) {
      this.config.transforms = {};
    }
  }

  onConfigChange() {
    this.configChange.emit(this.config);
  }

  dropNode(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.config.nodes, event.previousIndex, event.currentIndex);
    this.onConfigChange();
  }

  removeNode(nodeId: string) {
    this.config.nodes = this.config.nodes.filter(id => id !== nodeId);
    if (this.config.transforms && this.config.transforms[nodeId]) {
      delete this.config.transforms[nodeId];
    }
    this.onConfigChange();
  }

  getNodeLabel(nodeId: string): string {
    const node = this.nodes.find(n => n.id === nodeId);
    return node?.label || nodeId;
  }

  getNodeIcon(nodeId: string): string {
    const node = this.nodes.find(n => n.id === nodeId);
    const icons: { [key: string]: string } = {
      'input': 'input',
      'output': 'output',
      'llm': 'psychology',
      'mcp-tool': 'build',
      'transform': 'transform',
      'condition': 'code'
    };
    return icons[node?.type || ''] || 'circle';
  }

  getTransformConfig(nodeId: string): any {
    if (!this.config.transforms) {
      this.config.transforms = {};
    }
    if (!this.config.transforms[nodeId]) {
      this.config.transforms[nodeId] = { type: 'passthrough', config: {} };
    }
    return this.config.transforms[nodeId];
  }

  validateConfig() {
    this.validationRequest.emit();
  }

  autoOrderNodes() {
    // Auto-order based on workflow connections
    // This is a simplified version - in production, would use topological sort
    this.onConfigChange();
  }

  loadDefaults() {
    if (!this.config) {
      this.config = {
        chainType: 'sequential',
        nodes: [],
        transforms: {}
      };
    } else {
      this.config.chainType = this.config.chainType || 'sequential';
      this.config.nodes = this.config.nodes || [];
      this.config.transforms = this.config.transforms || {};
    }
    this.onConfigChange();
  }
}

