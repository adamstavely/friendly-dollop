import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ComplianceService } from '../../services/compliance.service';
import { ToolService } from '../../../tools/services/tool.service';
import { Tool } from '../../../../shared/models/tool.model';
import { ComplianceTagsComponent } from '../../../../shared/components/compliance-tags/compliance-tags.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-compliance-viewer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    ComplianceTagsComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="compliance-viewer">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Compliance Management</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="compliance-summary">
            <mat-chip>PII: {{ getCountByTag('PII') }}</mat-chip>
            <mat-chip>PHI: {{ getCountByTag('PHI') }}</mat-chip>
            <mat-chip>HIPAA: {{ getCountByTag('HIPAA') }}</mat-chip>
            <mat-chip>PCI: {{ getCountByTag('PCI') }}</mat-chip>
            <mat-chip>Internal-Only: {{ getCountByTag('Internal-Only') }}</mat-chip>
          </div>

          <app-loading-spinner *ngIf="loading" message="Loading compliance data..."></app-loading-spinner>

          <div *ngIf="!loading">
            <h3>Tools by Compliance Tag</h3>
            <table mat-table [dataSource]="tools" class="compliance-table">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Tool Name</th>
                <td mat-cell *matCellDef="let tool">
                  <a [routerLink]="['/tools', tool.toolId]">{{ tool.name }}</a>
                </td>
              </ng-container>

              <ng-container matColumnDef="compliance">
                <th mat-header-cell *matHeaderCellDef>Compliance Tags</th>
                <td mat-cell *matCellDef="let tool">
                  <app-compliance-tags [tags]="tool.complianceTags || []"></app-compliance-tags>
                </td>
              </ng-container>

              <ng-container matColumnDef="securityClass">
                <th mat-header-cell *matHeaderCellDef>Security Class</th>
                <td mat-cell *matCellDef="let tool">
                  <mat-chip>{{ tool.securityClass }}</mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let tool">
                  <button mat-button (click)="scanTool(tool)">
                    <mat-icon>scanner</mat-icon>
                    Scan
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .compliance-viewer {
      padding: 20px;
    }
    .compliance-summary {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }
    .compliance-table {
      width: 100%;
    }
    .compliance-table a {
      text-decoration: none;
      color: inherit;
    }
    .compliance-table a:hover {
      text-decoration: underline;
    }
    h3 {
      margin-top: 24px;
      margin-bottom: 12px;
    }
  `]
})
export class ComplianceViewerComponent implements OnInit {
  tools: Tool[] = [];
  loading: boolean = false;
  displayedColumns: string[] = ['name', 'compliance', 'securityClass', 'actions'];

  constructor(
    private complianceService: ComplianceService,
    private toolService: ToolService
  ) {}

  ngOnInit(): void {
    this.loadTools();
  }

  loadTools(): void {
    this.loading = true;
    this.toolService.getTools({ limit: 1000 }).subscribe({
      next: (response: any) => {
        this.tools = response.tools;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading tools:', err);
        this.loading = false;
      }
    });
  }

  getCountByTag(tag: string): number {
    return this.tools.filter(t => 
      t.complianceTags && t.complianceTags.includes(tag)
    ).length;
  }

  scanTool(tool: Tool): void {
    this.complianceService.scanTool(tool.toolId).subscribe({
      next: (result) => {
        console.log('Compliance scan result:', result);
        // Refresh tools to show updated compliance tags
        this.loadTools();
      },
      error: (err: any) => {
        console.error('Error scanning tool:', err);
      }
    });
  }
}

