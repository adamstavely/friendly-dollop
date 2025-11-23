import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { RecentActivity } from '../../services/dashboard.service';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatChipsModule,
    DatePipe
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Recent Activity</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mat-list *ngIf="activities && activities.length > 0">
          <mat-list-item *ngFor="let activity of activities" class="activity-item">
            <mat-icon matListItemIcon [class]="getActivityIconClass(activity.type)">
              {{ getActivityIcon(activity.type) }}
            </mat-icon>
            <div matListItemTitle>
              <a *ngIf="activity.toolId" [routerLink]="['/tools', activity.toolId]">
                {{ activity.message }}
              </a>
              <span *ngIf="!activity.toolId">{{ activity.message }}</span>
            </div>
            <div matListItemLine class="activity-meta">
              <span>{{ activity.timestamp | date:'short' }}</span>
              <span *ngIf="activity.user"> • {{ activity.user }}</span>
            </div>
          </mat-list-item>
        </mat-list>
        <p *ngIf="!activities || activities.length === 0" class="empty-message">
          No recent activity
        </p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .activity-item {
      border-bottom: 1px solid rgba(74, 20, 140, 0.2);
    }
    .activity-item:last-child {
      border-bottom: none;
    }
    .activity-item mat-icon {
      color: #9575cd;
    }
    .activity-item a {
      color: #e1bee7;
      text-decoration: none;
    }
    .activity-item a:hover {
      text-decoration: underline;
    }
    .activity-meta {
      font-size: 12px;
      color: #b39ddb;
      margin-top: 4px;
    }
    .empty-message {
      padding: 24px;
      text-align: center;
      color: #b39ddb;
    }
    .icon-created { color: #4caf50; }
    .icon-updated { color: #2196f3; }
    .icon-promoted { color: #ff9800; }
    .icon-quality { color: #9c27b0; }
    .icon-compliance { color: #f44336; }
  `]
})
export class ActivityFeedComponent {
  @Input() activities: RecentActivity[] = [];

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      'tool_created': 'add_circle',
      'tool_updated': 'edit',
      'tool_promoted': 'arrow_upward',
      'quality_updated': 'assessment',
      'compliance_scan': 'verified'
    };
    return icons[type] || 'info';
  }

  getActivityIconClass(type: string): string {
    const classes: Record<string, string> = {
      'tool_created': 'icon-created',
      'tool_updated': 'icon-updated',
      'tool_promoted': 'icon-promoted',
      'quality_updated': 'icon-quality',
      'compliance_scan': 'icon-compliance'
    };
    return classes[type] || '';
  }
}

