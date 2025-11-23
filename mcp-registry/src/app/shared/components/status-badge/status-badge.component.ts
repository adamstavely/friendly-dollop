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
    .healthy { 
      background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); 
      color: white; 
    }
    .unhealthy { 
      background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); 
      color: white; 
    }
    .unknown { 
      background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%); 
      color: white; 
    }
    .deprecated { 
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); 
      color: white; 
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status: string = 'unknown';

  getStatusClass(): string {
    return this.status.toLowerCase();
  }
}

