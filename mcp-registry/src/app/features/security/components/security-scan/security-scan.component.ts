import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { AISecurityService } from '../../services/ai-security.service';
import { SecurityScan, SecurityThreat, ComplianceCheck } from '../../../../shared/models/security.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-security-scan',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatExpansionModule,
    StatusBadgeComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="scan-container">
      <div class="scan-header">
        <button mat-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Back
        </button>
        <button mat-raised-button color="primary" (click)="rescan()" [disabled]="scanning">
          <mat-icon>refresh</mat-icon>
          Re-scan
        </button>
      </div>

      <app-loading-spinner *ngIf="scanning" message="Scanning trace for security issues..."></app-loading-spinner>

      <mat-card *ngIf="scan && !scanning">
        <mat-card-header>
          <mat-card-title>Security Scan Results</mat-card-title>
          <mat-card-subtitle>
            Trace ID: <a [routerLink]="['/observability/traces', scan.traceId]">{{ scan.traceId }}</a>
            <span class="timestamp">{{ scan.timestamp | date:'medium' }}</span>
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="scan-score">
            <div class="score-display">
              <div class="score-value">{{ scan.score }}</div>
              <div class="score-label">Security Score</div>
            </div>
            <div class="score-bar">
              <div class="score-fill" [style.width.%]="scan.score"></div>
            </div>
          </div>

          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>
                Threats Detected ({{ scan.threats.length }})
              </mat-panel-title>
            </mat-expansion-panel-header>
            <div *ngIf="scan.threats.length === 0" class="empty-state">
              <p>No threats detected</p>
            </div>
            <mat-list *ngIf="scan.threats.length > 0">
              <mat-list-item *ngFor="let threat of scan.threats">
                <div class="threat-item">
                  <div class="threat-header">
                    <app-status-badge [status]="threat.severity"></app-status-badge>
                    <strong>{{ threat.type | titlecase }}</strong>
                    <span class="threat-location" *ngIf="threat.location">{{ threat.location }}</span>
                  </div>
                  <div class="threat-description">{{ threat.description }}</div>
                  <div class="threat-mitigation" *ngIf="threat.mitigation">
                    <strong>Mitigation:</strong> {{ threat.mitigation }}
                  </div>
                  <div class="threat-time">Detected: {{ threat.detectedAt | date:'short' }}</div>
                </div>
              </mat-list-item>
            </mat-list>
          </mat-expansion-panel>

          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>
                Compliance Checks ({{ scan.compliance.length }})
              </mat-panel-title>
            </mat-expansion-panel-header>
            <mat-list>
              <mat-list-item *ngFor="let check of scan.compliance">
                <div class="compliance-item">
                  <app-status-badge [status]="check.status === 'pass' ? 'success' : check.status === 'fail' ? 'error' : 'warning'"></app-status-badge>
                  <div>
                    <strong>{{ check.rule }}</strong>
                    <div>{{ check.description }}</div>
                  </div>
                </div>
              </mat-list-item>
            </mat-list>
          </mat-expansion-panel>

          <div class="recommendations">
            <h3>Recommendations</h3>
            <ul *ngIf="scan.recommendations.length > 0">
              <li *ngFor="let rec of scan.recommendations">{{ rec }}</li>
            </ul>
            <p *ngIf="scan.recommendations.length === 0" class="empty-state">No recommendations</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .scan-container {
      padding: 20px;
    }
    .scan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .scan-score {
      margin-bottom: 24px;
    }
    .score-display {
      text-align: center;
      margin-bottom: 16px;
    }
    .score-value {
      font-size: 48px;
      font-weight: bold;
      color: #6366f1;
    }
    .score-label {
      font-size: 14px;
      color: #666;
      margin-top: 8px;
    }
    .score-bar {
      width: 100%;
      height: 20px;
      background: #e0e0e0;
      border-radius: 10px;
      overflow: hidden;
    }
    .score-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      transition: width 0.3s;
    }
    .threat-item {
      padding: 12px;
      border-left: 4px solid #f44336;
      background: #fff5f5;
      margin-bottom: 8px;
      border-radius: 4px;
    }
    .threat-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .threat-location {
      font-size: 12px;
      color: #666;
      margin-left: auto;
    }
    .threat-description {
      margin: 8px 0;
    }
    .threat-mitigation {
      margin-top: 8px;
      padding: 8px;
      background: #f0f0f0;
      border-radius: 4px;
      font-size: 14px;
    }
    .threat-time {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
    }
    .compliance-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 8px 0;
    }
    .recommendations {
      margin-top: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .recommendations ul {
      margin: 8px 0;
      padding-left: 20px;
    }
    .recommendations li {
      margin: 4px 0;
    }
    .timestamp {
      margin-left: 16px;
      color: #666;
      font-size: 14px;
    }
    .empty-state {
      padding: 20px;
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
  `]
})
export class SecurityScanComponent implements OnInit {
  scan: SecurityScan | null = null;
  scanning = false;
  traceId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private securityService: AISecurityService
  ) {}

  ngOnInit(): void {
    this.traceId = this.route.snapshot.paramMap.get('id');
    if (this.traceId) {
      this.performScan();
    }
  }

  performScan(): void {
    if (!this.traceId) return;
    
    this.scanning = true;
    this.securityService.scanTrace(this.traceId).subscribe({
      next: (scan) => {
        this.scan = scan;
        this.scanning = false;
      },
      error: (err) => {
        console.error('Error performing security scan:', err);
        this.scanning = false;
      }
    });
  }

  rescan(): void {
    this.performScan();
  }

  goBack(): void {
    if (this.traceId) {
      this.router.navigate(['/observability/traces', this.traceId]);
    } else {
      this.router.navigate(['/security']);
    }
  }
}


