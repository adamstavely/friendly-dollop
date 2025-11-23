import { Component, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="error-container">
      <mat-card>
        <mat-card-content>
          <div class="error-content">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <h3>{{ title || 'An Error Occurred' }}</h3>
            <p>{{ message || 'Something went wrong. Please try again.' }}</p>
            <button *ngIf="showRetry" mat-raised-button color="primary" (click)="onRetry.emit()">
              <mat-icon>refresh</mat-icon>
              Retry
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .error-container {
      padding: 20px;
    }
    .error-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 16px;
      padding: 20px;
    }
    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
    }
    .error-content h3 {
      margin: 0;
      color: #333;
    }
    .error-content p {
      margin: 0;
      color: #666;
    }
  `]
})
export class ErrorDisplayComponent {
  @Input() title?: string;
  @Input() message?: string;
  @Input() showRetry: boolean = false;
  @Output() onRetry = new EventEmitter<void>();
}

