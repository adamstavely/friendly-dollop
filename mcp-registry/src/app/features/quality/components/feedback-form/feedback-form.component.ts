import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatChipsModule } from '@angular/material/chips';
import { ToolService } from '../../../tools/services/tool.service';
import { QualityService } from '../../services/quality.service';
import { Tool } from '../../../../shared/models/tool.model';
import { ToastService } from '../../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { HelpTooltipComponent } from '../../../../shared/components/help-tooltip/help-tooltip.component';

export type FeedbackType = 'success' | 'failure' | 'latency' | 'quality';

@Component({
  selector: 'app-feedback-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatChipsModule,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
    HelpTooltipComponent
  ],
  template: `
    <div class="feedback-form">
      <mat-card>
        <mat-card-header>
          <div class="header-content">
            <div>
              <mat-card-title>Submit Agent Feedback</mat-card-title>
              <mat-card-subtitle>Help improve tool quality by providing feedback</mat-card-subtitle>
            </div>
            <app-help-tooltip context="quality" tooltip="Learn about feedback"></app-help-tooltip>
          </div>
        </mat-card-header>
        <mat-card-content>
          <app-loading-spinner *ngIf="loading" message="Loading tools..."></app-loading-spinner>
          <app-error-display
            *ngIf="error && !loading"
            [title]="'Failed to Load Tools'"
            [message]="error"
            [showRetry]="true"
            (onRetry)="loadTools()">
          </app-error-display>

          <form [formGroup]="feedbackForm" (ngSubmit)="submitFeedback()" *ngIf="!loading && !error">
            <mat-form-field>
              <mat-label>Tool</mat-label>
              <mat-select formControlName="toolId" required>
                <mat-option *ngFor="let tool of availableTools" [value]="tool.toolId">
                  {{ tool.name }} ({{ tool.toolId }})
                </mat-option>
              </mat-select>
              <mat-error *ngIf="feedbackForm.get('toolId')?.hasError('required') && feedbackForm.get('toolId')?.touched">
                Tool selection is required
              </mat-error>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Feedback Type</mat-label>
              <mat-select formControlName="feedbackType" required>
                <mat-option value="success">Success</mat-option>
                <mat-option value="failure">Failure</mat-option>
                <mat-option value="latency">Latency Issue</mat-option>
                <mat-option value="quality">Quality Issue</mat-option>
              </mat-select>
              <mat-error *ngIf="feedbackForm.get('feedbackType')?.hasError('required') && feedbackForm.get('feedbackType')?.touched">
                Feedback type is required
              </mat-error>
            </mat-form-field>

            <div class="rating-section" *ngIf="feedbackForm.get('feedbackType')?.value === 'quality'">
              <label>Quality Rating (1-10)</label>
              <mat-slider
                formControlName="rating"
                min="1"
                max="10"
                step="1"
                discrete
                [displayWith]="formatRating">
                <input matSliderThumb>
              </mat-slider>
              <span class="rating-value">{{ feedbackForm.get('rating')?.value || 5 }}/10</span>
            </div>

            <mat-form-field>
              <mat-label>Comments</mat-label>
              <textarea matInput formControlName="comments" rows="4" placeholder="Describe your experience with this tool..."></textarea>
            </mat-form-field>

            <div class="form-actions">
              <button mat-raised-button type="button" (click)="resetForm()">Reset</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="feedbackForm.invalid">
                <mat-icon>send</mat-icon>
                Submit Feedback
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .feedback-form {
      padding: 20px;
    }
    .rating-section {
      margin: 20px 0;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .rating-section label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .rating-value {
      margin-left: 16px;
      font-weight: bold;
      color: #673ab7;
    }
    .form-actions {
      margin-top: 20px;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  `]
})
export class FeedbackFormComponent implements OnInit {
  feedbackForm: FormGroup;
  availableTools: Tool[] = [];
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private toolService: ToolService,
    private qualityService: QualityService,
    private toastService: ToastService
  ) {
    this.feedbackForm = this.fb.group({
      toolId: ['', Validators.required],
      feedbackType: ['', Validators.required],
      rating: [5],
      comments: ['']
    });
  }

  ngOnInit(): void {
    this.loadTools();
  }

  loadTools(): void {
    this.loading = true;
    this.error = null;
    this.toolService.getTools({ limit: 1000 }).subscribe({
      next: (response) => {
        this.availableTools = response.tools;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load tools';
        this.loading = false;
      }
    });
  }

  formatRating(value: number): string {
    return `${value}/10`;
  }

  submitFeedback(): void {
    if (this.feedbackForm.valid) {
      const feedback = this.feedbackForm.value;
      this.qualityService.submitFeedback(feedback.toolId, {
        type: feedback.feedbackType,
        rating: feedback.rating,
        comments: feedback.comments,
        timestamp: new Date().toISOString()
      }).subscribe({
        next: () => {
          this.toastService.success('Feedback submitted successfully. Thank you!');
          this.resetForm();
        },
        error: (err) => {
          this.toastService.error(err.message || 'Failed to submit feedback');
        }
      });
    }
  }

  resetForm(): void {
    this.feedbackForm.reset({
      rating: 5
    });
  }
}

