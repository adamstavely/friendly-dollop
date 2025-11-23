import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-schema-viewer',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="schema-viewer">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Schema Visualization</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Schema diagrams and visualization will be displayed here.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .schema-viewer {
      padding: 20px;
    }
  `]
})
export class SchemaViewerComponent {}

