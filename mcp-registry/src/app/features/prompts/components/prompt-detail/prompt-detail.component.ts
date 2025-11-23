import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { PromptService } from '../../services/prompt.service';
import { LangFusePrompt } from '../../../../shared/models/langfuse.model';
import { PromptVersion } from '../../../../shared/models/prompt.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-prompt-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDialogModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="prompt-detail">
      <app-loading-spinner *ngIf="loading" message="Loading prompt..."></app-loading-spinner>

      <div *ngIf="prompt && !loading">
        <mat-card>
          <mat-card-header>
            <div class="header-content">
              <div>
                <mat-card-title>{{ prompt.name }}</mat-card-title>
                <mat-card-subtitle>Version {{ prompt.version }}</mat-card-subtitle>
              </div>
              <div class="header-actions">
                <button mat-raised-button color="primary" [routerLink]="['/prompts', prompt.id, 'playground']">
                  <mat-icon>play_arrow</mat-icon>
                  Test in Playground
                </button>
                <button mat-raised-button [routerLink]="['/prompts', prompt.id, 'analytics']">
                  <mat-icon>analytics</mat-icon>
                  Analytics
                </button>
                <button mat-raised-button [routerLink]="['/prompts', prompt.id, 'edit']">
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>
              </div>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="prompt-content">
              <h3>Prompt</h3>
              <pre class="prompt-text">{{ prompt.prompt }}</pre>
            </div>

            <div class="prompt-meta">
              <div *ngIf="prompt.config">
                <h3>Configuration</h3>
                <ul>
                  <li *ngIf="prompt.config.temperature">Temperature: {{ prompt.config.temperature }}</li>
                  <li *ngIf="prompt.config.maxTokens">Max Tokens: {{ prompt.config.maxTokens }}</li>
                </ul>
              </div>

              <div *ngIf="prompt.tags && prompt.tags.length > 0">
                <h3>Tags</h3>
                <mat-chip *ngFor="let tag of prompt.tags">{{ tag }}</mat-chip>
              </div>

              <div class="version-section">
                <h3>Version Management</h3>
                <div class="version-controls">
                  <mat-form-field>
                    <mat-label>Rollback to Version</mat-label>
                    <mat-select [(ngModel)]="selectedRollbackVersion" [disabled]="rollingBack || availableVersions.length <= 1">
                      <mat-option *ngFor="let version of availableVersions" [value]="version.version">
                        Version {{ version.version }} ({{ version.createdAt | date:'short' }})
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                  <button 
                    mat-raised-button 
                    color="warn" 
                    (click)="rollbackVersion()" 
                    [disabled]="!selectedRollbackVersion || rollingBack || availableVersions.length <= 1">
                    <mat-icon>undo</mat-icon>
                    Rollback
                  </button>
                </div>
                <div *ngIf="availableVersions.length > 0" class="version-list">
                  <h4>Version History</h4>
                  <div *ngFor="let version of availableVersions" class="version-item">
                    <div class="version-info">
                      <span class="version-number">Version {{ version.version }}</span>
                      <span class="version-date">{{ version.createdAt | date:'short' }}</span>
                      <mat-chip *ngIf="version.isActive" class="active-badge">Active</mat-chip>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .prompt-detail {
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
    .prompt-content {
      margin-bottom: 24px;
    }
    .prompt-text {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .prompt-meta {
      margin-top: 24px;
    }
    .prompt-meta h3 {
      margin-top: 16px;
      margin-bottom: 8px;
    }
    .prompt-meta ul {
      list-style: none;
      padding: 0;
    }
    .prompt-meta li {
      padding: 4px 0;
    }
    .version-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    .version-controls {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 16px;
    }
    .version-controls mat-form-field {
      flex: 1;
      max-width: 300px;
    }
    .version-list {
      margin-top: 16px;
    }
    .version-item {
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .version-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .version-number {
      font-weight: 600;
      color: #6366f1;
    }
    .version-date {
      color: #666;
      font-size: 14px;
    }
    .active-badge {
      background: #10b981;
      color: white;
    }
  `]
})
export class PromptDetailComponent implements OnInit {
  prompt: LangFusePrompt | null = null;
  loading: boolean = false;
  rollingBack: boolean = false;
  availableVersions: PromptVersion[] = [];
  selectedRollbackVersion: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private promptService: PromptService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPrompt(id);
    }
  }

  loadPrompt(id: string): void {
    this.loading = true;
    this.promptService.getPrompt(id).subscribe({
      next: (prompt) => {
        this.prompt = prompt;
        this.loadVersions(id);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading prompt:', err);
        this.loading = false;
      }
    });
  }

  loadVersions(promptId: string): void {
    this.promptService.getPromptVersions(promptId).subscribe({
      next: (versions) => {
        this.availableVersions = versions.sort((a, b) => Number(b.version) - Number(a.version));
      },
      error: (err) => {
        console.error('Error loading versions:', err);
      }
    });
  }

  rollbackVersion(): void {
    if (!this.prompt || !this.selectedRollbackVersion) return;

    const targetVersion = Number(this.selectedRollbackVersion);
    if (isNaN(targetVersion)) {
      this.toastService.error('Invalid version selected');
      return;
    }

    if (!confirm(`Are you sure you want to rollback to version ${targetVersion}? This will create a new version with the content from version ${targetVersion}.`)) {
      return;
    }

    this.rollingBack = true;
    this.promptService.rollbackPromptVersion(this.prompt.id!, targetVersion).subscribe({
      next: (updatedPrompt) => {
        this.prompt = updatedPrompt;
        this.loadVersions(this.prompt.id!);
        this.selectedRollbackVersion = null;
        this.rollingBack = false;
        this.toastService.success(`Successfully rolled back to version ${targetVersion}`);
      },
      error: (err) => {
        console.error('Error rolling back version:', err);
        this.toastService.error('Failed to rollback version: ' + (err.message || 'Unknown error'));
        this.rollingBack = false;
      }
    });
  }
}
