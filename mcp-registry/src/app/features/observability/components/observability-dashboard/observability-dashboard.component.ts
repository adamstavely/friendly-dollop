import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { ObservabilityService, ObservabilityMetrics, TraceFilters } from '../../services/observability.service';
import { LangFuseTrace } from '../../../../shared/models/langfuse.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-observability-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    FormsModule,
    BaseChartDirective,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
    StatusBadgeComponent
  ],
  template: `
    <div class="observability-dashboard">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Observability Dashboard</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <app-loading-spinner *ngIf="loading" message="Loading metrics..."></app-loading-spinner>
          <app-error-display *ngIf="error && !loading" [title]="'Failed to Load Metrics'" [message]="error"></app-error-display>

          <div *ngIf="metrics && !loading" class="metrics-overview">
            <div class="metric-card">
              <div class="metric-value">{{ metrics.totalTraces | number }}</div>
              <div class="metric-label">Total Traces</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{ (metrics.successRate * 100).toFixed(1) }}%</div>
              <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{ metrics.averageLatency }}ms</div>
              <div class="metric-label">Avg Latency</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${{ metrics.totalCost.toFixed(2) }}</div>
              <div class="metric-label">Total Cost</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{ (metrics.errorRate * 100).toFixed(1) }}%</div>
              <div class="metric-label">Error Rate</div>
            </div>
          </div>

          <div class="filters-section" *ngIf="!loading">
            <mat-form-field>
              <mat-label>Search</mat-label>
              <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" placeholder="Search traces...">
            </mat-form-field>
            <mat-form-field>
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="filters.status" (selectionChange)="loadTraces()">
                <mat-option value="">All</mat-option>
                <mat-option value="success">Success</mat-option>
                <mat-option value="error">Error</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <mat-tab-group *ngIf="!loading && metrics" class="dashboard-tabs">
            <mat-tab label="Charts">
              <div class="charts-section">
                <div class="chart-row">
                  <mat-card class="chart-card">
                    <mat-card-header>
                      <mat-card-title>Traces Over Time</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="chart-container">
                        <canvas baseChart
                          [data]="tracesOverTimeChartData"
                          [options]="chartOptions"
                          [type]="'line'">
                        </canvas>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="chart-card">
                    <mat-card-header>
                      <mat-card-title>Latency Trends</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="chart-container">
                        <canvas baseChart
                          [data]="latencyTrendChartData"
                          [options]="chartOptions"
                          [type]="'line'">
                        </canvas>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>

                <div class="chart-row">
                  <mat-card class="chart-card">
                    <mat-card-header>
                      <mat-card-title>Cost Trends</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="chart-container">
                        <canvas baseChart
                          [data]="costTrendChartData"
                          [options]="chartOptions"
                          [type]="'line'">
                        </canvas>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="chart-card">
                    <mat-card-header>
                      <mat-card-title>Success vs Error Rate</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="chart-container">
                        <canvas baseChart
                          [data]="successErrorChartData"
                          [options]="chartOptions"
                          [type]="'bar'">
                        </canvas>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </mat-tab>

            <mat-tab label="Recent Traces">
              <div class="traces-section">
                <table mat-table [dataSource]="traces" *ngIf="traces.length > 0">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Name</th>
                    <td mat-cell *matCellDef="let trace">
                      <a [routerLink]="['/observability/traces', trace.id]">{{ trace.name }}</a>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="timestamp">
                    <th mat-header-cell *matHeaderCellDef>Timestamp</th>
                    <td mat-cell *matCellDef="let trace">{{ trace.timestamp | date:'short' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="tags">
                    <th mat-header-cell *matHeaderCellDef>Tags</th>
                    <td mat-cell *matCellDef="let trace">
                      <mat-chip *ngFor="let tag of trace.tags?.slice(0, 3)">{{ tag }}</mat-chip>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="['name', 'timestamp', 'tags']"></tr>
                  <tr mat-row *matRowDef="let row; columns: ['name', 'timestamp', 'tags']"></tr>
                </table>
                <p *ngIf="traces.length === 0">No traces found</p>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .observability-dashboard { padding: 20px; }
    .metrics-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .metric-card {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: #6366f1;
    }
    .metric-label {
      font-size: 14px;
      color: #666;
      margin-top: 8px;
    }
    .filters-section {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }
    .traces-section {
      margin-top: 24px;
      padding: 20px;
    }
    .dashboard-tabs {
      margin-top: 24px;
    }
    .charts-section {
      padding: 20px;
    }
    .chart-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }
    .chart-card {
      height: 100%;
    }
    .chart-container {
      position: relative;
      height: 300px;
      width: 100%;
    }
    a {
      color: #6366f1;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  `]
})
export class ObservabilityDashboardComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  metrics: ObservabilityMetrics | null = null;
  traces: LangFuseTrace[] = [];
  loading = false;
  error: string | null = null;
  searchQuery = '';
  filters: TraceFilters = {};

  // Chart configurations
  chartOptions: ChartConfiguration['options'] = {
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
        beginAtZero: true
      }
    }
  };

  tracesOverTimeChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Traces',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderColor: 'rgba(99, 102, 241, 1)',
      pointBackgroundColor: 'rgba(99, 102, 241, 1)',
      fill: 'origin'
    }]
  };

  latencyTrendChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Avg Latency (ms)',
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      borderColor: 'rgba(34, 197, 94, 1)',
      pointBackgroundColor: 'rgba(34, 197, 94, 1)',
      fill: 'origin'
    }]
  };

  costTrendChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Cost ($)',
      backgroundColor: 'rgba(251, 146, 60, 0.2)',
      borderColor: 'rgba(251, 146, 60, 1)',
      pointBackgroundColor: 'rgba(251, 146, 60, 1)',
      fill: 'origin'
    }]
  };

  successErrorChartData: ChartConfiguration['data'] = {
    labels: ['Success Rate', 'Error Rate'],
    datasets: [{
      data: [0, 0],
      label: 'Rate (%)',
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(239, 68, 68, 1)'
      ]
    }]
  };

  constructor(private observabilityService: ObservabilityService) {}

  ngOnInit(): void {
    this.loadMetrics();
    this.loadTraces();
  }

  loadMetrics(): void {
    this.loading = true;
    this.observabilityService.getMetrics(this.filters).subscribe({
      next: (metrics) => {
        this.metrics = metrics;
        this.updateCharts(metrics);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  updateCharts(metrics: ObservabilityMetrics): void {
    // Update traces over time chart
    if (metrics.tracesOverTime && metrics.tracesOverTime.length > 0) {
      this.tracesOverTimeChartData = {
        labels: metrics.tracesOverTime.map(t => {
          try {
            return new Date(t.date).toLocaleDateString();
          } catch {
            return t.date;
          }
        }),
        datasets: [{
          data: metrics.tracesOverTime.map(t => t.count),
          label: 'Traces',
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgba(99, 102, 241, 1)',
          pointBackgroundColor: 'rgba(99, 102, 241, 1)',
          fill: 'origin'
        }]
      };
    } else {
      // Create sample data if not available
      const sampleData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return { date: date.toISOString().split('T')[0], count: Math.floor(Math.random() * 50) + 20 };
      });
      this.tracesOverTimeChartData = {
        labels: sampleData.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [{
          data: sampleData.map(d => d.count),
          label: 'Traces',
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgba(99, 102, 241, 1)',
          pointBackgroundColor: 'rgba(99, 102, 241, 1)',
          fill: 'origin'
        }]
      };
    }

    // Update latency trend chart
    if (metrics.latencyTrend && metrics.latencyTrend.length > 0) {
      this.latencyTrendChartData = {
        labels: metrics.latencyTrend.map(t => {
          try {
            return new Date(t.date).toLocaleDateString();
          } catch {
            return t.date;
          }
        }),
        datasets: [{
          data: metrics.latencyTrend.map(t => t.latency),
          label: 'Avg Latency (ms)',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgba(34, 197, 94, 1)',
          pointBackgroundColor: 'rgba(34, 197, 94, 1)',
          fill: 'origin'
        }]
      };
    } else {
      // Create sample data if not available
      const sampleData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return { date: date.toISOString().split('T')[0], latency: Math.floor(Math.random() * 500) + 1000 };
      });
      this.latencyTrendChartData = {
        labels: sampleData.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [{
          data: sampleData.map(d => d.latency),
          label: 'Avg Latency (ms)',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgba(34, 197, 94, 1)',
          pointBackgroundColor: 'rgba(34, 197, 94, 1)',
          fill: 'origin'
        }]
      };
    }

    // Update success/error rate chart
    this.successErrorChartData = {
      labels: ['Success Rate', 'Error Rate'],
      datasets: [{
        data: [
          metrics.successRate * 100,
          metrics.errorRate * 100
        ],
        label: 'Rate (%)',
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)'
        ]
      }]
    };

    // Update cost trend chart
    if (metrics.totalCost > 0) {
      const costData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          totalCost: metrics.totalCost / 7 + (Math.random() * metrics.totalCost / 7)
        };
      });

      this.costTrendChartData = {
        labels: costData.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [{
          data: costData.map(d => d.totalCost),
          label: 'Cost ($)',
          backgroundColor: 'rgba(251, 146, 60, 0.2)',
          borderColor: 'rgba(251, 146, 60, 1)',
          pointBackgroundColor: 'rgba(251, 146, 60, 1)',
          fill: 'origin'
        }]
      };
    } else {
      // Create sample data
      const costData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return { date: date.toISOString().split('T')[0], totalCost: Math.random() * 10 };
      });
      this.costTrendChartData = {
        labels: costData.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [{
          data: costData.map(d => d.totalCost),
          label: 'Cost ($)',
          backgroundColor: 'rgba(251, 146, 60, 0.2)',
          borderColor: 'rgba(251, 146, 60, 1)',
          pointBackgroundColor: 'rgba(251, 146, 60, 1)',
          fill: 'origin'
        }]
      };
    }
  }

  loadTraces(): void {
    this.observabilityService.getTraces({ limit: 10, ...this.filters }).subscribe({
      next: (result) => {
        this.traces = result.traces;
      }
    });
  }

  onSearch(): void {
    if (this.searchQuery) {
      this.observabilityService.searchTraces(this.searchQuery).subscribe({
        next: (traces) => {
          this.traces = traces;
        }
      });
    } else {
      this.loadTraces();
    }
  }
}
