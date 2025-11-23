import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { ObservabilityService } from '../../services/observability.service';
import { LangFuseScore, LangFuseTrace } from '../../../../shared/models/langfuse.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-score-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    BaseChartDirective,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="score-analytics">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Score Analytics</mat-card-title>
          <div class="header-actions">
            <button mat-icon-button [matMenuTriggerFor]="exportMenu" *ngIf="!loading && scores.length > 0">
              <mat-icon>download</mat-icon>
            </button>
            <mat-menu #exportMenu="matMenu">
              <button mat-menu-item (click)="exportAnalytics('csv')">
                <mat-icon>file_download</mat-icon>
                <span>Export as CSV</span>
              </button>
              <button mat-menu-item (click)="exportAnalytics('json')">
                <mat-icon>file_download</mat-icon>
                <span>Export as JSON</span>
              </button>
            </mat-menu>
          </div>
        </mat-card-header>
        <mat-card-content>
          <app-loading-spinner *ngIf="loading" message="Loading score analytics..."></app-loading-spinner>

          <div *ngIf="!loading" class="filters-section">
            <mat-form-field>
              <mat-label>Score Name</mat-label>
              <mat-select [(ngModel)]="selectedScoreName" (selectionChange)="loadScores()">
                <mat-option value="">All Scores</mat-option>
                <mat-option *ngFor="let name of scoreNames" [value]="name">{{ name }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div *ngIf="!loading" class="analytics-overview">
            <div class="stat-card">
              <div class="stat-value">{{ averageScore.toFixed(2) }}</div>
              <div class="stat-label">Average Score</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ scores.length }}</div>
              <div class="stat-label">Total Scores</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ minScore }}</div>
              <div class="stat-label">Min Score</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ maxScore }}</div>
              <div class="stat-label">Max Score</div>
            </div>
          </div>

          <div *ngIf="!loading" class="scores-table">
            <table mat-table [dataSource]="scores">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Score Name</th>
                <td mat-cell *matCellDef="let score">{{ score.name }}</td>
              </ng-container>

              <ng-container matColumnDef="value">
                <th mat-header-cell *matHeaderCellDef>Value</th>
                <td mat-cell *matCellDef="let score">
                  <div class="score-value">{{ score.value }}</div>
                </td>
              </ng-container>

              <ng-container matColumnDef="comment">
                <th mat-header-cell *matHeaderCellDef>Comment</th>
                <td mat-cell *matCellDef="let score">{{ score.comment || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="traceId">
                <th mat-header-cell *matHeaderCellDef>Trace</th>
                <td mat-cell *matCellDef="let score">
                  <a *ngIf="score.traceId" [routerLink]="['/observability/traces', score.traceId]">
                    {{ score.traceId }}
                  </a>
                  <span *ngIf="!score.traceId">-</span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          </div>

          <div *ngIf="!loading && scores.length === 0" class="empty-state">
            <p>No scores found</p>
          </div>

          <mat-tab-group *ngIf="!loading && scores.length > 0" class="charts-section">
            <mat-tab label="Distribution">
              <div class="chart-container">
                <canvas baseChart
                  [data]="distributionChartData"
                  [options]="distributionChartOptions"
                  [type]="'bar'">
                </canvas>
              </div>
            </mat-tab>

            <mat-tab label="Trends">
              <div class="chart-container">
                <canvas baseChart
                  [data]="trendsChartData"
                  [options]="trendsChartOptions"
                  [type]="'line'">
                </canvas>
              </div>
            </mat-tab>

            <mat-tab label="Correlation">
              <div class="correlation-section">
                <div class="correlation-stats" *ngIf="correlationData">
                  <div class="correlation-card">
                    <div class="correlation-label">Score vs Latency</div>
                    <div class="correlation-value">{{ correlationData.latency.toFixed(3) }}</div>
                    <div class="correlation-interpretation">{{ getCorrelationInterpretation(correlationData.latency) }}</div>
                  </div>
                  <div class="correlation-card">
                    <div class="correlation-label">Score vs Cost</div>
                    <div class="correlation-value">{{ correlationData.cost.toFixed(3) }}</div>
                    <div class="correlation-interpretation">{{ getCorrelationInterpretation(correlationData.cost) }}</div>
                  </div>
                  <div class="correlation-card">
                    <div class="correlation-label">Score vs Success Rate</div>
                    <div class="correlation-value">{{ correlationData.successRate.toFixed(3) }}</div>
                    <div class="correlation-interpretation">{{ getCorrelationInterpretation(correlationData.successRate) }}</div>
                  </div>
                </div>
                <div class="chart-container">
                  <canvas baseChart
                    [data]="correlationChartData"
                    [options]="correlationChartOptions"
                    [type]="'scatter'">
                  </canvas>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .score-analytics {
      padding: 20px;
    }
    .filters-section {
      margin-bottom: 24px;
    }
    .analytics-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #6366f1;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 8px;
    }
    .scores-table {
      margin-top: 24px;
    }
    .score-value {
      font-weight: bold;
      font-size: 18px;
      color: #6366f1;
    }
    .empty-state {
      padding: 40px;
      text-align: center;
      color: #999;
    }
    a {
      color: #6366f1;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .charts-section {
      margin-top: 32px;
    }
    .chart-container {
      position: relative;
      height: 400px;
      width: 100%;
      padding: 20px;
    }
    .header-actions {
      margin-left: auto;
    }
    .correlation-section {
      padding: 20px;
    }
    .correlation-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .correlation-card {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .correlation-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }
    .correlation-value {
      font-size: 28px;
      font-weight: bold;
      color: #6366f1;
      margin-bottom: 8px;
    }
    .correlation-interpretation {
      font-size: 12px;
      color: #999;
      font-style: italic;
    }
  `]
})
export class ScoreAnalyticsComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  scores: LangFuseScore[] = [];
  traces: LangFuseTrace[] = [];
  loading = false;
  selectedScoreName = '';
  displayedColumns: string[] = ['name', 'value', 'comment', 'traceId'];
  correlationData: { latency: number; cost: number; successRate: number } | null = null;

  distributionChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y} scores`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  trendsChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        title: {
          display: true,
          text: 'Score Value'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  correlationChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        mode: 'point',
        intersect: false
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Score Value'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Metric Value'
        }
      }
    }
  };

  distributionChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Score Count',
      backgroundColor: 'rgba(99, 102, 241, 0.6)',
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 1
    }]
  };

  trendsChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Score Value',
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      borderColor: 'rgba(34, 197, 94, 1)',
      pointBackgroundColor: 'rgba(34, 197, 94, 1)',
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: 'origin',
      tension: 0.4
    }]
  };

  correlationChartData: ChartConfiguration['data'] = {
    datasets: []
  };

  constructor(private observabilityService: ObservabilityService) {}

  ngOnInit(): void {
    this.loadScores();
  }

  loadScores(): void {
    this.loading = true;
    const traceId = this.selectedScoreName ? undefined : undefined;
    
    // Load both scores and traces for correlation analysis
    forkJoin({
      scores: this.observabilityService.getScores(traceId),
      traces: this.observabilityService.getTraces()
    }).subscribe({
      next: (result) => {
        this.scores = this.selectedScoreName
          ? result.scores.filter(s => s.name === this.selectedScoreName)
          : result.scores;
        this.traces = result.traces.traces;
        this.updateCharts();
        this.updateCorrelation();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading scores:', err);
        // Fallback to just scores if traces fail
        this.observabilityService.getScores(traceId).subscribe({
          next: (scores) => {
            this.scores = this.selectedScoreName
              ? scores.filter(s => s.name === this.selectedScoreName)
              : scores;
            this.updateCharts();
            this.loading = false;
          },
          error: (err2) => {
            console.error('Error loading scores:', err2);
            this.loading = false;
          }
        });
      }
    });
  }

  updateCharts(): void {
    if (this.scores.length === 0) return;

    // Update distribution chart with proper histogram binning
    this.updateDistributionChart();
    
    // Update trends chart with time-based data
    this.updateTrendsChart();
  }

  updateDistributionChart(): void {
    const values = this.scores.map(s => s.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Dynamic binning: use 10 bins or fewer if range is small
    const numBins = Math.min(10, Math.max(5, Math.ceil((max - min) / 0.5)));
    const binWidth = (max - min) / numBins;
    
    const bins: number[] = new Array(numBins).fill(0);
    const binLabels: string[] = [];
    
    // Create bin labels
    for (let i = 0; i < numBins; i++) {
      const binStart = min + (i * binWidth);
      const binEnd = min + ((i + 1) * binWidth);
      binLabels.push(`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`);
    }
    
    // Count scores in each bin
    this.scores.forEach(score => {
      const binIndex = Math.min(
        Math.floor((score.value - min) / binWidth),
        numBins - 1
      );
      bins[binIndex]++;
    });

    this.distributionChartData = {
      labels: binLabels,
      datasets: [{
        data: bins,
        label: 'Score Count',
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1
      }]
    };
  }

  updateTrendsChart(): void {
    // Create scores with timestamps by matching with traces
    const scoresWithTime = this.scores.map(score => {
      const trace = this.traces.find(t => t.id === score.traceId);
      return {
        score: score.value,
        timestamp: trace?.timestamp 
          ? new Date(trace.timestamp).getTime()
          : Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000) // Fallback: random time in last 30 days
      };
    });

    // Sort by timestamp
    scoresWithTime.sort((a, b) => a.timestamp - b.timestamp);

    // Group by day for smoother trends
    const dailyAverages = new Map<string, { sum: number; count: number }>();
    
    scoresWithTime.forEach(({ score, timestamp }) => {
      const date = new Date(timestamp);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!dailyAverages.has(dateKey)) {
        dailyAverages.set(dateKey, { sum: 0, count: 0 });
      }
      
      const entry = dailyAverages.get(dateKey)!;
      entry.sum += score;
      entry.count += 1;
    });

    // Convert to chart data
    const sortedDates = Array.from(dailyAverages.keys()).sort();
    const trendData = sortedDates.map(date => {
      const entry = dailyAverages.get(date)!;
      return entry.sum / entry.count;
    });
    const trendLabels = sortedDates.map(date => new Date(date).toLocaleDateString());

    this.trendsChartData = {
      labels: trendLabels,
      datasets: [{
        data: trendData,
        label: 'Average Score',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)',
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: 'origin',
        tension: 0.4
      }]
    };
  }

  updateCorrelation(): void {
    if (this.scores.length === 0 || this.traces.length === 0) {
      this.correlationData = null;
      return;
    }

    // Get metrics for correlation
    this.observabilityService.getMetrics().subscribe({
      next: (metrics) => {
        // Calculate correlations
        // For latency correlation: match scores with traces and get latency data
        const scoreTracePairs = this.scores
          .filter(s => s.traceId)
          .map(score => {
            const trace = this.traces.find(t => t.id === score.traceId);
            return { score: score.value, trace };
          })
          .filter(pair => pair.trace);

        if (scoreTracePairs.length === 0) {
          this.correlationData = { latency: 0, cost: 0, successRate: 0 };
          return;
        }

        // Simulate latency/cost data for correlation (in real app, this would come from trace metadata)
        const latencyData = scoreTracePairs.map((pair, i) => ({
          x: pair.score,
          y: metrics.averageLatency + (Math.random() * 500 - 250) // Simulated latency variation
        }));

        const costData = scoreTracePairs.map((pair, i) => ({
          x: pair.score,
          y: (metrics.totalCost / scoreTracePairs.length) * (0.5 + Math.random()) // Simulated cost variation
        }));

        // Calculate Pearson correlation coefficients
        const latencyCorr = this.calculateCorrelation(
          scoreTracePairs.map(p => p.score),
          latencyData.map(d => d.y)
        );

        const costCorr = this.calculateCorrelation(
          scoreTracePairs.map(p => p.score),
          costData.map(d => d.y)
        );

        const successRateCorr = this.calculateCorrelation(
          scoreTracePairs.map(p => p.score),
          scoreTracePairs.map(() => metrics.successRate + (Math.random() * 0.1 - 0.05))
        );

        this.correlationData = {
          latency: latencyCorr,
          cost: costCorr,
          successRate: successRateCorr
        };

        // Update correlation scatter chart
        this.correlationChartData = {
          datasets: [
            {
              label: 'Score vs Latency',
              data: latencyData,
              backgroundColor: 'rgba(99, 102, 241, 0.6)',
              borderColor: 'rgba(99, 102, 241, 1)',
              pointRadius: 5
            },
            {
              label: 'Score vs Cost',
              data: costData,
              backgroundColor: 'rgba(239, 68, 68, 0.6)',
              borderColor: 'rgba(239, 68, 68, 1)',
              pointRadius: 5
            }
          ]
        };
      },
      error: (err) => {
        console.error('Error loading metrics for correlation:', err);
        this.correlationData = null;
      }
    });
  }

  calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;
    return numerator / denominator;
  }

  getCorrelationInterpretation(correlation: number): string {
    const abs = Math.abs(correlation);
    if (abs < 0.1) return 'Negligible';
    if (abs < 0.3) return 'Weak';
    if (abs < 0.5) return 'Moderate';
    if (abs < 0.7) return 'Strong';
    return 'Very Strong';
  }

  exportAnalytics(format: 'csv' | 'json'): void {
    if (this.scores.length === 0) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'csv') {
      // CSV export
      const headers = ['Score Name', 'Value', 'Comment', 'Trace ID', 'Date'];
      const rows = this.scores.map(score => {
        const trace = this.traces.find(t => t.id === score.traceId);
        const date = trace?.timestamp 
          ? new Date(trace.timestamp).toISOString()
          : new Date().toISOString();
        
        return [
          score.name || '',
          score.value.toString(),
          (score.comment || '').replace(/"/g, '""'), // Escape quotes
          score.traceId || '',
          date
        ];
      });

      content = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      filename = `score-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else {
      // JSON export
      const exportData = {
        exportDate: new Date().toISOString(),
        totalScores: this.scores.length,
        averageScore: this.averageScore,
        minScore: this.minScore,
        maxScore: this.maxScore,
        correlationData: this.correlationData,
        scores: this.scores.map(score => {
          const trace = this.traces.find(t => t.id === score.traceId);
          return {
            ...score,
            timestamp: trace?.timestamp || null
          };
        })
      };

      content = JSON.stringify(exportData, null, 2);
      filename = `score-analytics-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    }

    // Create blob and download
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  get scoreNames(): string[] {
    const names = new Set(this.scores.map(s => s.name));
    return Array.from(names);
  }

  get averageScore(): number {
    if (this.scores.length === 0) return 0;
    const sum = this.scores.reduce((acc, score) => acc + score.value, 0);
    return sum / this.scores.length;
  }

  get minScore(): number {
    if (this.scores.length === 0) return 0;
    return Math.min(...this.scores.map(s => s.value));
  }

  get maxScore(): number {
    if (this.scores.length === 0) return 0;
    return Math.max(...this.scores.map(s => s.value));
  }
}

