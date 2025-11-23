import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { LangFuseTrace, LangFuseGeneration } from '../../models/langfuse.model';

interface TraceTreeNode {
  id: string;
  name: string;
  type: 'trace' | 'span' | 'generation';
  status: 'success' | 'error' | 'pending';
  timestamp?: Date;
  duration?: number;
  children?: TraceTreeNode[];
  data?: any;
}

@Component({
  selector: 'app-trace-tree-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatExpansionModule
  ],
  template: `
    <div class="trace-tree-viewer">
      <div *ngIf="treeData" class="tree-container">
        <mat-tree [dataSource]="treeData" [treeControl]="treeControl">
          <mat-tree-node *matTreeNodeDef="let node" matTreeNodePadding>
            <button mat-icon-button disabled></button>
            <mat-icon class="node-icon" [class]="'node-' + node.type">
              {{ getNodeIcon(node.type) }}
            </mat-icon>
            <span class="node-name">{{ node.name }}</span>
            <mat-chip class="node-status" [class]="'status-' + node.status">
              {{ node.status }}
            </mat-chip>
            <span class="node-duration" *ngIf="node.duration">
              {{ node.duration }}ms
            </span>
          </mat-tree-node>

          <mat-tree-node *matTreeNodeDef="let node; when: hasChild" matTreeNodePadding>
            <button mat-icon-button [attr.aria-label]="'Toggle ' + node.name" (click)="toggleNode(node)">
              <mat-icon class="mat-icon-rtl-mirror">
                {{ treeControl.isExpanded(node) ? 'expand_more' : 'chevron_right' }}
              </mat-icon>
            </button>
            <mat-icon class="node-icon" [class]="'node-' + node.type">
              {{ getNodeIcon(node.type) }}
            </mat-icon>
            <span class="node-name">{{ node.name }}</span>
            <mat-chip class="node-status" [class]="'status-' + node.status">
              {{ node.status }}
            </mat-chip>
            <span class="node-duration" *ngIf="node.duration">
              {{ node.duration }}ms
            </span>
          </mat-tree-node>
        </mat-tree>
      </div>

      <div *ngIf="selectedNode" class="node-details">
        <mat-expansion-panel [expanded]="true">
          <mat-expansion-panel-header>
            <mat-panel-title>{{ selectedNode.name }}</mat-panel-title>
            <mat-panel-description>{{ selectedNode.type }}</mat-panel-description>
          </mat-expansion-panel-header>
          <div class="node-details-content">
            <div *ngIf="selectedNode.timestamp">
              <strong>Timestamp:</strong> {{ selectedNode.timestamp | date:'medium' }}
            </div>
            <div *ngIf="selectedNode.duration">
              <strong>Duration:</strong> {{ selectedNode.duration }}ms
            </div>
            <div *ngIf="selectedNode.data">
              <strong>Data:</strong>
              <pre class="json-viewer">{{ selectedNode.data | json }}</pre>
            </div>
          </div>
        </mat-expansion-panel>
      </div>
    </div>
  `,
  styles: [`
    .trace-tree-viewer {
      padding: 20px;
    }
    .tree-container {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .node-icon {
      margin-right: 8px;
      font-size: 20px;
    }
    .node-icon.node-trace {
      color: #6366f1;
    }
    .node-icon.node-span {
      color: #8b5cf6;
    }
    .node-icon.node-generation {
      color: #10b981;
    }
    .node-name {
      flex: 1;
      margin-left: 8px;
    }
    .node-status {
      margin-left: 8px;
      font-size: 12px;
    }
    .node-status.status-success {
      background: #10b981;
      color: white;
    }
    .node-status.status-error {
      background: #ef4444;
      color: white;
    }
    .node-status.status-pending {
      background: #f59e0b;
      color: white;
    }
    .node-duration {
      margin-left: 8px;
      font-size: 12px;
      color: #666;
    }
    .node-details {
      margin-top: 24px;
    }
    .node-details-content {
      padding: 16px;
    }
    .json-viewer {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
      max-height: 300px;
      overflow-y: auto;
    }
  `]
})
export class TraceTreeViewerComponent implements OnInit, OnChanges {
  @Input() trace: LangFuseTrace | null = null;
  @Input() generations: LangFuseGeneration[] = [];

  treeData: TraceTreeNode[] = [];
  selectedNode: TraceTreeNode | null = null;
  treeControl: any; // Would use FlatTreeControl from @angular/cdk/tree

  ngOnInit(): void {
    this.buildTree();
  }

  ngOnChanges(): void {
    this.buildTree();
  }

  buildTree(): void {
    if (!this.trace) {
      this.treeData = [];
      return;
    }

    const rootNode: TraceTreeNode = {
      id: this.trace.id || 'root',
      name: this.trace.name || 'Trace',
      type: 'trace',
      status: this.getTraceStatus(this.trace),
      timestamp: this.trace.timestamp ? new Date(this.trace.timestamp) : undefined,
      data: {
        input: this.trace.input,
        output: this.trace.output,
        metadata: this.trace.metadata
      },
      children: []
    };

    // Add generations as children
    if (this.generations && this.generations.length > 0) {
      rootNode.children = this.generations.map(gen => ({
        id: gen.id || `gen-${Date.now()}`,
        name: gen.name || 'Generation',
        type: 'generation' as const,
        status: 'success' as const,
        timestamp: gen.startTime ? new Date(gen.startTime) : undefined,
        duration: gen.startTime && gen.endTime 
          ? new Date(gen.endTime).getTime() - new Date(gen.startTime).getTime()
          : undefined,
        data: {
          model: gen.model,
          input: gen.input,
          output: gen.output,
          usage: gen.usage
        }
      }));
    }

    this.treeData = [rootNode];
  }

  getTraceStatus(trace: LangFuseTrace): 'success' | 'error' | 'pending' {
    if (trace.output && typeof trace.output === 'object' && 'error' in trace.output) {
      return 'error';
    }
    return 'success';
  }

  getNodeIcon(type: string): string {
    switch (type) {
      case 'trace':
        return 'account_tree';
      case 'span':
        return 'timeline';
      case 'generation':
        return 'auto_awesome';
      default:
        return 'circle';
    }
  }

  hasChild(_: number, node: TraceTreeNode): boolean {
    return !!(node.children && node.children.length > 0);
  }

  toggleNode(node: TraceTreeNode): void {
    // Tree control would handle expansion
    this.selectedNode = node;
  }
}
