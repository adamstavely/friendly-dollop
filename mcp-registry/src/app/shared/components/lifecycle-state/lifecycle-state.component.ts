import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-lifecycle-state',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  template: `
    <mat-chip [class]="getStateClass()">
      {{ state }}
    </mat-chip>
  `,
  styles: [`
    .development { background-color: #2196f3; color: white; }
    .staging { background-color: #9c27b0; color: white; }
    .pilot { background-color: #ff9800; color: white; }
    .production { background-color: #4caf50; color: white; }
    .deprecated { background-color: #ff5722; color: white; }
    .retired { background-color: #9e9e9e; color: white; }
  `]
})
export class LifecycleStateComponent {
  @Input() state: string = 'development';

  getStateClass(): string {
    return this.state.toLowerCase();
  }
}

