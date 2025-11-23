import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { ToolService, ToolSearchParams } from '../../services/tool.service';
import { Tool } from '../../../../shared/models/tool.model';
import { LifecycleStateComponent } from '../../../../shared/components/lifecycle-state/lifecycle-state.component';
import { QualityScoreComponent } from '../../../../shared/components/quality-score/quality-score.component';
import { ComplianceTagsComponent } from '../../../../shared/components/compliance-tags/compliance-tags.component';

@Component({
  selector: 'app-tool-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    LifecycleStateComponent,
    QualityScoreComponent,
    ComplianceTagsComponent
  ],
  template: `
    <div class="tool-list-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>MCP Tools Registry</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="filters">
            <mat-form-field>
              <mat-label>Search</mat-label>
              <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" placeholder="Search tools...">
            </mat-form-field>
            
            <mat-form-field>
              <mat-label>Domain</mat-label>
              <mat-select [(ngModel)]="filters.domain" (selectionChange)="loadTools()">
                <mat-option value="">All</mat-option>
                <mat-option value="search">Search</mat-option>
                <mat-option value="finance">Finance</mat-option>
                <mat-option value="hr">HR</mat-option>
                <mat-option value="platform">Platform</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Lifecycle State</mat-label>
              <mat-select [(ngModel)]="filters.lifecycleState" (selectionChange)="loadTools()">
                <mat-option value="">All</mat-option>
                <mat-option value="development">Development</mat-option>
                <mat-option value="staging">Staging</mat-option>
                <mat-option value="pilot">Pilot</mat-option>
                <mat-option value="production">Production</mat-option>
                <mat-option value="deprecated">Deprecated</mat-option>
                <mat-option value="retired">Retired</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Security Class</mat-label>
              <mat-select [(ngModel)]="filters.securityClass" (selectionChange)="loadTools()">
                <mat-option value="">All</mat-option>
                <mat-option value="public">Public</mat-option>
                <mat-option value="internal">Internal</mat-option>
                <mat-option value="restricted">Restricted</mat-option>
                <mat-option value="highly-restricted">Highly Restricted</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-raised-button color="primary" routerLink="/tools/new">
              <mat-icon>add</mat-icon>
              New Tool
            </button>
          </div>

          <table mat-table [dataSource]="tools" class="tools-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let tool">
                <a [routerLink]="['/tools', tool.toolId]">{{ tool.name }}</a>
              </td>
            </ng-container>

            <ng-container matColumnDef="domain">
              <th mat-header-cell *matHeaderCellDef>Domain</th>
              <td mat-cell *matCellDef="let tool">{{ tool.domain }}</td>
            </ng-container>

            <ng-container matColumnDef="lifecycleState">
              <th mat-header-cell *matHeaderCellDef>State</th>
              <td mat-cell *matCellDef="let tool">
                <app-lifecycle-state [state]="tool.lifecycleState || 'development'"></app-lifecycle-state>
              </td>
            </ng-container>

            <ng-container matColumnDef="qualityScore">
              <th mat-header-cell *matHeaderCellDef>Quality</th>
              <td mat-cell *matCellDef="let tool">
                <app-quality-score [score]="tool.qualityScore || 0"></app-quality-score>
              </td>
            </ng-container>

            <ng-container matColumnDef="securityClass">
              <th mat-header-cell *matHeaderCellDef>Security</th>
              <td mat-cell *matCellDef="let tool">{{ tool.securityClass }}</td>
            </ng-container>

            <ng-container matColumnDef="ownerTeam">
              <th mat-header-cell *matHeaderCellDef>Owner</th>
              <td mat-cell *matCellDef="let tool">{{ tool.ownerTeam }}</td>
            </ng-container>

            <ng-container matColumnDef="compliance">
              <th mat-header-cell *matHeaderCellDef>Compliance</th>
              <td mat-cell *matCellDef="let tool">
                <app-compliance-tags [tags]="tool.complianceTags || []"></app-compliance-tags>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let tool">
                <button mat-icon-button [routerLink]="['/tools', tool.toolId]">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button [routerLink]="['/tools', tool.toolId, 'edit']">
                  <mat-icon>edit</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>

          <mat-paginator
            [length]="total"
            [pageSize]="pageSize"
            [pageIndex]="pageIndex"
            [pageSizeOptions]="[10, 25, 50, 100]"
            (page)="onPageChange($event)">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .tool-list-container {
      padding: 20px;
    }
    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .filters mat-form-field {
      flex: 1;
      min-width: 200px;
    }
    .tools-table {
      width: 100%;
    }
    .tools-table a {
      color: inherit;
      text-decoration: none;
    }
    .tools-table a:hover {
      text-decoration: underline;
    }
  `]
})
export class ToolListComponent implements OnInit {
  tools: Tool[] = [];
  total = 0;
  pageSize = 25;
  pageIndex = 0;
  searchQuery = '';
  filters: ToolSearchParams = {};

  displayedColumns: string[] = [
    'name',
    'domain',
    'lifecycleState',
    'qualityScore',
    'securityClass',
    'ownerTeam',
    'compliance',
    'actions'
  ];

  constructor(private toolService: ToolService) {}

  ngOnInit(): void {
    this.loadTools();
  }

  loadTools(): void {
    const params: ToolSearchParams = {
      ...this.filters,
      page: this.pageIndex,
      limit: this.pageSize
    };
    if (this.searchQuery) {
      params.q = this.searchQuery;
    }

    this.toolService.getTools(params).subscribe({
      next: (response) => {
        this.tools = response.tools;
        this.total = response.total;
      },
      error: (err) => {
        console.error('Error loading tools:', err);
      }
    });
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.loadTools();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTools();
  }
}

