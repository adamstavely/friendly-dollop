import { Component, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state-container">
      <mat-card>
        <mat-card-content>
          <div class="empty-content">
            <mat-icon class="empty-icon">{{ icon || 'inbox' }}</mat-icon>
            <h3>{{ title || 'No Data' }}</h3>
            <p>{{ message || 'There is no data to display.' }}</p>
            <button *ngIf="actionLabel" mat-raised-button color="primary" (click)="onAction.emit()">
              {{ actionLabel }}
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .empty-state-container {
      padding: 20px;
    }
    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 16px;
      padding: 40px 20px;
    }
    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
    }
    .empty-content h3 {
      margin: 0;
      color: #666;
    }
    .empty-content p {
      margin: 0;
      color: #999;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon?: string;
  @Input() title?: string;
  @Input() message?: string;
  @Input() actionLabel?: string;
  @Output() onAction = new EventEmitter<void>();
}

