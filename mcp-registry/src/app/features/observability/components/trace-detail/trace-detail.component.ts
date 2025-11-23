import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { ObservabilityService } from '../../services/observability.service';
import { LangFuseTrace, LangFuseGeneration, LangFuseScore } from '../../../../shared/models/langfuse.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-trace-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatListModule,
    MatExpansionModule,
    MatMenuModule,
    LoadingSpinnerComponent,
    StatusBadgeComponent
  ],
  template: `
    <div class="trace-detail-container">
      <app-loading-spinner *ngIf="loading" message="Loading trace..."></app-loading-spinner>

      <div *ngIf="trace && !loading">
        <div class="trace-header">
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Back to Traces
          </button>
          <div class="header-actions">
            <button mat-icon-button [matMenuTriggerFor]="actionsMenu">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #actionsMenu="matMenu">
              <button mat-menu-item [routerLink]="['/security/scan', trace.id!]">
                <mat-icon>security</mat-icon>
                Security Scan
              </button>
              <button mat-menu-item (click)="exportTrace()">
                <mat-icon>download</mat-icon>
                Export Trace
              </button>
            </mat-menu>
          </div>
        </div>

        <mat-card>
          <mat-card-header>
            <div class="header-content">
              <div>
                <mat-card-title>{{ trace.name }}</mat-card-title>
                <mat-card-subtitle>
                  <span *ngIf="trace.timestamp">{{ trace.timestamp | date:'medium' }}</span>
                  <mat-chip *ngFor="let tag of trace.tags" class="tag-chip">{{ tag }}</mat-chip>
                </mat-card-subtitle>
              </div>
              <div class="header-actions">
                <button mat-raised-button (click)="exportTrace()">
                  <mat-icon>download</mat-icon>
                  Export
                </button>
              </div>
            </div>
          </mat-card-header>
          <mat-card-content>
            <mat-tab-group>
              <mat-tab label="Timeline">
                <div class="tab-content">
                  <div class="timeline-view">
                    <div class="timeline-item" *ngFor="let item of timelineItems">
                      <div class="timeline-marker" [class]="'marker-' + item.type"></div>
                      <div class="timeline-content">
                        <div class="timeline-header">
                          <span class="timeline-title">{{ item.name }}</span>
                          <span class="timeline-time">{{ item.timestamp | date:'short' }}</span>
                        </div>
                        <div class="timeline-duration" *ngIf="item.duration">
                          Duration: {{ item.duration }}ms
                        </div>
                        <div class="timeline-description" *ngIf="item.description">
                          {{ item.description }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </mat-tab>

              <mat-tab label="Tree View">
                <div class="tab-content">
                  <div class="trace-tree-container">
                    <div *ngFor="let node of traceTree" class="tree-node">
                      <div class="tree-node-header" (click)="toggleNode(node)">
                        <mat-icon class="node-type-icon">{{ getNodeIcon(node.type) }}</mat-icon>
                        <span class="node-name">{{ node.name }}</span>
                        <mat-chip class="node-status" [class]="'status-' + node.status">
                          {{ node.status }}
                        </mat-chip>
                        <span class="node-duration" *ngIf="node.duration">{{ node.duration }}ms</span>
                      </div>
                      <div class="tree-node-children" *ngIf="node.expanded && node.children">
                        <div *ngFor="let child of node.children" class="tree-node-child">
                          <mat-icon class="node-type-icon">{{ getNodeIcon(child.type) }}</mat-icon>
                          <span>{{ child.name }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </mat-tab>

              <mat-tab label="Overview">
                <div class="tab-content">
                  <div class="trace-metadata">
                    <h3>Metadata</h3>
                    <mat-list>
                      <mat-list-item *ngIf="trace.userId">
                        <span matListItemTitle>User ID</span>
                        <span matListItemLine>{{ trace.userId }}</span>
                      </mat-list-item>
                      <mat-list-item *ngIf="trace.sessionId">
                        <span matListItemTitle>Session ID</span>
                        <span matListItemLine>{{ trace.sessionId }}</span>
                      </mat-list-item>
                      <mat-list-item *ngIf="trace.metadata">
                        <span matListItemTitle>Metadata</span>
                        <span matListItemLine>
                          <pre class="metadata-json">{{ trace.metadata | json }}</pre>
                        </span>
                      </mat-list-item>
                    </mat-list>
                  </div>

                  <div class="trace-io">
                    <mat-expansion-panel>
                      <mat-expansion-panel-header>
                        <mat-panel-title>Input</mat-panel-title>
                      </mat-expansion-panel-header>
                      <pre class="json-viewer">{{ trace.input | json }}</pre>
                    </mat-expansion-panel>

                    <mat-expansion-panel>
                      <mat-expansion-panel-header>
                        <mat-panel-title>Output</mat-panel-title>
                      </mat-expansion-panel-header>
                      <pre class="json-viewer">{{ trace.output | json }}</pre>
                    </mat-expansion-panel>
                  </div>
                </div>
              </mat-tab>

              <mat-tab label="Generations">
                <div class="tab-content">
                  <div *ngIf="generations.length === 0" class="empty-state">
                    <p>No generations found</p>
                  </div>
                  <mat-expansion-panel *ngFor="let gen of generations; let i = index">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        {{ gen.name }} ({{ gen.model }})
                      </mat-panel-title>
                      <mat-panel-description>
                        <span *ngIf="gen.usage">
                          {{ gen.usage.totalTokens }} tokens
                        </span>
                      </mat-panel-description>
                    </mat-expansion-panel-header>
                    <div class="generation-details">
                      <div class="generation-section">
                        <h4>Input</h4>
                        <pre class="json-viewer">{{ gen.input | json }}</pre>
                      </div>
                      <div class="generation-section">
                        <h4>Output</h4>
                        <pre class="json-viewer">{{ gen.output | json }}</pre>
                      </div>
                      <div class="generation-section" *ngIf="gen.usage">
                        <h4>Usage</h4>
                        <mat-list>
                          <mat-list-item>
                            <span matListItemTitle>Prompt Tokens</span>
                            <span matListItemLine>{{ gen.usage.promptTokens }}</span>
                          </mat-list-item>
                          <mat-list-item>
                            <span matListItemTitle>Completion Tokens</span>
                            <span matListItemLine>{{ gen.usage.completionTokens }}</span>
                          </mat-list-item>
                          <mat-list-item>
                            <span matListItemTitle>Total Tokens</span>
                            <span matListItemLine>{{ gen.usage.totalTokens }}</span>
                          </mat-list-item>
                        </mat-list>
                      </div>
                    </div>
                  </mat-expansion-panel>
                </div>
              </mat-tab>

              <mat-tab label="Scores">
                <div class="tab-content">
                  <div *ngIf="scores.length === 0" class="empty-state">
                    <p>No scores found</p>
                  </div>
                  <mat-list *ngIf="scores.length > 0">
                    <mat-list-item *ngFor="let score of scores">
                      <span matListItemTitle>{{ score.name }}</span>
                      <span matListItemLine>
                        <strong>Value:</strong> {{ score.value }}
                        <span *ngIf="score.comment"> - {{ score.comment }}</span>
                      </span>
                    </mat-list-item>
                  </mat-list>
                </div>
              </mat-tab>
            </mat-tab-group>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .trace-detail-container {
      padding: 20px;
    }
    .trace-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .header-actions {
      display: flex;
      gap: 8px;
    }
    .tab-content {
      padding: 20px;
    }
    .trace-metadata, .trace-io {
      margin-bottom: 24px;
    }
    .json-viewer {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
      max-height: 400px;
      overflow-y: auto;
    }
    .metadata-json {
      background: #f5f5f5;
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .generation-details {
      padding: 16px;
    }
    .generation-section {
      margin-bottom: 24px;
    }
    .generation-section h4 {
      margin-bottom: 8px;
    }
    .tag-chip {
      margin-left: 8px;
    }
    .empty-state {
      padding: 40px;
      text-align: center;
      color: #999;
    }
    .trace-tree-container {
      padding: 16px;
    }
    .tree-node {
      margin-bottom: 8px;
    }
    .tree-node-header {
      display: flex;
      align-items: center;
      padding: 8px;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.2s;
    }
    .tree-node-header:hover {
      background: #f5f5f5;
    }
    .node-type-icon {
      margin: 0 8px;
      color: #6366f1;
    }
    .node-name {
      flex: 1;
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
    .node-duration {
      margin-left: 8px;
      font-size: 12px;
      color: #666;
    }
    .tree-node-children {
      margin-left: 24px;
    }
    .timeline-view {
      position: relative;
      padding: 20px;
    }
    .timeline-item {
      display: flex;
      margin-bottom: 24px;
      position: relative;
    }
    .timeline-item:not(:last-child)::after {
      content: '';
      position: absolute;
      left: 11px;
      top: 32px;
      width: 2px;
      height: calc(100% + 8px);
      background: #ddd;
    }
    .timeline-marker {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #6366f1;
      border: 3px solid white;
      box-shadow: 0 0 0 2px #6366f1;
      flex-shrink: 0;
      z-index: 1;
    }
    .timeline-marker.marker-trace {
      background: #6366f1;
      box-shadow: 0 0 0 2px #6366f1;
    }
    .timeline-marker.marker-generation {
      background: #10b981;
      box-shadow: 0 0 0 2px #10b981;
    }
    .timeline-marker.marker-span {
      background: #8b5cf6;
      box-shadow: 0 0 0 2px #8b5cf6;
    }
    .timeline-content {
      margin-left: 16px;
      flex: 1;
      background: #f5f5f5;
      padding: 12px 16px;
      border-radius: 8px;
    }
    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .timeline-title {
      font-weight: 500;
      font-size: 14px;
    }
    .timeline-time {
      font-size: 12px;
      color: #666;
    }
    .timeline-duration {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
    .timeline-description {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }
  `]
})

