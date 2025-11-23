import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { PromptService } from '../../services/prompt.service';
import { LangFusePrompt } from '../../../../shared/models/langfuse.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-prompt-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatMenuModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="prompt-list">
      <mat-card>
        <mat-card-header>
          <div class="header-content">
            <mat-card-title>Prompt Repository</mat-card-title>
            <button mat-raised-button color="primary" [routerLink]="['/prompts/new']">
              <mat-icon>add</mat-icon>
              New Prompt
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>
          <app-loading-spinner *ngIf="loading" message="Loading prompts..."></app-loading-spinner>

          <div *ngIf="!loading">
            <div class="search-bar">
              <mat-form-field class="full-width">
                <mat-label>Search prompts</mat-label>
                <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" placeholder="Search by name, content, or tags...">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
            </div>

            <table mat-table [dataSource]="filteredPrompts" *ngIf="filteredPrompts.length > 0">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let prompt">
                  <a [routerLink]="['/prompts', prompt.id]">{{ prompt.name }}</a>
                </td>
              </ng-container>

              <ng-container matColumnDef="prompt">
                <th mat-header-cell *matHeaderCellDef>Prompt</th>
                <td mat-cell *matCellDef="let prompt">
                  <div class="prompt-preview">{{ prompt.prompt | slice:0:100 }}{{ prompt.prompt.length > 100 ? '...' : '' }}</div>
                </td>
              </ng-container>

              <ng-container matColumnDef="tags">
                <th mat-header-cell *matHeaderCellDef>Tags</th>
                <td mat-cell *matCellDef="let prompt">
                  <mat-chip *ngFor="let tag of prompt.tags">{{ tag }}</mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="version">
                <th mat-header-cell *matHeaderCellDef>Version</th>
                <td mat-cell *matCellDef="let prompt">v{{ prompt.version }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let prompt">
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item [routerLink]="['/prompts', prompt.id, 'playground']">
                      <mat-icon>play_arrow</mat-icon>
                      Test in Playground
                    </button>
                    <button mat-menu-item [routerLink]="['/prompts', prompt.id, 'edit']">
                      <mat-icon>edit</mat-icon>
                      Edit
                    </button>
                    <button mat-menu-item (click)="duplicatePrompt(prompt)">
                      <mat-icon>content_copy</mat-icon>
                      Duplicate
                    </button>
                    <button mat-menu-item (click)="deletePrompt(prompt.id!)" class="delete-action">
                      <mat-icon>delete</mat-icon>
                      Delete
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>

            <div *ngIf="filteredPrompts.length === 0" class="empty-state">
              <p>No prompts found</p>
              <button mat-raised-button color="primary" [routerLink]="['/prompts/new']">
                Create Your First Prompt
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .prompt-list {
      padding: 20px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .search-bar {
      margin-bottom: 20px;
    }
    .full-width {
      width: 100%;
    }
    .prompt-preview {
      color: #666;
      font-size: 14px;
    }
    .empty-state {
      padding: 40px;
      text-align: center;
      color: #999;
    }
    .delete-action {
      color: #f44336;
    }
  `]
})
export class PromptListComponent implements OnInit {
  prompts: LangFusePrompt[] = [];
  filteredPrompts: LangFusePrompt[] = [];
  loading: boolean = false;
  searchQuery: string = '';
  displayedColumns: string[] = ['name', 'prompt', 'tags', 'version', 'actions'];

  constructor(private promptService: PromptService) {}

  ngOnInit(): void {
    this.loadPrompts();
  }

  loadPrompts(): void {
    this.loading = true;
    this.promptService.getPrompts().subscribe({
      next: (prompts) => {
        this.prompts = prompts;
        this.filteredPrompts = prompts;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading prompts:', err);
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    if (this.searchQuery) {
      this.promptService.searchPrompts(this.searchQuery).subscribe({
        next: (prompts) => {
          this.filteredPrompts = prompts;
        }
      });
    } else {
      this.filteredPrompts = this.prompts;
    }
  }

  duplicatePrompt(prompt: LangFusePrompt): void {
    this.promptService.createPrompt({
      ...prompt,
      name: `${prompt.name} (Copy)`
    }).subscribe({
      next: () => {
        this.loadPrompts();
      }
    });
  }

  deletePrompt(id: string): void {
    if (confirm('Are you sure you want to delete this prompt?')) {
      this.promptService.deletePrompt(id).subscribe({
        next: () => {
          this.loadPrompts();
        }
      });
    }
  }
}
