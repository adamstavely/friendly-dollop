import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { LifecycleService } from '../../services/lifecycle.service';
import { ToolService } from '../../../tools/services/tool.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-promotion-workflow',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatCheckboxModule,
    MatStepperModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="promotion-workflow">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Promote Tool</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <app-loading-spinner *ngIf="loading" message="Loading promotion requirements..."></app-loading-spinner>
          
          <div *ngIf="!loading">
            <mat-form-field>
              <mat-label>Target State</mat-label>
              <mat-select [(ngModel)]="targetState">
                <mat-option value="staging">Staging</mat-option>
                <mat-option value="pilot">Pilot</mat-option>
                <mat-option value="production">Production</mat-option>
              </mat-select>
            </mat-form-field>

            <h3>Promotion Requirements</h3>
            <mat-list>
              <mat-list-item *ngFor="let req of requirements">
                <mat-checkbox 
                  [checked]="req.status === 'passed'"
                  [disabled]="req.status === 'passed' || req.type === 'automated'">
                </mat-checkbox>
                <span class="requirement-name">{{ req.name }}</span>
                <span class="requirement-type">{{ req.type }}</span>
                <mat-chip [class]="'status-' + req.status">
                  {{ req.status }}
                </mat-chip>
                <p *ngIf="req.description" class="requirement-desc">{{ req.description }}</p>
              </mat-list-item>
            </mat-list>

            <div class="actions">
              <button mat-raised-button color="primary" (click)="promote()" [disabled]="!canPromote()">
                <mat-icon>arrow_upward</mat-icon>
                Promote to {{ targetState }}
              </button>
              <button mat-raised-button (click)="validate()">
                <mat-icon>check_circle</mat-icon>
                Validate Requirements
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .promotion-workflow {
      padding: 20px;
    }
    .requirement-name {
      flex: 1;
      margin-left: 16px;
    }
    .requirement-type {
      font-size: 12px;
      color: #666;
      margin: 0 16px;
    }
    .requirement-desc {
      font-size: 12px;
      color: #999;
      margin: 4px 0 0 40px;
    }
    .actions {
      display: flex;
      gap: 16px;
      margin-top: 24px;
    }
    .status-passed {
      background-color: #4caf50;
      color: white;
    }
    .status-failed {
      background-color: #f44336;
      color: white;
    }
    .status-pending {
      background-color: #ff9800;
      color: white;
    }
  `]
})
export class PromotionWorkflowComponent implements OnInit {
  @Input() toolId: string = '';
  targetState: string = 'staging';
  requirements: any[] = [];
  loading: boolean = false;

  constructor(
    private lifecycleService: LifecycleService,
    private toolService: ToolService
  ) {}

  ngOnInit(): void {
    if (this.toolId) {
      this.loadRequirements();
    }
  }

  loadRequirements(): void {
    this.loading = true;
    this.lifecycleService.getPromotionRequirements(this.toolId).subscribe({
      next: (reqs) => {
        this.requirements = reqs;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading requirements:', err);
        this.loading = false;
      }
    });
  }

  canPromote(): boolean {
    return this.requirements.every(req => req.status === 'passed');
  }

  validate(): void {
    this.loading = true;
    this.toolService.validateTool(this.toolId).subscribe({
      next: (result) => {
        this.loadRequirements();
      },
      error: (err) => {
        console.error('Error validating tool:', err);
        this.loading = false;
      }
    });
  }

  promote(): void {
    if (!this.canPromote()) {
      return;
    }
    this.loading = true;
    this.lifecycleService.promoteTool(this.toolId, this.targetState).subscribe({
      next: () => {
        this.loading = false;
        // Navigate or show success message
      },
      error: (err) => {
        console.error('Error promoting tool:', err);
        this.loading = false;
      }
    });
  }
}

