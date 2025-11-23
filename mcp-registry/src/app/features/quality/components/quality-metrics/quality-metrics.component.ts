import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { QualityService } from '../../services/quality.service';

@Component({
  selector: 'app-quality-metrics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatProgressBarModule
  ],
  template: `
    <div class="quality-metrics">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Quality Metrics Breakdown</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="metrics">
            <div class="metric-item">
              <label>Uptime</label>
              <mat-progress-bar [value]="metrics.uptime * 100" [color]="getColor(metrics.uptime)"></mat-progress-bar>
              <span>{{ (metrics.uptime * 100).toFixed(2) }}%</span>
            </div>
            <div class="metric-item">
              <label>Average Latency</label>
              <mat-progress-bar [value]="getLatencyScore()" [color]="getLatencyColor()"></mat-progress-bar>
              <span>{{ metrics.avgLatencyMs }}ms</span>
            </div>
            <div class="metric-item">
              <label>Success Rate</label>
              <mat-progress-bar [value]="metrics.successRate * 100" [color]="getColor(metrics.successRate)"></mat-progress-bar>
              <span>{{ (metrics.successRate * 100).toFixed(2) }}%</span>
            </div>
            <div class="metric-item">
              <label>Failure Rate</label>
              <mat-progress-bar [value]="metrics.failureRate * 100" [color]="getFailureColor(metrics.failureRate)"></mat-progress-bar>
              <span>{{ (metrics.failureRate * 100).toFixed(2) }}%</span>
            </div>
            <div class="metric-item">
              <label>Security Compliance</label>
              <mat-progress-bar [value]="metrics.securityScore * 100" [color]="getColor(metrics.securityScore)"></mat-progress-bar>
              <span>{{ (metrics.securityScore * 100).toFixed(2) }}%</span>
            </div>
            <div class="metric-item">
              <label>Documentation Completeness</label>
              <mat-progress-bar [value]="metrics.docsScore * 100" [color]="getColor(metrics.docsScore)"></mat-progress-bar>
              <span>{{ (metrics.docsScore * 100).toFixed(2) }}%</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .quality-metrics {
      padding: 16px;
    }
    .metric-item {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    .metric-item label {
      min-width: 200px;
      font-weight: 500;
    }
    .metric-item mat-progress-bar {
      flex: 1;
    }
    .metric-item span {
      min-width: 80px;
      text-align: right;
    }
  `]
})
export class QualityMetricsComponent implements OnInit {
  @Input() toolId: string = '';
  metrics: any = null;

  constructor(private qualityService: QualityService) {}

  ngOnInit(): void {
    if (this.toolId) {
      this.loadMetrics();
    }
  }

  loadMetrics(): void {
    this.qualityService.getQualityScore(this.toolId).subscribe({
      next: (result) => {
        this.metrics = result.breakdown || {
          uptime: 0.95,
          avgLatencyMs: 180,
          successRate: 0.97,
          failureRate: 0.03,
          securityScore: 0.85,
          docsScore: 0.90
        };
      },
      error: (err) => {
        console.error('Error loading quality metrics:', err);
      }
    });
  }

  getColor(value: number): string {
    if (value >= 0.8) return 'primary';
    if (value >= 0.6) return 'accent';
    return 'warn';
  }

  getFailureColor(value: number): string {
    if (value <= 0.05) return 'primary';
    if (value <= 0.1) return 'accent';
    return 'warn';
  }

  getLatencyScore(): number {
    if (!this.metrics) return 0;
    // Score based on latency (lower is better, max 1000ms = 0%, 0ms = 100%)
    return Math.max(0, 100 - (this.metrics.avgLatencyMs / 10));
  }

  getLatencyColor(): string {
    if (!this.metrics) return 'warn';
    const score = this.getLatencyScore();
    if (score >= 80) return 'primary';
    if (score >= 60) return 'accent';
    return 'warn';
  }
}

