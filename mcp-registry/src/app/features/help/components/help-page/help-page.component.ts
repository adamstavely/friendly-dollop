import { Component, OnInit, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { HelpService, HelpArticle, HelpCategory } from '../../../core/services/help.service';

@Component({
  selector: 'app-help-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatListModule,
    MatChipsModule,
    MatExpansionModule
  ],
  template: `
    <div class="help-page">
      <div class="help-header">
        <h2>Help & Documentation</h2>
        <button *ngIf="isDialog" mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="help-content">
        <!-- Search -->
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search Help</mat-label>
          <input 
            matInput 
            [(ngModel)]="searchQuery"
            (input)="onSearchInput($event)"
            placeholder="Search for help articles...">
          <mat-icon matPrefix>search</mat-icon>
        </mat-form-field>

        <!-- Search Results -->
        <div *ngIf="searchQuery && searchResults.length > 0" class="search-results">
          <h3>Search Results ({{ searchResults.length }})</h3>
          <mat-list>
            <mat-list-item 
              *ngFor="let article of searchResults" 
              (click)="selectArticle(article.id)"
              class="result-item">
              <mat-icon matListItemIcon>article</mat-icon>
              <div matListItemTitle>{{ article.title }}</div>
              <div matListItemLine>{{ article.category }}</div>
            </mat-list-item>
          </mat-list>
        </div>

        <!-- Categories and Articles -->
        <div *ngIf="!searchQuery || searchResults.length === 0">
          <mat-tab-group>
            <!-- All Articles -->
            <mat-tab label="All Articles">
              <div class="articles-list">
                <mat-expansion-panel *ngFor="let category of categories" [expanded]="false">
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>{{ category.icon }}</mat-icon>
                      <span>{{ category.name }}</span>
                    </mat-panel-title>
                    <mat-panel-description>
                      {{ category.articles.length }} articles
                    </mat-panel-description>
                  </mat-expansion-panel-header>
                  <mat-list>
                    <mat-list-item 
                      *ngFor="let article of category.articles"
                      (click)="selectArticle(article.id)"
                      class="article-item">
                      <div matListItemTitle>{{ article.title }}</div>
                      <div matListItemLine>
                        <mat-chip *ngFor="let tag of article.tags.slice(0, 3)">{{ tag }}</mat-chip>
                      </div>
                    </mat-list-item>
                  </mat-list>
                </mat-expansion-panel>
              </div>
            </mat-tab>

            <!-- By Category -->
            <mat-tab *ngFor="let category of categories" [label]="category.name">
              <div class="category-content">
                <mat-list>
                  <mat-list-item 
                    *ngFor="let article of category.articles"
                    (click)="selectArticle(article.id)"
                    class="article-item">
                    <div matListItemTitle>{{ article.title }}</div>
                    <div matListItemLine>
                      <mat-chip *ngFor="let tag of article.tags">{{ tag }}</mat-chip>
                    </div>
                  </mat-list-item>
                </mat-list>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>

        <!-- Selected Article -->
        <div *ngIf="selectedArticle" class="article-view">
          <div class="article-header">
            <h3>{{ selectedArticle.title }}</h3>
            <button mat-icon-button (click)="selectedArticle = null">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="article-content" [innerHTML]="selectedArticle.content"></div>
          <div *ngIf="selectedArticle.relatedArticles && selectedArticle.relatedArticles.length > 0" class="related">
            <h4>Related Articles</h4>
            <mat-list>
              <mat-list-item 
                *ngFor="let relatedId of selectedArticle.relatedArticles"
                (click)="selectArticle(relatedId)">
                <div matListItemTitle>{{ getArticleTitle(relatedId) }}</div>
              </mat-list-item>
            </mat-list>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .help-page {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .help-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }
    .help-header h2 {
      margin: 0;
      color: #673ab7;
    }
    .help-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
    .search-field {
      width: 100%;
      margin-bottom: 24px;
    }
    .search-results {
      margin-bottom: 24px;
    }
    .result-item, .article-item {
      cursor: pointer;
      transition: background 0.2s;
    }
    .result-item:hover, .article-item:hover {
      background: rgba(74, 20, 140, 0.1);
    }
    .articles-list {
      margin-top: 16px;
    }
    .article-view {
      margin-top: 24px;
      padding: 24px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .article-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .article-header h3 {
      margin: 0;
      color: #673ab7;
    }
    .article-content {
      line-height: 1.6;
      color: #333;
    }
    .article-content h2, .article-content h3 {
      color: #673ab7;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    .article-content ul, .article-content ol {
      margin: 12px 0;
      padding-left: 24px;
    }
    .related {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
    }
    .related h4 {
      margin: 0 0 12px;
      color: #673ab7;
    }
  `]
})
export class HelpPageComponent implements OnInit {
  searchQuery: string = '';
  searchResults: HelpArticle[] = [];
  categories: HelpCategory[] = [];
  selectedArticle: HelpArticle | null = null;
  private searchSubject = new Subject<string>();
  isDialog: boolean = false;

  constructor(
    private helpService: HelpService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: { articleId?: string; context?: string },
    @Optional() public dialogRef?: MatDialogRef<HelpPageComponent>
  ) {
    this.isDialog = !!dialogRef;
  }

  ngOnInit(): void {
    // Load categories
    this.helpService.getCategories().subscribe(categories => {
      this.categories = categories;
    });

    // Load specific article if provided
    if (this.data?.articleId) {
      this.helpService.getArticle(this.data.articleId).subscribe(article => {
        if (article) {
          this.selectedArticle = article;
        }
      });
    } else if (this.data?.context) {
      this.helpService.getContextualHelp(this.data.context).subscribe(article => {
        if (article) {
          this.selectedArticle = article;
        }
      });
    }

    // Debounce search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.helpService.searchArticles(query))
    ).subscribe(results => {
      this.searchResults = results;
    });
  }

  onSearchInput(event: any): void {
    const query = event.target.value;
    this.searchSubject.next(query);
  }

  selectArticle(articleId: string): void {
    this.helpService.getArticle(articleId).subscribe(article => {
      if (article) {
        this.selectedArticle = article;
        this.searchQuery = '';
      }
    });
  }

  getArticleTitle(articleId: string): string {
    // This would ideally cache articles, but for now just return the ID
    return articleId;
  }

  close(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}

