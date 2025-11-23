import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { ObservabilityService, TraceFilters } from '../../services/observability.service';
import { LangFuseTrace } from '../../../../shared/models/langfuse.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-trace-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatCheckboxModule,
    MatMenuModule,
    LoadingSpinnerComponent,
    StatusBadgeComponent
  ],
  template: `
    <div class="trace-list-container">
      <mat-card>
        <mat-card-header>
          <div class="header-content">
            <mat-card-title>Traces</mat-card-title>
            <div class="header-actions">
              <button mat-icon-button [matMenuTriggerFor]="exportMenu" [disabled]="selectedTraces.length === 0">
                <mat-icon>download</mat-icon>
              </button>
              <mat-menu #exportMenu="matMenu">
                <button mat-menu-item (click)="exportTracesAs('json')" [disabled]="selectedTraces.length === 0">
                  <mat-icon>code</mat-icon>
                  Export as JSON ({{ selectedTraces.length }})
                </button>
                <button mat-menu-item (click)="exportTracesAs('csv')" [disabled]="selectedTraces.length === 0">
                  <mat-icon>table_chart</mat-icon>
                  Export as CSV ({{ selectedTraces.length }})
                </button>
              </mat-menu>
              <button mat-raised-button color="primary" (click)="refresh()">
                <mat-icon>refresh</mat-icon>
                Refresh
              </button>
            </div>
          </div>
        </mat-card-header>
        <mat-card-content>
          <app-loading-spinner *ngIf="loading" message="Loading traces..."></app-loading-spinner>

          <div *ngIf="!loading" class="filters-section">
            <mat-form-field>
              <mat-label>Search</mat-label>
              <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" placeholder="Search traces...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="filters.status" (selectionChange)="applyFilters()">
                <mat-option value="">All</mat-option>
                <mat-option value="success">Success</mat-option>
                <mat-option value="error">Error</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Workflow</mat-label>
              <input matInput [(ngModel)]="filters.workflowId" (ngModelChange)="applyFilters()" placeholder="Filter by workflow ID">
            </mat-form-field>

            <button mat-button (click)="clearFilters()">Clear Filters</button>
          </div>

          <div *ngIf="!loading" class="table-section">
            <table mat-table [dataSource]="traces" matSort (matSortChange)="onSort($event)" class="traces-table">
              <ng-container matColumnDef="select">
                <th mat-header-cell *matHeaderCellDef>
                  <mat-checkbox (change)="toggleAll($event)" [checked]="isAllSelected()"></mat-checkbox>
                </th>
                <td mat-cell *matCellDef="let trace">
                  <mat-checkbox (change)="toggleSelection(trace)" [checked]="isSelected(trace)"></mat-checkbox>
                </td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="name">Name</th>
                <td mat-cell *matCellDef="let trace">
                  <a [routerLink]="['/observability/traces', trace.id]">{{ trace.name }}</a>
                </td>
              </ng-container>

              <ng-container matColumnDef="timestamp">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="timestamp">Timestamp</th>
                <td mat-cell *matCellDef="let trace">{{ trace.timestamp | date:'short' }}</td>
              </ng-container>

              <ng-container matColumnDef="tags">
                <th mat-header-cell *matHeaderCellDef>Tags</th>
                <td mat-cell *matCellDef="let trace">
                  <mat-chip *ngFor="let tag of trace.tags?.slice(0, 3)">{{ tag }}</mat-chip>
                  <span *ngIf="(trace.tags?.length || 0) > 3">+{{ (trace.tags?.length || 0) - 3 }} more</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let trace">
                  <app-status-badge [status]="getTraceStatus(trace)"></app-status-badge>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let trace">
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item [routerLink]="['/observability/traces', trace.id]">
                      <mat-icon>visibility</mat-icon>
                      View Details
                    </button>
                    <button mat-menu-item [routerLink]="['/security/scan', trace.id!]">
                      <mat-icon>security</mat-icon>
                      Security Scan
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>

            <mat-paginator
              [length]="total"
              [pageSize]="pageSize"
              [pageSizeOptions]="[10, 25, 50, 100]"
              (page)="onPageChange($event)">
            </mat-paginator>
          </div>

          <div *ngIf="!loading && traces.length === 0" class="empty-state">
            <p>No traces found</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .trace-list-container {
      padding: 20px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .header-actions {
      display: flex;
      gap: 8px;
    }
    .filters-section {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      align-items: center;
    }
    .filters-section mat-form-field {
      flex: 1;
      min-width: 200px;
    }
    .table-section {
      margin-top: 24px;
    }
    .traces-table {
      width: 100%;
    }
    .traces-table a {
      color: #6366f1;
      text-decoration: none;
    }
    .traces-table a:hover {
      text-decoration: underline;
    }
    .empty-state {
      padding: 40px;
      text-align: center;
      color: #999;
    }
  `]
})
export class TraceListComponent implements OnInit {
  traces: LangFuseTrace[] = [];
  selectedTraces: LangFuseTrace[] = [];
  loading = false;
  total = 0;
  pageSize = 25;
  pageIndex = 0;
  searchQuery = '';
  filters: TraceFilters = {};
  displayedColumns: string[] = ['select', 'name', 'timestamp', 'tags', 'status', 'actions'];
  sortColumn = 'timestamp';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(private observabilityService: ObservabilityService) {}

