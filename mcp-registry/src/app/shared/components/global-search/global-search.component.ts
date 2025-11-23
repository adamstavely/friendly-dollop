import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { SearchService, SearchResult } from '../../../core/services/search.service';
import { SearchResultsComponent } from '../search-results/search-results.component';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="global-search">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search</mat-label>
        <input 
          matInput 
          #searchInput
          [(ngModel)]="searchQuery"
          (input)="onSearchInput($event)"
          (keydown.enter)="onEnter()"
          (keydown.escape)="onEscape()"
          [matAutocomplete]="auto"
          placeholder="Search tools, bundles... (Ctrl+K)">
        <mat-icon matPrefix>search</mat-icon>
        <mat-autocomplete 
          #auto="matAutocomplete"
          [displayWith]="displayFn"
          (optionSelected)="onOptionSelected($event)">
          <mat-option *ngFor="let suggestion of suggestions" [value]="suggestion">
            <mat-icon>search</mat-icon>
            <span>{{ suggestion }}</span>
          </mat-option>
        </mat-autocomplete>
      </mat-form-field>
      <button 
        mat-icon-button 
        (click)="openSearchDialog()"
        matTooltip="Advanced Search (Ctrl+K)">
        <mat-icon>tune</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .global-search {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      max-width: 500px;
    }
    .search-field {
      flex: 1;
    }
    mat-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class GlobalSearchComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  
  searchQuery: string = '';
  suggestions: string[] = [];
  private searchSubject = new Subject<string>();

  constructor(
    private searchService: SearchService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Debounce search input
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.searchService.getSuggestions(query))
    ).subscribe(suggestions => {
      this.suggestions = suggestions;
    });

    // Keyboard shortcut: Ctrl+K / Cmd+K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.openSearchDialog();
      }
    });
  }

  onSearchInput(event: any): void {
    const query = event.target.value;
    this.searchSubject.next(query);
  }

  onEnter(): void {
    if (this.searchQuery.trim()) {
      this.performSearch();
    }
  }

  onEscape(): void {
    this.searchQuery = '';
    this.suggestions = [];
  }

  onOptionSelected(event: any): void {
    this.searchQuery = event.option.value;
    this.performSearch();
  }

  performSearch(): void {
    if (!this.searchQuery.trim()) return;

    this.searchService.search(this.searchQuery).subscribe({
      next: (results) => {
        if (results.length === 1) {
          // Navigate directly if single result
          this.router.navigate([results[0].url]);
          this.searchQuery = '';
        } else if (results.length > 1) {
          // Open dialog with results
          this.openSearchDialog();
        } else {
          // No results - could show a message
          console.log('No results found');
        }
      }
    });
  }

  openSearchDialog(): void {
    const dialogRef = this.dialog.open(SearchResultsComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { initialQuery: this.searchQuery }
    });

    dialogRef.afterClosed().subscribe((result: SearchResult | null) => {
      if (result) {
        this.router.navigate([result.url]);
        this.searchQuery = '';
      }
    });
  }

  displayFn(value: string): string {
    return value || '';
  }
}

