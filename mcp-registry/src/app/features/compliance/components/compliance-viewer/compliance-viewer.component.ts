import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-compliance-viewer',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="compliance-viewer">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Compliance Management</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Compliance tags and regulatory classifications will be displayed here.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .compliance-viewer {
      padding: 20px;
    }
  `]
})
export class ComplianceViewerComponent {}

