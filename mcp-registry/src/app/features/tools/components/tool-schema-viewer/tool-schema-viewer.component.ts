import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { SchemaDiagramComponent } from '../../../schema/components/schema-diagram/schema-diagram.component';

@Component({
  selector: 'app-tool-schema-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    SchemaDiagramComponent
  ],
  template: `
    <div class="schema-viewer-container">
      <mat-tab-group>
        <mat-tab label="JSON Schema">
          <pre>{{ schemaJson | json }}</pre>
        </mat-tab>
        <mat-tab label="OpenAPI">
          <pre *ngIf="openApiJson">{{ openApiJson | json }}</pre>
          <p *ngIf="!openApiJson">No OpenAPI specification available</p>
        </mat-tab>
        <mat-tab label="Diagram">
          <app-schema-diagram [schema]="schemaJson"></app-schema-diagram>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .schema-viewer-container {
      padding: 16px;
    }
    pre {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
    }
  `]
})
export class ToolSchemaViewerComponent {
  @Input() schemaJson: any;
  @Input() openApiJson: any;
}

