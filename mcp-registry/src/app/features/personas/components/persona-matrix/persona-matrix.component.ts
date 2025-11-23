import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PersonaService } from '../../services/persona.service';
import { ToolService } from '../../../tools/services/tool.service';
import { Tool } from '../../../../shared/models/tool.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-persona-matrix',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="persona-matrix">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Agent Persona Access Matrix</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <app-loading-spinner *ngIf="loading" message="Loading persona data..."></app-loading-spinner>

          <div *ngIf="!loading">
            <div class="matrix-controls">
              <button mat-raised-button color="primary" (click)="saveAccessRules()">
                <mat-icon>save</mat-icon>
                Save Access Rules
              </button>
            </div>

            <div class="matrix-container">
              <table mat-table [dataSource]="matrixData" class="matrix-table">
                <ng-container matColumnDef="tool">
                  <th mat-header-cell *matHeaderCellDef>Tool</th>
                  <td mat-cell *matCellDef="let row">
                    <a [routerLink]="['/tools', row.toolId]">{{ row.toolName }}</a>
                  </td>
                </ng-container>

                <ng-container *ngFor="let persona of personas" [matColumnDef]="persona">
                  <th mat-header-cell *matHeaderCellDef>{{ persona }}</th>
                  <td mat-cell *matCellDef="let row">
                    <mat-checkbox 
                      [checked]="row.access[persona]"
                      (change)="toggleAccess(row.toolId, persona, $event.checked)">
                    </mat-checkbox>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
              </table>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .persona-matrix {
      padding: 20px;
    }
    .matrix-controls {
      margin-bottom: 24px;
    }
    .matrix-container {
      overflow-x: auto;
    }
    .matrix-table {
      width: 100%;
      min-width: 600px;
    }
    .matrix-table a {
      text-decoration: none;
      color: inherit;
    }
    .matrix-table a:hover {
      text-decoration: underline;
    }
  `]
})
export class PersonaMatrixComponent implements OnInit {
  tools: Tool[] = [];
  personas: string[] = ['finance-agent', 'junior-agent', 'senior-agent', 'admin-agent'];
  matrixData: any[] = [];
  loading: boolean = false;
  displayedColumns: string[] = ['tool'];

  constructor(
    private personaService: PersonaService,
    private toolService: ToolService
  ) {
    this.displayedColumns = ['tool', ...this.personas];
  }

  ngOnInit(): void {
    this.loadTools();
  }

  loadTools(): void {
    this.loading = true;
    this.toolService.getTools({ limit: 1000 }).subscribe({
      next: (response: any) => {
        this.tools = response.tools;
        this.buildMatrix();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading tools:', err);
        this.loading = false;
      }
    });
  }

  buildMatrix(): void {
    this.matrixData = this.tools.map(tool => ({
      toolId: tool.toolId,
      toolName: tool.name,
      access: this.personas.reduce((acc, persona) => {
        acc[persona] = tool.agentPersonaRules?.[persona] || false;
        return acc;
      }, {} as Record<string, boolean>)
    }));
  }

  toggleAccess(toolId: string, persona: string, allowed: boolean): void {
    const row = this.matrixData.find(r => r.toolId === toolId);
    if (row) {
      row.access[persona] = allowed;
    }
  }

  saveAccessRules(): void {
    const updates = this.matrixData.map(row => ({
      toolId: row.toolId,
      agentPersonaRules: row.access
    }));

    // Save all updates
    console.log('Saving access rules:', updates);
    // In production, this would call the API to update each tool
  }
}

