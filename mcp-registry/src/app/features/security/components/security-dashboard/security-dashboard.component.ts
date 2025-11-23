import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { AISecurityService } from '../../services/ai-security.service';
import { SecurityScan, SecurityThreat } from '../../../../shared/models/security.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-security-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
    StatusBadgeComponent
  ],
  template: `
    <div class="security-dashboard">
      <mat-card>
        <mat-card-header>
          <mat-card-title>AI Security Dashboard</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <app-loading-spinner *ngIf="loading" message="Loading security data..."></app-loading-spinner>
          <app-error-display *ngIf="error && !loading" [title]="'Failed to Load Security Data'" [message]="error"></app-error-display>

          <div *ngIf="!loading" class="security-overview">
            <div class="metric-card">
              <div class="metric-value">{{ totalThreats }}</div>
              <div class="metric-label">Total Threats</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{ criticalThreats }}</div>
              <div class="metric-label">Critical Threats</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{ averageScore.toFixed(0) }}</div>
              <div class="metric-label">Avg Security Score</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{ totalScans }}</div>
              <div class="metric-label">Total Scans</div>
            </div>
          </div>

          <div class="threats-section" *ngIf="!loading">
            <h3>Recent Threats</h3>
            <table mat-table [dataSource]="recentThreats" *ngIf="recentThreats.length > 0">
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let threat">{{ threat.type }}</td>
              </ng-container>
              <ng-container matColumnDef="severity">
                <th mat-header-cell *matHeaderCellDef>Severity</th>
                <td mat-cell *matCellDef="let threat">
                  <app-status-badge [status]="threat.severity"></app-status-badge>
                </td>
              </ng-container>
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let threat">{{ threat.description }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="['type', 'severity', 'description']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['type', 'severity', 'description']"></tr>
            </table>
            <p *ngIf="recentThreats.length === 0">No threats detected</p>
          </div>

          <div class="scans-section" *ngIf="!loading">
            <h3>Recent Security Scans</h3>
            <table mat-table [dataSource]="recentScans" *ngIf="recentScans.length > 0">
              <ng-container matColumnDef="traceId">
                <th mat-header-cell *matHeaderCellDef>Trace ID</th>
                <td mat-cell *matCellDef="let scan">
                  <a [routerLink]="['/observability/traces', scan.traceId]">{{ scan.traceId }}</a>
                </td>
              </ng-container>
              <ng-container matColumnDef="score">
                <th mat-header-cell *matHeaderCellDef>Score</th>
                <td mat-cell *matCellDef="let scan">{{ scan.score }}/100</td>
              </ng-container>
              <ng-container matColumnDef="threats">
                <th mat-header-cell *matHeaderCellDef>Threats</th>
                <td mat-cell *matCellDef="let scan">{{ scan.threats.length }}</td>
              </ng-container>
              <ng-container matColumnDef="timestamp">
                <th mat-header-cell *matHeaderCellDef>Timestamp</th>
                <td mat-cell *matCellDef="let scan">{{ scan.timestamp | date:'short' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="['traceId', 'score', 'threats', 'timestamp']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['traceId', 'score', 'threats', 'timestamp']"></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .security-dashboard { padding: 20px; }
    .security-overview {
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
    .threats-section, .scans-section {
      margin-top: 24px;
    }
    a {
      color: #6366f1;
      text-decoration: none;
    }
  `]
})
export class SecurityDashboardComponent implements OnInit {
  recentScans: SecurityScan[] = [];
  recentThreats: SecurityThreat[] = [];
  loading = false;
  error: string | null = null;

  get totalThreats(): number {
    return this.recentThreats.length;
  }

  get criticalThreats(): number {
    return this.recentThreats.filter(t => t.severity === 'critical').length;
  }

  get averageScore(): number {
    if (this.recentScans.length === 0) return 100;
    const sum = this.recentScans.reduce((acc, scan) => acc + scan.score, 0);
    return sum / this.recentScans.length;
  }

  get totalScans(): number {
    return this.recentScans.length;
  }

  constructor(private securityService: AISecurityService) {}

  ngOnInit(): void {
    this.loadSecurityData();
  }

  loadSecurityData(): void {
    this.loading = true;
    this.securityService.getSecurityScans({}).subscribe({
      next: (scans) => {
        this.recentScans = scans.slice(0, 10);
        // Extract threats from scans
        this.recentThreats = scans
          .flatMap(scan => scan.threats)
          .sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
          })
          .slice(0, 10);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }
}

