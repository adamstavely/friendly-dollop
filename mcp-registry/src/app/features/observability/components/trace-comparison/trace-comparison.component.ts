import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { ObservabilityService } from '../../services/observability.service';
import { LangFuseTrace, LangFuseGeneration, LangFuseScore } from '../../../../shared/models/langfuse.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

interface ComparisonMetric {
  label: string;
  trace1: any;
  trace2: any;
  difference?: string;
}

@Component({
  selector: 'app-trace-comparison',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatChipsModule,
    MatExpansionModule,
    MatListModule,
    MatDividerModule,
    LoadingSpinnerComponent,
    StatusBadgeComponent
  ],
  template: `
    <div class="trace-comparison-container">
      <div class="comparison-header">
        <button mat-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Back
        </button>
        <h2>Trace Comparison</h2>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="exportComparison()">
            <mat-icon>download</mat-icon>
            Export Comparison
          </button>
        </div>
      </div>

      <div class="trace-selectors">
        <mat-form-field>
          <mat-label>Trace 1</mat-label>
          <mat-select [(ngModel)]="selectedTrace1Id" (selectionChange)="loadTrace1()">
            <mat-option *ngFor="let trace of availableTraces" [value]="trace.id">
              {{ trace.name }} ({{ trace.timestamp | date:'short' }})
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-icon class="swap-icon">compare_arrows</mat-icon>

        <mat-form-field>
          <mat-label>Trace 2</mat-label>
          <mat-select [(ngModel)]="selectedTrace2Id" (selectionChange)="loadTrace2()">
            <mat-option *ngFor="let trace of availableTraces" [value]="trace.id">
              {{ trace.name }} ({{ trace.timestamp | date:'short' }})
            </mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-icon-button (click)="swapTraces()" [disabled]="!trace1 || !trace2">
          <mat-icon>swap_horiz</mat-icon>
        </button>
      </div>

      <app-loading-spinner *ngIf="loading" message="Loading traces..."></app-loading-spinner>

      <div *ngIf="trace1 && trace2 && !loading" class="comparison-content">
        <mat-tab-group>
          <mat-tab label="Overview">
            <div class="tab-content">
              <div class="comparison-grid">
                <div class="comparison-column">
                  <mat-card>
                    <mat-card-header>
                      <mat-card-title>Trace 1</mat-card-title>
                      <mat-card-subtitle>{{ trace1.name }}</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <mat-list>
                        <mat-list-item>
                          <span matListItemTitle>ID</span>
                          <span matListItemLine>{{ trace1.id }}</span>
                        </mat-list-item>
                        <mat-list-item>
                          <span matListItemTitle>Timestamp</span>
                          <span matListItemLine>{{ trace1.timestamp | date:'medium' }}</span>
                        </mat-list-item>
                        <mat-list-item>
                          <span matListItemTitle>Status</span>
                          <span matListItemLine>
                            <app-status-badge [status]="getTraceStatus(trace1)"></app-status-badge>
                          </span>
                        </mat-list-item>
                        <mat-list-item *ngIf="trace1.userId">
                          <span matListItemTitle>User ID</span>
                          <span matListItemLine>{{ trace1.userId }}</span>
                        </mat-list-item>
                        <mat-list-item *ngIf="trace1.sessionId">
                          <span matListItemTitle>Session ID</span>
                          <span matListItemLine>{{ trace1.sessionId }}</span>
                        </mat-list-item>
                        <mat-list-item *ngIf="trace1.tags && trace1.tags.length > 0">
                          <span matListItemTitle>Tags</span>
                          <span matListItemLine>
                            <mat-chip *ngFor="let tag of trace1.tags">{{ tag }}</mat-chip>
                          </span>
                        </mat-list-item>
                      </mat-list>
                    </mat-card-content>
                  </mat-card>
                </div>

                <div class="comparison-column">
                  <mat-card>
                    <mat-card-header>
                      <mat-card-title>Trace 2</mat-card-title>
                      <mat-card-subtitle>{{ trace2.name }}</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <mat-list>
                        <mat-list-item>
                          <span matListItemTitle>ID</span>
                          <span matListItemLine>{{ trace2.id }}</span>
                        </mat-list-item>
                        <mat-list-item>
                          <span matListItemTitle>Timestamp</span>
                          <span matListItemLine>{{ trace2.timestamp | date:'medium' }}</span>
                        </mat-list-item>
                        <mat-list-item>
                          <span matListItemTitle>Status</span>
                          <span matListItemLine>
                            <app-status-badge [status]="getTraceStatus(trace2)"></app-status-badge>
                          </span>
                        </mat-list-item>
                        <mat-list-item *ngIf="trace2.userId">
                          <span matListItemTitle>User ID</span>
                          <span matListItemLine>{{ trace2.userId }}</span>
                        </mat-list-item>
                        <mat-list-item *ngIf="trace2.sessionId">
                          <span matListItemTitle>Session ID</span>
                          <span matListItemLine>{{ trace2.sessionId }}</span>
                        </mat-list-item>
                        <mat-list-item *ngIf="trace2.tags && trace2.tags.length > 0">
                          <span matListItemTitle>Tags</span>
                          <span matListItemLine>
                            <mat-chip *ngFor="let tag of trace2.tags">{{ tag }}</mat-chip>
                          </span>
                        </mat-list-item>
                      </mat-list>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>

              <mat-card class="metrics-card">
                <mat-card-header>
                  <mat-card-title>Comparison Metrics</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <table class="metrics-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Trace 1</th>
                        <th>Trace 2</th>
                        <th>Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let metric of comparisonMetrics">
                        <td>{{ metric.label }}</td>
                        <td>{{ formatValue(metric.trace1) }}</td>
                        <td>{{ formatValue(metric.trace2) }}</td>
                        <td [class.diff-positive]="isPositiveDiff(metric)" [class.diff-negative]="isNegativeDiff(metric)">
                          {{ metric.difference }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <mat-tab label="Input/Output">
            <div class="tab-content">
              <div class="comparison-grid">
                <div class="comparison-column">
                  <mat-card>
                    <mat-card-header>
                      <mat-card-title>Trace 1 Input</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <pre class="json-viewer">{{ trace1.input | json }}</pre>
                    </mat-card-content>
                  </mat-card>
                  <mat-card class="mt-16">
                    <mat-card-header>
                      <mat-card-title>Trace 1 Output</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <pre class="json-viewer">{{ trace1.output | json }}</pre>
                    </mat-card-content>
                  </mat-card>
                </div>

                <div class="comparison-column">
                  <mat-card>
                    <mat-card-header>
                      <mat-card-title>Trace 2 Input</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <pre class="json-viewer">{{ trace2.input | json }}</pre>
                    </mat-card-content>
                  </mat-card>
                  <mat-card class="mt-16">
                    <mat-card-header>
                      <mat-card-title>Trace 2 Output</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <pre class="json-viewer">{{ trace2.output | json }}</pre>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Generations">
            <div class="tab-content">
              <div class="comparison-grid">
                <div class="comparison-column">
                  <mat-card>
                    <mat-card-header>
                      <mat-card-title>Trace 1 Generations ({{ generations1.length }})</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <mat-expansion-panel *ngFor="let gen of generations1; let i = index">
                        <mat-expansion-panel-header>
                          <mat-panel-title>{{ gen.name }} ({{ gen.model }})</mat-panel-title>
                          <mat-panel-description *ngIf="gen.usage">
                            {{ gen.usage.totalTokens }} tokens
                          </mat-panel-description>
                        </mat-expansion-panel-header>
                        <div class="generation-details">
                          <h4>Input</h4>
                          <pre class="json-viewer">{{ gen.input | json }}</pre>
                          <h4>Output</h4>
                          <pre class="json-viewer">{{ gen.output | json }}</pre>
                          <div *ngIf="gen.usage" class="usage-info">
                            <p><strong>Tokens:</strong> {{ gen.usage.totalTokens }} ({{ gen.usage.promptTokens }} prompt + {{ gen.usage.completionTokens }} completion)</p>
                          </div>
                        </div>
                      </mat-expansion-panel>
                    </mat-card-content>
                  </mat-card>
                </div>

                <div class="comparison-column">
                  <mat-card>
                    <mat-card-header>
                      <mat-card-title>Trace 2 Generations ({{ generations2.length }})</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <mat-expansion-panel *ngFor="let gen of generations2; let i = index">
                        <mat-expansion-panel-header>
                          <mat-panel-title>{{ gen.name }} ({{ gen.model }})</mat-panel-title>
                          <mat-panel-description *ngIf="gen.usage">
                            {{ gen.usage.totalTokens }} tokens
                          </mat-panel-description>
                        </mat-expansion-panel-header>
                        <div class="generation-details">
                          <h4>Input</h4>
                          <pre class="json-viewer">{{ gen.input | json }}</pre>
                          <h4>Output</h4>
                          <pre class="json-viewer">{{ gen.output | json }}</pre>
                          <div *ngIf="gen.usage" class="usage-info">
                            <p><strong>Tokens:</strong> {{ gen.usage.totalTokens }} ({{ gen.usage.promptTokens }} prompt + {{ gen.usage.completionTokens }} completion)</p>
                          </div>
                        </div>
                      </mat-expansion-panel>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Scores">
            <div class="tab-content">
              <div class="comparison-grid">
                <div class="comparison-column">
                  <mat-card>
                    <mat-card-header>
                      <mat-card-title>Trace 1 Scores ({{ scores1.length }})</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <mat-list>
                        <mat-list-item *ngFor="let score of scores1">
                          <span matListItemTitle>{{ score.name }}</span>
                          <span matListItemLine>
                            <strong>Value:</strong> {{ score.value }}
                            <span *ngIf="score.comment"> - {{ score.comment }}</span>
                          </span>
                        </mat-list-item>
                      </mat-list>
                    </mat-card-content>
                  </mat-card>
                </div>

                <div class="comparison-column">
                  <mat-card>
                    <mat-card-header>
                      <mat-card-title>Trace 2 Scores ({{ scores2.length }})</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <mat-list>
                        <mat-list-item *ngFor="let score of scores2">
                          <span matListItemTitle>{{ score.name }}</span>
                          <span matListItemLine>
                            <strong>Value:</strong> {{ score.value }}
                            <span *ngIf="score.comment"> - {{ score.comment }}</span>
                          </span>
                        </mat-list-item>
                      </mat-list>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>

      <div *ngIf="!loading && (!trace1 || !trace2)" class="empty-state">
        <p>Please select two traces to compare</p>
      </div>
    </div>
  `,
  styles: [`
    .trace-comparison-container {
      padding: 20px;
    }
    .comparison-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .header-actions {
      display: flex;
      gap: 8px;
    }
    .trace-selectors {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .trace-selectors mat-form-field {
      flex: 1;
    }
    .swap-icon {
      color: #666;
    }
    .comparison-content {
      margin-top: 24px;
    }
    .tab-content {
      padding: 20px;
    }
    .comparison-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    .comparison-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .mt-16 {
      margin-top: 16px;
    }
    .metrics-card {
      margin-top: 24px;
    }
    .metrics-table {
      width: 100%;
      border-collapse: collapse;
    }
    .metrics-table th,
    .metrics-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .metrics-table th {
      background: #f5f5f5;
      font-weight: 600;
    }
    .diff-positive {
      color: #10b981;
      font-weight: 600;
    }
    .diff-negative {
      color: #ef4444;
      font-weight: 600;
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
    .generation-details {
      padding: 16px;
    }
    .generation-details h4 {
      margin-top: 16px;
      margin-bottom: 8px;
    }
    .generation-details h4:first-child {
      margin-top: 0;
    }
    .usage-info {
      margin-top: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .empty-state {
      padding: 40px;
      text-align: center;
      color: #999;
    }
  `]
})
export class TraceComparisonComponent implements OnInit {
  trace1: LangFuseTrace | null = null;
  trace2: LangFuseTrace | null = null;
  generations1: LangFuseGeneration[] = [];
  generations2: LangFuseGeneration[] = [];
  scores1: LangFuseScore[] = [];
  scores2: LangFuseScore[] = [];
  availableTraces: LangFuseTrace[] = [];
  selectedTrace1Id: string | null = null;
  selectedTrace2Id: string | null = null;
  loading = false;
  comparisonMetrics: ComparisonMetric[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private observabilityService: ObservabilityService
  ) {}

