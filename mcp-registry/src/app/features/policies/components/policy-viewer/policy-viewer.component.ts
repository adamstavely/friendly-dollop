import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-policy-viewer',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="policy-viewer">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Policy Viewer</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Policy and rate limit information will be displayed here.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .policy-viewer {
      padding: 20px;
    }
  `]
})
export class PolicyViewerComponent {}