  ngOnInit(): void {
    this.loadTraces();
  }

  loadTraces(): void {
    this.loading = true;
    const filters: TraceFilters = {
      ...this.filters,
      limit: this.pageSize,
      page: this.pageIndex
    };

    this.observabilityService.getTraces(filters).subscribe({
      next: (result) => {
        this.traces = result.traces;
        this.total = result.total;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading traces:', err);
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    if (this.searchQuery) {
      this.observabilityService.searchTraces(this.searchQuery).subscribe({
        next: (traces) => {
          this.traces = traces;
          this.total = traces.length;
        }
      });
    } else {
      this.loadTraces();
    }
  }

  applyFilters(): void {
    this.pageIndex = 0;
    this.loadTraces();
  }

  clearFilters(): void {
    this.filters = {};
    this.searchQuery = '';
    this.pageIndex = 0;
    this.loadTraces();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTraces();
  }

  onSort(sort: Sort): void {
    this.sortColumn = sort.active;
    this.sortDirection = sort.direction as 'asc' | 'desc';
    // In production, this would trigger a server-side sort
    this.loadTraces();
  }

  toggleSelection(trace: LangFuseTrace): void {
    const index = this.selectedTraces.findIndex(t => t.id === trace.id);
    if (index >= 0) {
      this.selectedTraces.splice(index, 1);
    } else {
      this.selectedTraces.push(trace);
    }
  }

  isSelected(trace: LangFuseTrace): boolean {
    return this.selectedTraces.some(t => t.id === trace.id);
  }

  toggleAll(event: any): void {
    if (event.checked) {
      this.selectedTraces = [...this.traces];
    } else {
      this.selectedTraces = [];
    }
  }

  isAllSelected(): boolean {
    return this.traces.length > 0 && this.selectedTraces.length === this.traces.length;
  }

  getTraceStatus(trace: LangFuseTrace): string {
    // Determine status from trace metadata or output
    if (trace.output && typeof trace.output === 'object' && 'error' in trace.output) {
      return 'error';
    }
    return 'success';
  }

  exportTracesAs(format: 'json' | 'csv'): void {
    if (this.selectedTraces.length === 0) {
      return;
    }

    // Create filters that match selected traces
    const traceIds = this.selectedTraces.map(t => t.id).filter(id => id) as string[];
    
    // Get all traces and filter to selected ones
    this.observabilityService.getTraces({ limit: 1000 }).subscribe({
      next: (result) => {
        const tracesToExport = result.traces.filter(t => traceIds.includes(t.id || ''));
        
        // Create export data
        let blob: Blob;
        let filename: string;
        let mimeType: string;

        if (format === 'csv') {
          const headers = ['ID', 'Name', 'Timestamp', 'Status', 'Tags', 'User ID', 'Session ID'];
          const rows = tracesToExport.map(trace => [
            trace.id || '',
            trace.name || '',
            trace.timestamp ? new Date(trace.timestamp).toISOString() : '',
            trace.output && typeof trace.output === 'object' && 'error' in trace.output ? 'error' : 'success',
            (trace.tags || []).join(';'),
            trace.userId || '',
            trace.sessionId || ''
          ]);

          const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          ].join('\n');

          blob = new Blob([csvContent], { type: 'text/csv' });
          filename = `traces-${new Date().toISOString()}.csv`;
          mimeType = 'text/csv';
        } else {
          const jsonContent = JSON.stringify(tracesToExport, null, 2);
          blob = new Blob([jsonContent], { type: 'application/json' });
          filename = `traces-${new Date().toISOString()}.json`;
          mimeType = 'application/json';
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error exporting traces:', err);
      }
    });
  }

  exportTraces(): void {
    this.exportTracesAs('json');
  }

  refresh(): void {
    this.loadTraces();
  }
}