  ngOnInit(): void {
    // Check for trace IDs in query params
    const trace1Id = this.route.snapshot.queryParamMap.get('trace1');
    const trace2Id = this.route.snapshot.queryParamMap.get('trace2');
    
    if (trace1Id) this.selectedTrace1Id = trace1Id;
    if (trace2Id) this.selectedTrace2Id = trace2Id;

    this.loadAvailableTraces();
    
    if (trace1Id) this.loadTrace1();
    if (trace2Id) this.loadTrace2();
  }

  loadAvailableTraces(): void {
    this.observabilityService.getTraces({ limit: 100 }).subscribe({
      next: (result) => {
        this.availableTraces = result.traces;
      }
    });
  }

  loadTrace1(): void {
    if (!this.selectedTrace1Id) return;
    
    this.loading = true;
    this.observabilityService.getTrace(this.selectedTrace1Id).subscribe({
      next: (trace) => {
        this.trace1 = trace;
        if (trace?.id) {
          this.loadGenerations1(trace.id);
          this.loadScores1(trace.id);
        }
        this.updateComparisonMetrics();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading trace 1:', err);
        this.loading = false;
      }
    });
  }

  loadTrace2(): void {
    if (!this.selectedTrace2Id) return;
    
    this.loading = true;
    this.observabilityService.getTrace(this.selectedTrace2Id).subscribe({
      next: (trace) => {
        this.trace2 = trace;
        if (trace?.id) {
          this.loadGenerations2(trace.id);
          this.loadScores2(trace.id);
        }
        this.updateComparisonMetrics();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading trace 2:', err);
        this.loading = false;
      }
    });
  }

