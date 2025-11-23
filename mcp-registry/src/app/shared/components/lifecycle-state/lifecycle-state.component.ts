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
    .development { 
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); 
      color: white; 
    }
    .staging { 
      background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%); 
      color: white; 
    }
    .pilot { 
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); 
      color: white; 
    }
    .production { 
      background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); 
      color: white; 
    }
    .deprecated { 
      background: linear-gradient(135deg, #ff5722 0%, #d84315 100%); 
      color: white; 
    }
    .retired { 
      background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%); 
      color: white; 
    }
  `]
})
export class LifecycleStateComponent {
  @Input() state: string = 'development';

  getStateClass(): string {
    return this.state.toLowerCase();
  }
}

