import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { PromptService } from '../../services/prompt.service';
import { LangFusePrompt } from '../../../../shared/models/langfuse.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-prompt-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatTableModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="prompt-analytics">
      <app-loading-spinner *ngIf="loading" message="Loading analytics..."></app-loading-spinner>

      <div *ngIf="prompt && !loading">
        <mat-card>
          <mat-card-header>
            <div class="header-content">
              <div>
                <mat-card-title>Performance Analytics: {{ prompt.name }}</mat-card-title>
                <mat-card-subtitle>Version {{ prompt.version }}</mat-card-subtitle>
              </div>
              <div class="header-actions">
                <mat-form-field>
                  <mat-label>From Date</mat-label>
                  <input matInput [matDatepicker]="fromPicker" [(ngModel)]="fromDate" (dateChange)="loadAnalytics()">
                  <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
                  <mat-datepicker #fromPicker></mat-datepicker>
                </mat-form-field>
                <mat-form-field>
                  <mat-label>To Date</mat-label>
                  <input matInput [matDatepicker]="toPicker" [(ngModel)]="toDate" (dateChange)="loadAnalytics()">
                  <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
                  <mat-datepicker #toPicker></mat-datepicker>
                </mat-form-field>
                <button mat-raised-button (click)="loadAnalytics()">
                  <mat-icon>refresh</mat-icon>
                  Refresh
                </button>
              </div>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="analytics" class="analytics-content">
              <div class="summary-stats">
                <div class="stat-card">
                  <div class="stat-value">{{ analytics.totalExecutions }}</div>
                  <div class="stat-label">Total Executions</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">{{ analytics.averageLatency.toFixed(0) }}ms</div>
                  <div class="stat-label">Avg Latency</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${{ analytics.totalCost.toFixed(4) }}</div>
                  <div class="stat-label">Total Cost</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${{ analytics.averageCost.toFixed(4) }}</div>
                  <div class="stat-label">Avg Cost</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">{{ (analytics.successRate * 100).toFixed(1) }}%</div>
                  <div class="stat-label">Success Rate</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">{{ (analytics.errorRate * 100).toFixed(1) }}%</div>
                  <div class="stat-label">Error Rate</div>
                </div>
              </div>

              <mat-tab-group>
                <mat-tab label="Performance Trends">
                  <div class="tab-content">
                    <div class="chart-placeholder">
                      <p>Performance trends chart would be displayed here</p>
                      <p class="chart-note">Latency and cost trends over time</p>
                    </div>
                  </div>
                </mat-tab>

                <mat-tab label="Version Performance">
                  <div class="tab-content">
                    <table mat-table [dataSource]="analytics.versionPerformance || []" *ngIf="analytics.versionPerformance && analytics.versionPerformance.length > 0">
                      <ng-container matColumnDef="version">
                        <th mat-header-cell *matHeaderCellDef>Version</th>
                        <td mat-cell *matCellDef="let item">v{{ item.version }}</td>
                      </ng-container>

                      <ng-container matColumnDef="executions">
                        <th mat-header-cell *matHeaderCellDef>Executions</th>
                        <td mat-cell *matCellDef="let item">{{ item.executions }}</td>
                      </ng-container>

                      <ng-container matColumnDef="avgLatency">
                        <th mat-header-cell *matHeaderCellDef>Avg Latency</th>
                        <td mat-cell *matCellDef="let item">{{ item.avgLatency.toFixed(0) }}ms</td>
                      </ng-container>

                      <ng-container matColumnDef="avgCost">
                        <th mat-header-cell *matHeaderCellDef>Avg Cost</th>
                        <td mat-cell *matCellDef="let item">${{ item.avgCost.toFixed(4) }}</td>
                      </ng-container>

                      <ng-container matColumnDef="successRate">
                        <th mat-header-cell *matHeaderCellDef>Success Rate</th>
                        <td mat-cell *matCellDef="let item">{{ (item.successRate * 100).toFixed(1) }}%</td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="versionColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: versionColumns"></tr>
                    </table>
                    <div *ngIf="!analytics.versionPerformance || analytics.versionPerformance.length === 0" class="empty-state">
                      <p>No version performance data available</p>
                    </div>
                  </div>
                </mat-tab>

                <mat-tab label="Cost Breakdown">
                  <div class="tab-content">
                    <div class="cost-breakdown">
                      <div class="cost-item">
                        <span class="cost-label">Total Cost:</span>
                        <span class="cost-value">${{ analytics.totalCost.toFixed(4) }}</span>
                      </div>
                      <div class="cost-item">
                        <span class="cost-label">Average Cost per Execution:</span>
                        <span class="cost-value">${{ analytics.averageCost.toFixed(4) }}</span>
                      </div>
                      <div class="cost-item">
                        <span class="cost-label">Estimated Monthly Cost (if current rate continues):</span>
                        <span class="cost-value">${{ estimatedMonthlyCost.toFixed(2) }}</span>
                      </div>
                    </div>
                  </div>
                </mat-tab>
              </mat-tab-group>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .prompt-analytics {
      padding: 20px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .header-actions mat-form-field {
      width: 150px;
    }
    .analytics-content {
      margin-top: 24px;
    }
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
    .tab-content {
      padding: 20px;
    }
    .chart-placeholder {
      padding: 40px;
      text-align: center;
      background: #f9fafb;
      border-radius: 8px;
      color: #666;
    }
    .chart-note {
      font-size: 12px;
      color: #999;
      margin-top: 8px;
    }
    .version-columns {
      display: table-column;
    }
    .empty-state {
      padding: 40px;
      text-align: center;
      color: #999;
    }
    .cost-breakdown {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .cost-item {
      display: flex;
      justify-content: space-between;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .cost-label {
      font-weight: 500;
    }
    .cost-value {
      font-size: 18px;
      font-weight: bold;
      color: #6366f1;
    }
  `]
})
export class PromptAnalyticsComponent implements OnInit {
  prompt: LangFusePrompt | null = null;
  loading = false;
  analytics: any = null;
  fromDate: Date | null = null;
  toDate: Date | null = null;
  versionColumns: string[] = ['version', 'executions', 'avgLatency', 'avgCost', 'successRate'];

  constructor(
    private route: ActivatedRoute,
    private promptService: PromptService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPrompt(id);
      this.loadAnalytics(id);
    }
  }

  loadPrompt(id: string): void {
    this.loading = true;
    this.promptService.getPrompt(id).subscribe({
      next: (prompt) => {
        this.prompt = prompt;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading prompt:', err);
        this.loading = false;
      }
    });
  }

  loadAnalytics(promptId?: string): void {
    const id = promptId || this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.loading = true;
    
    const fromTimestamp = this.fromDate ? this.fromDate.toISOString() : undefined;
    const toTimestamp = this.toDate ? this.toDate.toISOString() : undefined;

    this.promptService.getPromptAnalytics(id, fromTimestamp, toTimestamp).subscribe({
      next: (analytics) => {
        this.analytics = analytics;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading analytics:', err);
        this.loading = false;
      }
    });
  }

  get estimatedMonthlyCost(): number {
    if (!this.analytics || this.analytics.totalExecutions === 0) return 0;
    
    // Estimate based on average daily executions
    const daysInMonth = 30;
    const avgDailyExecutions = this.analytics.totalExecutions / daysInMonth;
    return this.analytics.averageCost * avgDailyExecutions * daysInMonth;
  }
}

