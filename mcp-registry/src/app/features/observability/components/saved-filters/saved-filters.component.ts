import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { SavedFiltersService, SavedFilter } from '../../services/saved-filters.service';
import { TraceFilters } from '../../services/observability.service';

@Component({
  selector: 'app-saved-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatListModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule
  ],
  template: `
    <div class="saved-filters-container">
      <div class="filters-header">
        <h3>Saved Filters</h3>
        <button mat-raised-button color="primary" (click)="openSaveDialog()">
          <mat-icon>add</mat-icon>
          Save Current Filter
        </button>
      </div>

      <div *ngIf="savedFilters.length === 0" class="empty-state">
        <p>No saved filters yet. Save your current filter configuration to quickly apply it later.</p>
      </div>

      <mat-list *ngIf="savedFilters.length > 0">
        <mat-list-item *ngFor="let filter of savedFilters">
          <div class="filter-item">
            <div class="filter-info">
              <div class="filter-name">{{ filter.name }}</div>
              <div class="filter-description" *ngIf="filter.description">{{ filter.description }}</div>
              <div class="filter-meta">
                <span>Created: {{ filter.createdAt | date:'short' }}</span>
                <span *ngIf="filter.updatedAt !== filter.createdAt">
                  • Updated: {{ filter.updatedAt | date:'short' }}
                </span>
              </div>
              <div class="filter-tags" *ngIf="getFilterSummary(filter.filters)">
                <mat-chip *ngFor="let tag of getFilterSummary(filter.filters)">{{ tag }}</mat-chip>
              </div>
            </div>
            <div class="filter-actions">
              <button mat-icon-button [matMenuTriggerFor]="menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="applyFilter(filter.id)">
                  <mat-icon>play_arrow</mat-icon>
                  Apply
                </button>
                <button mat-menu-item (click)="editFilter(filter)">
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>
                <button mat-menu-item (click)="deleteFilter(filter.id)">
                  <mat-icon>delete</mat-icon>
                  Delete
                </button>
              </mat-menu>
            </div>
          </div>
        </mat-list-item>
      </mat-list>
    </div>
  `,
  styles: [`
    .saved-filters-container {
      padding: 16px;
    }
    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .filters-header h3 {
      margin: 0;
    }
    .empty-state {
      padding: 40px;
      text-align: center;
      color: #999;
    }
    .filter-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
      padding: 8px 0;
    }
    .filter-info {
      flex: 1;
    }
    .filter-name {
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 4px;
    }
    .filter-description {
      color: #666;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .filter-meta {
      color: #999;
      font-size: 12px;
      margin-bottom: 8px;
    }
    .filter-tags {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .filter-tags mat-chip {
      font-size: 11px;
      height: 24px;
    }
    .filter-actions {
      margin-left: 16px;
    }
  `]
})
export class SavedFiltersComponent implements OnInit {
  @Input() currentFilters: TraceFilters = {};
  @Output() filterApplied = new EventEmitter<TraceFilters>();

  savedFilters: SavedFilter[] = [];

  constructor(
    private savedFiltersService: SavedFiltersService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadSavedFilters();
    this.savedFiltersService.filters$.subscribe(filters => {
      this.savedFilters = filters;
    });
  }

  loadSavedFilters(): void {
    this.savedFilters = this.savedFiltersService.getSavedFilters();
  }

  openSaveDialog(): void {
    // Simple prompt for now - could be replaced with a proper dialog component
    const name = prompt('Enter a name for this filter:');
    if (!name) return;

    const description = prompt('Enter a description (optional):') || undefined;

    this.savedFiltersService.saveFilter(name, this.currentFilters, description);
  }

  applyFilter(id: string): void {
    const filters = this.savedFiltersService.applyFilter(id);
    if (filters) {
      this.filterApplied.emit(filters);
    }
  }

  editFilter(filter: SavedFilter): void {
    const newName = prompt('Enter a new name:', filter.name);
    if (!newName) return;

    const newDescription = prompt('Enter a new description (optional):', filter.description || '') || undefined;

    this.savedFiltersService.updateFilter(filter.id, {
      name: newName,
      description: newDescription
    });
  }

  deleteFilter(id: string): void {
    if (confirm('Are you sure you want to delete this saved filter?')) {
      this.savedFiltersService.deleteFilter(id);
    }
  }

  getFilterSummary(filters: TraceFilters): string[] {
    const summary: string[] = [];
    if (filters.status) summary.push(`Status: ${filters.status}`);
    if (filters.workflowId) summary.push(`Workflow: ${filters.workflowId}`);
    if (filters.toolId) summary.push(`Tool: ${filters.toolId}`);
    if (filters.tags && filters.tags.length > 0) summary.push(`${filters.tags.length} tags`);
    if (filters.fromTimestamp || filters.toTimestamp) summary.push('Date range');
    return summary;
  }
}

