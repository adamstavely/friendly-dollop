import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { AISecurityService } from '../../services/ai-security.service';
import { SecurityScan } from '../../../../shared/models/security.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-security-scan',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, StatusBadgeComponent],
  template: `
    <div class="scan-container">
      <mat-card *ngIf="scan">
        <mat-card-header>
          <mat-card-title>Security Scan: {{ scan.traceId }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="scan-score">
            <h2>Security Score: {{ scan.score }}/100</h2>
          </div>
          <div class="threats">
            <h3>Threats ({{ scan.threats.length }})</h3>
            <div *ngFor="let threat of scan.threats" class="threat-item">
              <app-status-badge [status]="threat.severity"></app-status-badge>
              <strong>{{ threat.type }}</strong>: {{ threat.description }}
            </div>
          </div>
          <div class="recommendations">
            <h3>Recommendations</h3>
            <ul>
              <li *ngFor="let rec of scan.recommendations">{{ rec }}</li>
            </ul>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .scan-container { padding: 20px; }
    .threat-item { margin: 8px 0; }
    .recommendations ul { margin: 8px 0; }
  `]
})
export class SecurityScanComponent implements OnInit {
  scan: SecurityScan | null = null;

  constructor(
    private route: ActivatedRoute,
    private securityService: AISecurityService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // For now, we'll need to get scan by traceId
      // In real implementation, would have scan ID
      this.securityService.getSecurityScans().subscribe({
        next: (scans) => {
          this.scan = scans.find(s => s.id === id) || null;
        }
      });
    }
  }
}