interface TraceTreeNode {
  id: string;
  name: string;
  type: 'trace' | 'span' | 'generation';
  status: 'success' | 'error' | 'pending';
  timestamp?: Date;
  duration?: number;
  expanded?: boolean;
  children?: TraceTreeNode[];
  data?: any;
}

export class TraceDetailComponent implements OnInit {
  trace: LangFuseTrace | null = null;
  generations: LangFuseGeneration[] = [];
  scores: LangFuseScore[] = [];
  loading = false;
  traceTree: TraceTreeNode[] = [];
  timelineItems: Array<{
    name: string;
    type: string;
    timestamp: Date;
    duration?: number;
    description?: string;
  }> = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private observabilityService: ObservabilityService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTrace(id);
    }
  }

  loadTrace(id: string): void {
    this.loading = true;
    this.observabilityService.getTrace(id).subscribe({
      next: (trace) => {
        this.trace = trace;
        if (trace?.id) {
          this.loadGenerations(trace.id);
          this.loadScores(trace.id);
        }
        this.buildTraceTree();
        this.buildTimeline();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading trace:', err);
        this.loading = false;
      }
    });
  }

  buildTimeline(): void {
    if (!this.trace) {
      this.timelineItems = [];
      return;
    }

    const items: Array<{
      name: string;
      type: string;
      timestamp: Date;
      duration?: number;
      description?: string;
    }> = [];

    // Add trace start
    if (this.trace.timestamp) {
      items.push({
        name: this.trace.name,
        type: 'trace',
        timestamp: new Date(this.trace.timestamp),
        description: 'Trace started'
      });
    }

    // Add generations
    this.generations.forEach(gen => {
      if (gen.startTime) {
        items.push({
          name: gen.name || 'Generation',
          type: 'generation',
          timestamp: new Date(gen.startTime),
          duration: gen.startTime && gen.endTime
            ? new Date(gen.endTime).getTime() - new Date(gen.startTime).getTime()
            : undefined,
          description: gen.model ? `Model: ${gen.model}` : undefined
        });
      }
    });

    // Sort by timestamp
    items.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    this.timelineItems = items;
  }

  buildTraceTree(): void {
    if (!this.trace) {
      this.traceTree = [];
      return;
    }

    const rootNode: TraceTreeNode = {
      id: this.trace.id || 'root',
      name: this.trace.name || 'Trace',
      type: 'trace',
      status: this.getTraceStatus(this.trace),
      timestamp: this.trace.timestamp ? new Date(this.trace.timestamp) : undefined,
      expanded: true,
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
        expanded: false,
        data: {
          model: gen.model,
          input: gen.input,
          output: gen.output,
          usage: gen.usage
        }
      }));
    }

    this.traceTree = [rootNode];
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

  toggleNode(node: TraceTreeNode): void {
    node.expanded = !node.expanded;
  }

  loadGenerations(traceId: string): void {
    this.observabilityService.getGenerations(traceId).subscribe({
      next: (generations) => {
        this.generations = generations;
        this.buildTraceTree();
      },
      error: (err) => {
        console.error('Error loading generations:', err);
      }
    });
  }

  loadScores(traceId: string): void {
    this.observabilityService.getScores(traceId).subscribe({
      next: (scores) => {
        this.scores = scores;
      },
      error: (err) => {
        console.error('Error loading scores:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/observability/traces']);
  }

  exportTrace(): void {
    if (!this.trace) return;

    const exportData = {
      trace: this.trace,
      generations: this.generations,
      scores: this.scores,
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trace-${this.trace.id || 'export'}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