  loadGenerations1(traceId: string): void {
    this.observabilityService.getGenerations(traceId).subscribe({
      next: (generations) => {
        this.generations1 = generations;
      }
    });
  }

  loadGenerations2(traceId: string): void {
    this.observabilityService.getGenerations(traceId).subscribe({
      next: (generations) => {
        this.generations2 = generations;
      }
    });
  }

  loadScores1(traceId: string): void {
    this.observabilityService.getScores(traceId).subscribe({
      next: (scores) => {
        this.scores1 = scores;
      }
    });
  }

  loadScores2(traceId: string): void {
    this.observabilityService.getScores(traceId).subscribe({
      next: (scores) => {
        this.scores2 = scores;
      }
    });
  }

  swapTraces(): void {
    const temp = this.trace1;
    const tempId = this.selectedTrace1Id;
    const tempGens = this.generations1;
    const tempScores = this.scores1;

    this.trace1 = this.trace2;
    this.selectedTrace1Id = this.selectedTrace2Id;
    this.generations1 = this.generations2;
    this.scores1 = this.scores2;

    this.trace2 = temp;
    this.selectedTrace2Id = tempId;
    this.generations2 = tempGens;
    this.scores2 = tempScores;

    this.updateComparisonMetrics();
  }

  updateComparisonMetrics(): void {
    if (!this.trace1 || !this.trace2) {
      this.comparisonMetrics = [];
      return;
    }

    const metrics: ComparisonMetric[] = [];

    // Timestamp comparison
    const time1 = this.trace1.timestamp ? new Date(this.trace1.timestamp).getTime() : 0;
    const time2 = this.trace2.timestamp ? new Date(this.trace2.timestamp).getTime() : 0;
    const timeDiff = Math.abs(time1 - time2);
    metrics.push({
      label: 'Time Difference',
      trace1: this.trace1.timestamp || 'N/A',
      trace2: this.trace2.timestamp || 'N/A',
      difference: `${Math.floor(timeDiff / 1000)}s`
    });

    // Generations count
    const genCount1 = this.generations1.length;
    const genCount2 = this.generations2.length;
    metrics.push({
      label: 'Generations Count',
      trace1: genCount1,
      trace2: genCount2,
      difference: `${genCount2 - genCount1}`
    });

    // Total tokens
    const tokens1 = this.generations1.reduce((sum, g) => sum + (g.usage?.totalTokens || 0), 0);
    const tokens2 = this.generations2.reduce((sum, g) => sum + (g.usage?.totalTokens || 0), 0);
    metrics.push({
      label: 'Total Tokens',
      trace1: tokens1,
      trace2: tokens2,
      difference: `${tokens2 - tokens1}`
    });

    // Scores count
    const scoresCount1 = this.scores1.length;
    const scoresCount2 = this.scores2.length;
    metrics.push({
      label: 'Scores Count',
      trace1: scoresCount1,
      trace2: scoresCount2,
      difference: `${scoresCount2 - scoresCount1}`
    });

    // Average score
    const avgScore1 = this.scores1.length > 0
      ? this.scores1.reduce((sum, s) => sum + s.value, 0) / this.scores1.length
      : 0;
    const avgScore2 = this.scores2.length > 0
      ? this.scores2.reduce((sum, s) => sum + s.value, 0) / this.scores2.length
      : 0;
    metrics.push({
      label: 'Average Score',
      trace1: avgScore1.toFixed(2),
      trace2: avgScore2.toFixed(2),
      difference: `${(avgScore2 - avgScore1).toFixed(2)}`
    });

    this.comparisonMetrics = metrics;
  }

  getTraceStatus(trace: LangFuseTrace): string {
    if (trace.output && typeof trace.output === 'object' && 'error' in trace.output) {
      return 'error';
    }
    return 'success';
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  isPositiveDiff(metric: ComparisonMetric): boolean {
    const diff = parseFloat(metric.difference || '0');
    return diff > 0;
  }

  isNegativeDiff(metric: ComparisonMetric): boolean {
    const diff = parseFloat(metric.difference || '0');
    return diff < 0;
  }

  exportComparison(): void {
    if (!this.trace1 || !this.trace2) return;

    const comparisonData = {
      trace1: {
        trace: this.trace1,
        generations: this.generations1,
        scores: this.scores1
      },
      trace2: {
        trace: this.trace2,
        generations: this.generations2,
        scores: this.scores2
      },
      metrics: this.comparisonMetrics,
      comparedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(comparisonData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trace-comparison-${this.trace1.id}-vs-${this.trace2.id}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  goBack(): void {
    this.router.navigate(['/observability/traces']);
  }
}

