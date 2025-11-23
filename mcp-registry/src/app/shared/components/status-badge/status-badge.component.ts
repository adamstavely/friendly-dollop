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
    .healthy { background-color: #4caf50; color: white; }
    .unhealthy { background-color: #f44336; color: white; }
    .unknown { background-color: #9e9e9e; color: white; }
    .deprecated { background-color: #ff9800; color: white; }
  `]
})
export class StatusBadgeComponent {
  @Input() status: string = 'unknown';

  getStatusClass(): string {
    return this.status.toLowerCase();
  }
}

