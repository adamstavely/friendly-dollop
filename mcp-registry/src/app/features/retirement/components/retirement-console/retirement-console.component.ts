import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-retirement-console',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="retirement-console">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Retirement Console</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Orphan detection and retirement workflows will be displayed here.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .retirement-console {
      padding: 20px;
    }
  `]
})
export class RetirementConsoleComponent {}

