import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { DashboardService, DashboardMetrics, RecentActivity, DashboardAlert } from '../../services/dashboard.service';
import { MetricsCardComponent } from '../metrics-card/metrics-card.component';
import { QuickActionsComponent } from '../quick-actions/quick-actions.component';
import { ActivityFeedComponent } from '../activity-feed/activity-feed.component';
import { AlertsPanelComponent } from '../alerts-panel/alerts-panel.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatGridListModule,
    MetricsCardComponent,
    QuickActionsComponent,
    ActivityFeedComponent,
    AlertsPanelComponent,
    LoadingSpinnerComponent,
    ErrorDisplayComponent
  ],
  template: `
    <div class="dashboard-container">
      <app-loading-spinner *ngIf="loading" message="Loading dashboard..."></app-loading-spinner>
      <app-error-display 
        *ngIf="error && !loading" 
        [title]="'Failed to Load Dashboard'"
        [message]="error"
        [showRetry]="true"
        (onRetry)="loadDashboard()">
      </app-error-display>

      <div *ngIf="!loading && !error" class="dashboard-content">
        <h1 class="dashboard-title">MCP Registry Dashboard</h1>

        <!-- Key Metrics -->
        <div class="metrics-grid">
          <app-metrics-card
            label="Total Tools"
            [value]="metrics.totalTools"
            icon="build"
            iconClass="icon-tools">
          </app-metrics-card>

          <app-metrics-card
            label="Production Tools"
            [value]="metrics.productionTools"
            icon="check_circle"
            iconClass="icon-production"
            trend="up">
          </app-metrics-card>

          <app-metrics-card
            label="Average Quality Score"
            [value]="formatQualityScore(metrics.averageQualityScore)"
            icon="assessment"
            iconClass="icon-quality">
          </app-metrics-card>

          <app-metrics-card
            label="Active Bundles"
            [value]="metrics.activeBundles"
            icon="inventory_2"
            iconClass="icon-bundles">
          </app-metrics-card>

          <app-metrics-card
            label="Tools Needing Attention"
            [value]="metrics.toolsNeedingAttention"
            icon="warning"
            iconClass="icon-warning"
            [trend]="metrics.toolsNeedingAttention > 0 ? 'down' : undefined">
          </app-metrics-card>

          <app-metrics-card
            label="System Health"
            [value]="metrics.systemHealth"
            icon="health_and_safety"
            [iconClass]="'icon-health-' + metrics.systemHealth">
          </app-metrics-card>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions-section">
          <app-quick-actions></app-quick-actions>
        </div>

        <!-- Main Content Grid -->
        <div class="dashboard-grid">
          <!-- Left Column -->
          <div class="dashboard-column">
            <app-activity-feed [activities]="recentActivity"></app-activity-feed>
          </div>

          <!-- Right Column -->
          <div class="dashboard-column">
            <app-alerts-panel [alerts]="alerts"></app-alerts-panel>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
    }
    .dashboard-title {
      margin: 0 0 24px 0;
      color: #e1bee7;
      font-size: 32px;
      font-weight: 500;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .quick-actions-section {
      margin-bottom: 24px;
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .dashboard-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    @media (max-width: 960px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
      .metrics-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  metrics: DashboardMetrics = {
    totalTools: 0,
    productionTools: 0,
    stagingTools: 0,
    developmentTools: 0,
    deprecatedTools: 0,
    averageQualityScore: 0,
    activeBundles: 0,
    toolsNeedingAttention: 0,
    systemHealth: 'healthy'
  };
  recentActivity: RecentActivity[] = [];
  alerts: DashboardAlert[] = [];
  loading: boolean = false;
  error: string | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = null;

    // Load metrics
    this.dashboardService.getMetrics().subscribe({
      next: (metrics) => {
        this.metrics = metrics;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading metrics:', err);
        this.error = 'Failed to load dashboard metrics';
        this.loading = false;
      }
    });

    // Load recent activity
    this.dashboardService.getRecentActivity().subscribe({
      next: (activity) => {
        this.recentActivity = activity;
      },
      error: (err) => {
        console.error('Error loading activity:', err);
      }
    });

    // Load alerts
    this.dashboardService.getAlerts().subscribe({
      next: (data) => {
        this.alerts = this.generateAlerts(data);
      },
      error: (err) => {
        console.error('Error loading alerts:', err);
      }
    });
  }

  formatQualityScore(score: number): string {
    return score > 0 ? score.toFixed(1) : 'N/A';
  }

  private generateAlerts(data: any): DashboardAlert[] {
    const alerts: DashboardAlert[] = [];

    // Orphan tools alert
    if (data.orphans && data.orphans.length > 0) {
      alerts.push({
        id: 'orphans',
        type: 'orphan_tool',
        severity: 'warning',
        title: `${data.orphans.length} Orphan Tool(s)`,
        message: 'Tools without an owner team need attention',
        actionUrl: '/retirement'
      });
    }

    // Tools needing promotion
    if (data.tools && data.tools.tools) {
      const stagingTools = data.tools.tools.filter((t: any) => 
        t.lifecycleState === 'staging' || t.lifecycleState === 'pilot'
      );
      if (stagingTools.length > 0) {
        alerts.push({
          id: 'promotions',
          type: 'promotion_needed',
          severity: 'info',
          title: `${stagingTools.length} Tool(s) Ready for Promotion`,
          message: 'Tools in staging/pilot may be ready for production',
          actionUrl: '/lifecycle'
        });
      }
    }

    return alerts;
  }
}

