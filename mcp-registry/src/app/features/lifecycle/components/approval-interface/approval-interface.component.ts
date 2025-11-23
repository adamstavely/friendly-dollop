import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { LifecycleService } from '../../services/lifecycle.service';
import { ToolService } from '../../../tools/services/tool.service';
import { Tool } from '../../../../shared/models/tool.model';
import { ToastService } from '../../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { HelpTooltipComponent } from '../../../../shared/components/help-tooltip/help-tooltip.component';

export interface ApprovalRequest {
  id: string;
  toolId: string;
  toolName: string;
  requestedBy: string;
  requestedAt: string;
  targetState: string;
  justification: string;
  status: 'pending' | 'approved' | 'rejected';
  approver?: string;
  approvedAt?: string;
  comments?: string;
}

@Component({
  selector: 'app-approval-interface',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatChipsModule,
    MatTabsModule,
    MatTableModule,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
    HelpTooltipComponent
  ],
  template: `
    <div class="approval-interface">
      <mat-card>
        <mat-card-header>
          <div class="header-content">
            <mat-card-title>Approval Workflow</mat-card-title>
            <app-help-tooltip context="lifecycle" tooltip="Learn about approvals"></app-help-tooltip>
          </div>
        </mat-card-header>
        <mat-card-content>
          <app-loading-spinner *ngIf="loading" message="Loading approvals..."></app-loading-spinner>
          <app-error-display
            *ngIf="error && !loading"
            [title]="'Failed to Load Approvals'"
            [message]="error"
            [showRetry]="true"
            (onRetry)="loadApprovals()">
          </app-error-display>

          <div *ngIf="!loading && !error">
            <mat-tab-group>
              <!-- Request Approval Tab -->
              <mat-tab label="Request Approval">
                <div class="tab-content">
                  <form [formGroup]="approvalForm" (ngSubmit)="requestApproval()">
                    <mat-form-field>
                      <mat-label>Tool</mat-label>
                      <input matInput [value]="tool?.name || 'N/A'" readonly>
                    </mat-form-field>
                    <mat-form-field>
                      <mat-label>Target Lifecycle State</mat-label>
                      <input matInput formControlName="targetState" required>
                      <mat-error *ngIf="approvalForm.get('targetState')?.hasError('required') && approvalForm.get('targetState')?.touched">
                        Target state is required
                      </mat-error>
                    </mat-form-field>
                    <mat-form-field>
                      <mat-label>Justification</mat-label>
                      <textarea matInput formControlName="justification" rows="4" required></textarea>
                      <mat-error *ngIf="approvalForm.get('justification')?.hasError('required') && approvalForm.get('justification')?.touched">
                        Justification is required
                      </mat-error>
                    </mat-form-field>
                    <mat-form-field>
                      <mat-label>Approver Email</mat-label>
                      <input matInput type="email" formControlName="approverEmail" required>
                      <mat-error *ngIf="approvalForm.get('approverEmail')?.hasError('required') && approvalForm.get('approverEmail')?.touched">
                        Approver email is required
                      </mat-error>
                      <mat-error *ngIf="approvalForm.get('approverEmail')?.hasError('email') && approvalForm.get('approverEmail')?.touched">
                        Please enter a valid email address
                      </mat-error>
                    </mat-form-field>
                    <div class="form-actions">
                      <button mat-raised-button color="primary" type="submit" [disabled]="approvalForm.invalid">
                        <mat-icon>send</mat-icon>
                        Request Approval
                      </button>
                    </div>
                  </form>
                </div>
              </mat-tab>

              <!-- Pending Approvals Tab -->
              <mat-tab label="Pending Approvals">
                <div class="tab-content">
                  <table mat-table [dataSource]="pendingApprovals" *ngIf="pendingApprovals.length > 0">
                    <ng-container matColumnDef="tool">
                      <th mat-header-cell *matHeaderCellDef>Tool</th>
                      <td mat-cell *matCellDef="let approval">{{ approval.toolName }}</td>
                    </ng-container>
                    <ng-container matColumnDef="targetState">
                      <th mat-header-cell *matHeaderCellDef>Target State</th>
                      <td mat-cell *matCellDef="let approval">{{ approval.targetState }}</td>
                    </ng-container>
                    <ng-container matColumnDef="requestedBy">
                      <th mat-header-cell *matHeaderCellDef>Requested By</th>
                      <td mat-cell *matCellDef="let approval">{{ approval.requestedBy }}</td>
                    </ng-container>
                    <ng-container matColumnDef="requestedAt">
                      <th mat-header-cell *matHeaderCellDef>Requested At</th>
                      <td mat-cell *matCellDef="let approval">{{ approval.requestedAt | date:'short' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Actions</th>
                      <td mat-cell *matCellDef="let approval">
                        <button mat-button color="primary" (click)="approveRequest(approval.id)">
                          <mat-icon>check</mat-icon>
                          Approve
                        </button>
                        <button mat-button color="warn" (click)="rejectRequest(approval.id)">
                          <mat-icon>close</mat-icon>
                          Reject
                        </button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="approvalColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: approvalColumns"></tr>
                  </table>
                  <p *ngIf="pendingApprovals.length === 0">No pending approvals</p>
                </div>
              </mat-tab>

              <!-- Approval History Tab -->
              <mat-tab label="History">
                <div class="tab-content">
                  <mat-list>
                    <mat-list-item *ngFor="let approval of approvalHistory">
                      <mat-icon matListItemIcon [color]="approval.status === 'approved' ? 'primary' : 'warn'">
                        {{ approval.status === 'approved' ? 'check_circle' : 'cancel' }}
                      </mat-icon>
                      <div matListItemTitle>{{ approval.toolName }} → {{ approval.targetState }}</div>
                      <div matListItemLine>
                        {{ approval.status }} by {{ approval.approver || 'N/A' }} on {{ approval.approvedAt | date:'short' }}
                      </div>
                    </mat-list-item>
                  </mat-list>
                </div>
              </mat-tab>
            </mat-tab-group>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .approval-interface {
      padding: 20px;
    }
    .tab-content {
      padding: 20px;
    }
    .form-actions {
      margin-top: 20px;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    table {
      width: 100%;
    }
  `]
})
export class ApprovalInterfaceComponent implements OnInit {
  @Input() toolId?: string;
  tool: Tool | null = null;
  approvalForm: FormGroup;
  pendingApprovals: ApprovalRequest[] = [];
  approvalHistory: ApprovalRequest[] = [];
  loading: boolean = false;
  error: string | null = null;
  approvalColumns: string[] = ['tool', 'targetState', 'requestedBy', 'requestedAt', 'actions'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private lifecycleService: LifecycleService,
    private toolService: ToolService,
    private toastService: ToastService
  ) {
    this.approvalForm = this.fb.group({
      targetState: ['', Validators.required],
      justification: ['', Validators.required],
      approverEmail: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // Get toolId from route params if available
    const routeToolId = this.route.snapshot.paramMap.get('toolId');
    if (routeToolId) {
      this.toolId = routeToolId;
    }
    
    this.loadApprovals();
    if (this.toolId) {
      this.loadTool();
    }
  }

  loadTool(): void {
    if (!this.toolId) return;
    this.toolService.getToolById(this.toolId).subscribe({
      next: (tool) => {
        this.tool = tool;
      },
      error: (err) => {
        console.error('Error loading tool:', err);
      }
    });
  }

  loadApprovals(): void {
    this.loading = true;
    this.error = null;
    // Mock data for now
    setTimeout(() => {
      this.pendingApprovals = [
        {
          id: '1',
          toolId: 'tool-1',
          toolName: 'Search API',
          requestedBy: 'admin',
          requestedAt: new Date().toISOString(),
          targetState: 'production',
          justification: 'Ready for production',
          status: 'pending'
        }
      ];
      this.approvalHistory = [];
      this.loading = false;
    }, 500);
  }

  requestApproval(): void {
    if (this.approvalForm.valid) {
      const request = this.approvalForm.value;
      // In real app, call API
      this.toastService.success('Approval request submitted');
      this.approvalForm.reset();
      this.loadApprovals();
    }
  }

  approveRequest(approvalId: string): void {
    // In real app, call API
    this.toastService.success('Approval granted');
    this.loadApprovals();
  }

  rejectRequest(approvalId: string): void {
    // In real app, call API
    this.toastService.warning('Approval rejected');
    this.loadApprovals();
  }
}

