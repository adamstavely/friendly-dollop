import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { PromptService } from '../../services/prompt.service';
import { LangFusePrompt } from '../../../../shared/models/langfuse.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-prompt-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
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
  `]
})
export class PromptDetailComponent implements OnInit {
  prompt: LangFusePrompt | null = null;
  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private promptService: PromptService
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
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading prompt:', err);
        this.loading = false;
      }
    });
  }
}
