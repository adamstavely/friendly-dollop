import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { PromptService } from '../../services/prompt.service';
import { LangFusePrompt } from '../../../../shared/models/langfuse.model';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-prompt-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatSelectModule
  ],
  template: `
    <div class="prompt-form">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ isEditMode ? 'Edit Prompt' : 'New Prompt' }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form (ngSubmit)="savePrompt()">
            <mat-form-field class="full-width">
              <mat-label>Name</mat-label>
              <input matInput [(ngModel)]="prompt.name" name="name" required>
            </mat-form-field>

            <mat-form-field class="full-width">
              <mat-label>Prompt</mat-label>
              <textarea matInput [(ngModel)]="prompt.prompt" name="prompt" rows="10" required></textarea>
              <mat-hint>Use double curly braces for variables</mat-hint>
            </mat-form-field>

            <div class="form-row" *ngIf="prompt.config">
              <mat-form-field>
                <mat-label>Temperature</mat-label>
                <input matInput type="number" [(ngModel)]="prompt.config.temperature" name="temperature" min="0" max="2" step="0.1">
              </mat-form-field>

              <mat-form-field>
                <mat-label>Max Tokens</mat-label>
                <input matInput type="number" [(ngModel)]="prompt.config.maxTokens" name="maxTokens" min="1">
              </mat-form-field>
            </div>

            <mat-form-field class="full-width">
              <mat-label>Tags</mat-label>
              <mat-chip-grid #chipGrid>
                <mat-chip *ngFor="let tag of prompt.tags" (removed)="removeTag(tag)">
                  {{ tag }}
                  <button matChipRemove>
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip>
                <input placeholder="Add tag" [matChipInputFor]="chipGrid" (matChipInputTokenEnd)="addTag($event)">
              </mat-chip-grid>
            </mat-form-field>

            <div class="form-actions">
              <button mat-raised-button type="button" (click)="cancel()">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="!canSave()">
                <mat-icon>save</mat-icon>
                Save
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .prompt-form {
      padding: 20px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    .form-row mat-form-field {
      flex: 1;
    }
    .form-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 24px;
    }
  `]
})
export class PromptFormComponent implements OnInit {
  prompt: Partial<LangFusePrompt> = {
    name: '',
    prompt: '',
    config: {
      temperature: 0.7,
      maxTokens: 1000
    },
    tags: []
  };
  isEditMode: boolean = false;
  promptId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private promptService: PromptService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.promptId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.promptId;

    if (this.isEditMode && this.promptId) {
      this.loadPrompt(this.promptId);
    }
  }

  loadPrompt(id: string): void {
    this.promptService.getPrompt(id).subscribe({
      next: (prompt) => {
        if (prompt) {
          this.prompt = {
            ...prompt,
            config: prompt.config || { temperature: 0.7, maxTokens: 1000 },
            tags: prompt.tags || []
          };
        }
      },
      error: (err) => {
        console.error('Error loading prompt:', err);
        this.toastService.error('Failed to load prompt');
      }
    });
  }

  canSave(): boolean {
    return !!(this.prompt.name && this.prompt.prompt);
  }

  addTag(event: any): void {
    const value = event.value.trim();
    if (value && !this.prompt.tags?.includes(value)) {
      if (!this.prompt.tags) {
        this.prompt.tags = [];
      }
      this.prompt.tags.push(value);
    }
    event.chipInput.clear();
  }

  removeTag(tag: string): void {
    if (this.prompt.tags) {
      const index = this.prompt.tags.indexOf(tag);
      if (index >= 0) {
        this.prompt.tags.splice(index, 1);
      }
    }
  }

  savePrompt(): void {
    if (!this.canSave()) {
      return;
    }

    if (this.isEditMode && this.promptId) {
      this.promptService.updatePrompt(this.promptId, this.prompt).subscribe({
        next: () => {
          this.toastService.success('Prompt updated successfully');
          this.router.navigate(['/prompts', this.promptId]);
        },
        error: (err) => {
          this.toastService.error('Failed to update prompt');
        }
      });
    } else {
      this.promptService.createPrompt(this.prompt).subscribe({
        next: (created) => {
          this.toastService.success('Prompt created successfully');
          this.router.navigate(['/prompts', created.id]);
        },
        error: (err) => {
          this.toastService.error('Failed to create prompt');
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/prompts']);
  }
}
