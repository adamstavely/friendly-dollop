import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { SchemaService } from '../../services/schema.service';
import { ToolService } from '../../../tools/services/tool.service';
import { SchemaDiagramComponent } from '../schema-diagram/schema-diagram.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-schema-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTabsModule,
    FormsModule,
    SchemaDiagramComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="schema-viewer">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Schema Visualization</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="tool-selector">
            <mat-form-field>
              <mat-label>Select Tool</mat-label>
              <mat-select [(ngModel)]="selectedToolId" (selectionChange)="loadSchema()">
                <mat-option *ngFor="let tool of tools" [value]="tool.toolId">
                  {{ tool.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <app-loading-spinner *ngIf="loading" message="Loading schema..."></app-loading-spinner>

          <div *ngIf="schema && !loading">
            <mat-tab-group>
              <mat-tab label="JSON Schema">
                <pre>{{ schema | json }}</pre>
              </mat-tab>
              <mat-tab label="Diagram">
                <app-schema-diagram [schema]="schema"></app-schema-diagram>
              </mat-tab>
            </mat-tab-group>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .schema-viewer {
      padding: 20px;
    }
    .tool-selector {
      margin-bottom: 24px;
    }
    pre {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
    }
  `]
})
export class SchemaViewerComponent implements OnInit {
  tools: any[] = [];
  selectedToolId: string = '';
  schema: any = null;
  loading: boolean = false;

  constructor(
    private schemaService: SchemaService,
    private toolService: ToolService
  ) {}

  ngOnInit(): void {
    this.loadTools();
  }

  loadTools(): void {
    this.toolService.getTools({ limit: 1000 }).subscribe({
      next: (response: any) => {
        this.tools = response.tools;
        if (this.tools.length > 0) {
          this.selectedToolId = this.tools[0].toolId;
          this.loadSchema();
        }
      },
      error: (err: any) => {
        console.error('Error loading tools:', err);
      }
    });
  }

  loadSchema(): void {
    if (!this.selectedToolId) return;

    this.loading = true;
    this.schemaService.getSchema(this.selectedToolId).subscribe({
      next: (schema) => {
        this.schema = schema;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading schema:', err);
        this.loading = false;
      }
    });
  }
}

