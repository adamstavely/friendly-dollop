import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-metrics-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <mat-card class="metrics-card" [class.trend-up]="trend === 'up'" [class.trend-down]="trend === 'down'">
      <mat-card-content>
        <div class="metrics-header">
          <mat-icon [class]="iconClass">{{ icon }}</mat-icon>
          <span class="metrics-label">{{ label }}</span>
        </div>
        <div class="metrics-value">{{ value }}</div>
        <div class="metrics-trend" *ngIf="trend">
          <mat-icon *ngIf="trend === 'up'" class="trend-icon up">trending_up</mat-icon>
          <mat-icon *ngIf="trend === 'down'" class="trend-icon down">trending_down</mat-icon>
          <span *ngIf="trendValue">{{ trendValue }}</span>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .metrics-card {
      height: 100%;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .metrics-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(74, 20, 140, 0.3);
    }
    .metrics-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .metrics-header mat-icon {
      color: #9575cd;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .metrics-label {
      font-size: 14px;
      color: #b39ddb;
      font-weight: 500;
    }
    .metrics-value {
      font-size: 32px;
      font-weight: 600;
      color: #e1bee7;
      margin-bottom: 8px;
    }
    .metrics-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #b39ddb;
    }
    .trend-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .trend-icon.up {
      color: #4caf50;
    }
    .trend-icon.down {
      color: #f44336;
    }
    .metrics-card.trend-up {
      border-left: 3px solid #4caf50;
    }
    .metrics-card.trend-down {
      border-left: 3px solid #f44336;
    }
  `]
})
export class MetricsCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = 0;
  @Input() icon: string = 'info';
  @Input() iconClass: string = '';
  @Input() trend?: 'up' | 'down';
  @Input() trendValue?: string;
}

