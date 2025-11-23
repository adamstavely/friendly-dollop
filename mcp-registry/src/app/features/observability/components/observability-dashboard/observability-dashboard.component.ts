import { Component, OnInit } from '@angular/core';
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
import { FormsModule } from '@angular/forms';
import { ObservabilityService, ObservabilityMetrics } from '../../services/observability.service';
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
    FormsModule,
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

          <div class="traces-section" *ngIf="!loading">
            <h3>Recent Traces</h3>
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
  metrics: ObservabilityMetrics | null = null;
  traces: LangFuseTrace[] = [];
  loading = false;
  error: string | null = null;
  searchQuery = '';
  filters: { status?: string } = {};

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
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
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
