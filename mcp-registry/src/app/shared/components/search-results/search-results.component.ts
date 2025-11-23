import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { SearchService, SearchResult } from '../../../core/services/search.service';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatTabsModule
  ],
  template: `
    <h2 mat-dialog-title>Search</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="search-input">
        <mat-label>Search</mat-label>
        <input 
          matInput 
          [(ngModel)]="searchQuery"
          (input)="onSearchInput($event)"
          (keydown.enter)="performSearch()"
          placeholder="Search tools, bundles...">
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>

      <div *ngIf="loading" class="loading">
        <mat-icon>search</mat-icon>
        <span>Searching...</span>
      </div>

      <div *ngIf="!loading && results.length === 0 && searchQuery" class="no-results">
        <mat-icon>search_off</mat-icon>
        <p>No results found for "{{ searchQuery }}"</p>
      </div>

      <div *ngIf="!loading && results.length > 0">
        <mat-tab-group>
          <mat-tab label="All ({{ results.length }})">
            <mat-list>
              <mat-list-item 
                *ngFor="let result of results" 
                (click)="selectResult(result)"
                class="result-item">
                <mat-icon matListItemIcon [color]="getIconColor(result.type)">
                  {{ getIcon(result.type) }}
                </mat-icon>
                <div matListItemTitle>{{ result.name }}</div>
                <div matListItemLine *ngIf="result.description">
                  {{ result.description }}
                </div>
                <mat-chip matListItemMeta>{{ result.type }}</mat-chip>
              </mat-list-item>
            </mat-list>
          </mat-tab>

          <mat-tab label="Tools ({{ getResultsByType('tool').length }})">
            <mat-list>
              <mat-list-item 
                *ngFor="let result of getResultsByType('tool')" 
                (click)="selectResult(result)"
                class="result-item">
                <mat-icon matListItemIcon color="primary">build</mat-icon>
                <div matListItemTitle>{{ result.name }}</div>
                <div matListItemLine *ngIf="result.description">
                  {{ result.description }}
                </div>
              </mat-list-item>
            </mat-list>
          </mat-tab>

          <mat-tab label="Bundles ({{ getResultsByType('bundle').length }})">
            <mat-list>
              <mat-list-item 
                *ngFor="let result of getResultsByType('bundle')" 
                (click)="selectResult(result)"
                class="result-item">
                <mat-icon matListItemIcon color="accent">inventory_2</mat-icon>
                <div matListItemTitle>{{ result.name }}</div>
                <div matListItemLine *ngIf="result.description">
                  {{ result.description }}
                </div>
              </mat-list-item>
            </mat-list>
          </mat-tab>
        </mat-tab-group>
      </div>

      <div *ngIf="!loading && !searchQuery" class="empty-state">
        <mat-icon>search</mat-icon>
        <p>Start typing to search...</p>
        <div *ngIf="searchHistory.length > 0" class="history">
          <h4>Recent Searches</h4>
          <mat-list>
            <mat-list-item 
              *ngFor="let term of searchHistory" 
              (click)="searchQuery = term; performSearch()">
              <mat-icon matListItemIcon>history</mat-icon>
              <div matListItemTitle>{{ term }}</div>
            </mat-list-item>
          </mat-list>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .search-input {
      width: 100%;
      margin-bottom: 16px;
    }
    .loading, .no-results, .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }
    .loading mat-icon, .no-results mat-icon, .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: #9575cd;
    }
    .result-item {
      cursor: pointer;
      transition: background 0.2s;
    }
    .result-item:hover {
      background: rgba(74, 20, 140, 0.1);
    }
    .history {
      margin-top: 24px;
      text-align: left;
    }
    .history h4 {
      margin: 16px 0 8px;
      color: #333;
    }
  `]
})
export class SearchResultsComponent implements OnInit {
  searchQuery: string = '';
  results: SearchResult[] = [];
  loading: boolean = false;
  searchHistory: string[] = [];
  private searchSubject = new Subject<string>();

  constructor(
    public dialogRef: MatDialogRef<SearchResultsComponent, SearchResult | null>,
    @Inject(MAT_DIALOG_DATA) public data: { initialQuery?: string },
    private searchService: SearchService,
    private router: Router
  ) {
    if (data?.initialQuery) {
      this.searchQuery = data.initialQuery;
    }
  }

  ngOnInit(): void {
    this.searchHistory = this.searchService.getSearchHistory();

    // Debounce search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        this.loading = true;
        return this.searchService.search(query);
      })
    ).subscribe({
      next: (results) => {
        this.results = results;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    // Perform initial search if query provided
    if (this.searchQuery) {
      this.performSearch();
    }
  }

  onSearchInput(event: any): void {
    const query = event.target.value;
    this.searchSubject.next(query);
  }

  performSearch(): void {
    if (!this.searchQuery.trim()) {
      this.results = [];
      return;
    }
    this.searchSubject.next(this.searchQuery);
  }

  getResultsByType(type: 'tool' | 'bundle' | 'schema'): SearchResult[] {
    return this.results.filter(r => r.type === type);
  }

  selectResult(result: SearchResult): void {
    this.dialogRef.close(result);
  }

  close(): void {
    this.dialogRef.close(null);
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      tool: 'build',
      bundle: 'inventory_2',
      schema: 'schema'
    };
    return icons[type] || 'help';
  }

  getIconColor(type: string): string {
    const colors: Record<string, string> = {
      tool: 'primary',
      bundle: 'accent',
      schema: 'primary'
    };
    return colors[type] || '';
  }
}

