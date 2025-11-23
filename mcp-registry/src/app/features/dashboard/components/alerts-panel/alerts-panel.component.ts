import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { DashboardAlert } from '../../services/dashboard.service';

@Component({
  selector: 'app-alerts-panel',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>
          Alerts & Notifications
          <mat-chip *ngIf="alerts && alerts.length > 0" class="alert-count">
            {{ alerts.length }}
          </mat-chip>
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mat-list *ngIf="alerts && alerts.length > 0">
          <mat-list-item *ngFor="let alert of alerts" class="alert-item" [class]="'severity-' + alert.severity">
            <mat-icon matListItemIcon [class]="'icon-' + alert.severity">
              {{ getAlertIcon(alert.type) }}
            </mat-icon>
            <div matListItemTitle>
              <a *ngIf="alert.actionUrl" [routerLink]="alert.actionUrl">
                {{ alert.title }}
              </a>
              <span *ngIf="!alert.actionUrl">{{ alert.title }}</span>
            </div>
            <div matListItemLine>{{ alert.message }}</div>
          </mat-list-item>
        </mat-list>
        <p *ngIf="!alerts || alerts.length === 0" class="empty-message">
          <mat-icon>check_circle</mat-icon>
          No alerts - all systems operational
        </p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .alert-count {
      margin-left: 8px;
    }
    .alert-item {
      border-left: 3px solid transparent;
      margin-bottom: 8px;
    }
    .alert-item.severity-error {
      border-left-color: #f44336;
    }
    .alert-item.severity-warning {
      border-left-color: #ff9800;
    }
    .alert-item.severity-info {
      border-left-color: #2196f3;
    }
    .alert-item mat-icon {
      color: #9575cd;
    }
    .alert-item .icon-error {
      color: #f44336;
    }
    .alert-item .icon-warning {
      color: #ff9800;
    }
    .alert-item .icon-info {
      color: #2196f3;
    }
    .alert-item a {
      color: #e1bee7;
      text-decoration: none;
    }
    .alert-item a:hover {
      text-decoration: underline;
    }
    .empty-message {
      padding: 24px;
      text-align: center;
      color: #b39ddb;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .empty-message mat-icon {
      color: #4caf50;
      font-size: 48px;
      width: 48px;
      height: 48px;
    }
  `]
})
export class AlertsPanelComponent {
  @Input() alerts: DashboardAlert[] = [];

  getAlertIcon(type: string): string {
    const icons: Record<string, string> = {
      'promotion_needed': 'arrow_upward',
      'orphan_tool': 'warning',
      'quality_drop': 'trending_down',
      'compliance_violation': 'error',
      'health_check_failed': 'error_outline'
    };
    return icons[type] || 'info';
  }
}

