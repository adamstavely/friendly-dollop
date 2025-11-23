import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { ObservabilityService } from '../../services/observability.service';
import { LangFuseScore } from '../../../../shared/models/langfuse.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

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
    BaseChartDirective,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="score-analytics">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Score Analytics</mat-card-title>
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
                  [options]="chartOptions"
                  [type]="'bar'">
                </canvas>
              </div>
            </mat-tab>

            <mat-tab label="Trends">
              <div class="chart-container">
                <canvas baseChart
                  [data]="trendsChartData"
                  [options]="chartOptions"
                  [type]="'line'">
                </canvas>
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
  `]
})
export class ScoreAnalyticsComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  scores: LangFuseScore[] = [];
  loading = false;
  selectedScoreName = '';
  displayedColumns: string[] = ['name', 'value', 'comment', 'traceId'];

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

  distributionChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Score Count',
      backgroundColor: 'rgba(99, 102, 241, 0.6)',
      borderColor: 'rgba(99, 102, 241, 1)'
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
      fill: 'origin'
    }]
  };

  constructor(private observabilityService: ObservabilityService) {}

  ngOnInit(): void {
    this.loadScores();
  }

  loadScores(): void {
    this.loading = true;
    const traceId = this.selectedScoreName ? undefined : undefined; // Could filter by trace if needed
    this.observabilityService.getScores(traceId).subscribe({
      next: (scores) => {
        this.scores = this.selectedScoreName
          ? scores.filter(s => s.name === this.selectedScoreName)
          : scores;
        this.updateCharts();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading scores:', err);
        this.loading = false;
      }
    });
  }

  updateCharts(): void {
    // Update distribution chart
    const scoreRanges = [0, 2, 4, 6, 8, 10];
    const rangeLabels = ['0-2', '2-4', '4-6', '6-8', '8-10'];
    const counts = scoreRanges.slice(0, -1).map((min, i) => {
      const max = scoreRanges[i + 1];
      return this.scores.filter(s => s.value >= min && s.value < max).length;
    });

    this.distributionChartData = {
      labels: rangeLabels,
      datasets: [{
        data: counts,
        label: 'Score Count',
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)'
      }]
    };

    // Update trends chart (simulate time series)
    const sortedScores = [...this.scores].sort((a, b) => {
      // Sort by some timestamp if available, otherwise by index
      return 0;
    });
    const trendData = sortedScores.map((s, i) => s.value);
    const trendLabels = sortedScores.map((s, i) => `Score ${i + 1}`);

    this.trendsChartData = {
      labels: trendLabels,
      datasets: [{
        data: trendData,
        label: 'Score Value',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)',
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        fill: 'origin'
      }]
    };
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

