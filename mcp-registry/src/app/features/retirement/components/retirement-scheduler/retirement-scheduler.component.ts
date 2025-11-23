import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { Tool } from '../../../../shared/models/tool.model';
import { ToolService } from '../../../tools/services/tool.service';
import { RetirementService } from '../../services/retirement.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';

@Component({
  selector: 'app-retirement-scheduler',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    LoadingSpinnerComponent,
    ErrorDisplayComponent
  ],
  template: `
    <div class="retirement-scheduler">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Schedule Tool Retirement</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <app-loading-spinner *ngIf="loading" message="Loading retirement options..."></app-loading-spinner>
          <app-error-display
            *ngIf="error && !loading"
            [title]="'Failed to Load Retirement Options'"
            [message]="error"
            [showRetry]="true"
            (onRetry)="loadData()">
          </app-error-display>

          <div *ngIf="!loading && !error && tool">
            <form [formGroup]="retirementForm" (ngSubmit)="scheduleRetirement()">
              <mat-form-field>
                <mat-label>Tool</mat-label>
                <input matInput [value]="tool.name" readonly>
              </mat-form-field>

              <mat-form-field>
                <mat-label>Retirement Date</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="retirementDate" required>
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>

              <mat-form-field>
                <mat-label>Replacement Tool (Optional)</mat-label>
                <mat-select formControlName="replacementToolId">
                  <mat-option value="">None</mat-option>
                  <mat-option *ngFor="let t of availableTools" [value]="t.toolId">
                    {{ t.name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field>
                <mat-label>Retirement Plan</mat-label>
                <textarea matInput formControlName="plan" rows="4" placeholder="Describe the retirement plan, migration steps, and any dependencies..."></textarea>
              </mat-form-field>

              <div class="countdown" *ngIf="retirementForm.get('retirementDate')?.value">
                <mat-icon>schedule</mat-icon>
                <span>Retirement in: {{ getDaysUntilRetirement() }} days</span>
              </div>

              <div class="form-actions">
                <button mat-raised-button type="button" (click)="onCancel()">Cancel</button>
                <button mat-raised-button color="warn" type="submit" [disabled]="retirementForm.invalid">
                  <mat-icon>schedule</mat-icon>
                  Schedule Retirement
                </button>
              </div>
            </form>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .retirement-scheduler {
      padding: 20px;
    }
    .form-actions {
      margin-top: 20px;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .countdown {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: #fff3cd;
      border-radius: 4px;
      margin: 16px 0;
    }
    .countdown mat-icon {
      color: #856404;
    }
  `]
})
export class RetirementSchedulerComponent implements OnInit {
  @Input() toolId!: string;
  tool: Tool | null = null;
  availableTools: Tool[] = [];
  retirementForm: FormGroup;
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private toolService: ToolService,
    private retirementService: RetirementService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {
    this.retirementForm = this.fb.group({
      retirementDate: ['', Validators.required],
      replacementToolId: [''],
      plan: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    // Load tool
    if (this.toolId) {
      this.toolService.getToolById(this.toolId).subscribe({
        next: (tool) => {
          this.tool = tool;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load tool';
          this.loading = false;
        }
      });
    }

    // Load available tools for replacement
    this.toolService.getTools({ limit: 1000 }).subscribe({
      next: (response) => {
        this.availableTools = response.tools.filter(t => t.toolId !== this.toolId);
      },
      error: (err) => {
        console.error('Error loading tools:', err);
      }
    });
  }

  getDaysUntilRetirement(): number {
    const date = this.retirementForm.get('retirementDate')?.value;
    if (!date) return 0;
    const retirementDate = new Date(date);
    const today = new Date();
    const diffTime = retirementDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  scheduleRetirement(): void {
    if (this.retirementForm.valid && this.tool) {
      const formValue = this.retirementForm.value;
      const daysUntil = this.getDaysUntilRetirement();

      this.confirmationService.confirm({
        title: 'Confirm Retirement Schedule',
        message: `Are you sure you want to schedule retirement for "${this.tool.name}" in ${daysUntil} days?`,
        confirmText: 'Schedule',
        cancelText: 'Cancel',
        destructive: true
      }).subscribe(confirmed => {
        if (confirmed) {
          this.retirementService.scheduleRetirement(this.toolId, {
            retirementDate: formValue.retirementDate,
            replacementToolId: formValue.replacementToolId || undefined,
            plan: formValue.plan
          }).subscribe({
            next: () => {
              this.toastService.success('Retirement scheduled successfully');
              this.retirementForm.reset();
            },
            error: (err) => {
              this.toastService.error(err.message || 'Failed to schedule retirement');
            }
          });
        }
      });
    }
  }

  onCancel(): void {
    this.retirementForm.reset();
  }
}

