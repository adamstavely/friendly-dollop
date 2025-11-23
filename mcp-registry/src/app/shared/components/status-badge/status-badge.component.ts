import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  template: `
    <mat-chip [class]="getStatusClass()">
      {{ status }}
    </mat-chip>
  `,
  styles: [`
    mat-chip {
      border-radius: 8px;
      font-weight: 500;
      font-size: 12px;
      padding: 4px 12px;
      border: none;
    }
    .healthy { 
      background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
      color: white; 
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
    }
    .unhealthy { 
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
      color: white; 
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
    }
    .unknown { 
      background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); 
      color: white; 
      box-shadow: 0 2px 4px rgba(107, 114, 128, 0.2);
    }
    .deprecated { 
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
      color: white; 
      box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
    }
    .active {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
    }
    .draft {
      background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(107, 114, 128, 0.2);
    }
    .archived {
      background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(156, 163, 175, 0.2);
    }
    .running {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
    }
    .completed {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
    }
    .failed {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
    }
    .cancelled {
      background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(107, 114, 128, 0.2);
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status: string = 'unknown';

  getStatusClass(): string {
    return this.status.toLowerCase();
  }
}

