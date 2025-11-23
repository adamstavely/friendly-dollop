import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { PolicyService } from '../../services/policy.service';
import { ToolService } from '../../../tools/services/tool.service';
import { Tool } from '../../../../shared/models/tool.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';

@Component({
  selector: 'app-policy-viewer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatListModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    LoadingSpinnerComponent,
    ErrorDisplayComponent
  ],
  template: `
    <div class="policy-viewer">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Policies & Rate Limits</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="view-controls">
            <mat-form-field>
              <mat-label>Filter by Tool</mat-label>
              <mat-select [(ngModel)]="selectedToolId" (selectionChange)="loadPolicy()">
                <mat-option value="">All Tools</mat-option>
                <mat-option *ngFor="let tool of tools" [value]="tool.toolId">
                  {{ tool.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <app-loading-spinner *ngIf="loading" message="Loading policies..."></app-loading-spinner>
          <app-error-display 
            *ngIf="error && !loading" 
            [title]="'Failed to Load Policies'"
            [message]="error"
            [showRetry]="true"
            (onRetry)="loadPolicy()">
          </app-error-display>

          <div *ngIf="!loading && !error">
            <div *ngIf="selectedToolId && policy">
              <h3>Rate Limits</h3>
              <mat-list>
                <mat-list-item>
                  <span matListItemTitle>Max Per Minute</span>
                  <span matListItemLine>{{ policy.rateLimits?.maxPerMinute || 'Not set' }}</span>
                </mat-list-item>
                <mat-list-item>
                  <span matListItemTitle>Max Concurrency</span>
                  <span matListItemLine>{{ policy.rateLimits?.maxConcurrency || 'Not set' }}</span>
                </mat-list-item>
                <mat-list-item>
                  <span matListItemTitle>Timeout (ms)</span>
                  <span matListItemLine>{{ policy.rateLimits?.timeoutMs || 'Not set' }}</span>
                </mat-list-item>
                <mat-list-item>
                  <span matListItemTitle>Retry Policy</span>
                  <span matListItemLine>
                    <mat-chip>{{ policy.rateLimits?.retryPolicy || 'Not set' }}</mat-chip>
                  </span>
                </mat-list-item>
              </mat-list>

              <h3>Policy Details</h3>
              <mat-list>
                <mat-list-item *ngIf="policy.policyRef">
                  <span matListItemTitle>Policy Reference</span>
                  <span matListItemLine>{{ policy.policyRef }}</span>
                </mat-list-item>
                <mat-list-item *ngIf="policy.securityClass">
                  <span matListItemTitle>Security Class</span>
                  <span matListItemLine>
                    <mat-chip>{{ policy.securityClass }}</mat-chip>
                  </span>
                </mat-list-item>
              </mat-list>
            </div>

            <div *ngIf="!selectedToolId">
              <h3>All Tools Rate Limits Summary</h3>
              <table mat-table [dataSource]="toolsWithPolicies" class="policies-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Tool Name</th>
                  <td mat-cell *matCellDef="let tool">
                    <a [routerLink]="['/tools', tool.toolId]">{{ tool.name }}</a>
                  </td>
                </ng-container>

                <ng-container matColumnDef="maxPerMinute">
                  <th mat-header-cell *matHeaderCellDef>Max/Min</th>
                  <td mat-cell *matCellDef="let tool">
                    {{ tool.rateLimits?.maxPerMinute || 'N/A' }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="maxConcurrency">
                  <th mat-header-cell *matHeaderCellDef>Max Concurrency</th>
                  <td mat-cell *matCellDef="let tool">
                    {{ tool.rateLimits?.maxConcurrency || 'N/A' }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="timeout">
                  <th mat-header-cell *matHeaderCellDef>Timeout (ms)</th>
                  <td mat-cell *matCellDef="let tool">
                    {{ tool.rateLimits?.timeoutMs || 'N/A' }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="retryPolicy">
                  <th mat-header-cell *matHeaderCellDef>Retry Policy</th>
                  <td mat-cell *matCellDef="let tool">
                    <mat-chip>{{ tool.rateLimits?.retryPolicy || 'N/A' }}</mat-chip>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
              </table>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .policy-viewer {
      padding: 20px;
    }
    .view-controls {
      margin-bottom: 24px;
    }
    .policies-table {
      width: 100%;
    }
    .policies-table a {
      text-decoration: none;
      color: inherit;
    }
    .policies-table a:hover {
      text-decoration: underline;
    }
    h3 {
      margin-top: 24px;
      margin-bottom: 12px;
    }
  `]
})
export class PolicyViewerComponent implements OnInit {
  @Input() toolId?: string;
  selectedToolId: string = '';
  tools: Tool[] = [];
  toolsWithPolicies: Tool[] = [];
  policy: any = null;
  loading: boolean = false;
  error: string | null = null;
  displayedColumns: string[] = ['name', 'maxPerMinute', 'maxConcurrency', 'timeout', 'retryPolicy'];

  constructor(
    private policyService: PolicyService,
    private toolService: ToolService
  ) {}

  ngOnInit(): void {
    if (this.toolId) {
      this.selectedToolId = this.toolId;
      this.loadPolicy();
    } else {
      this.loadTools();
    }
  }

  loadTools(): void {
    this.loading = true;
    this.toolService.getTools({ limit: 1000 }).subscribe({
      next: (response: any) => {
        this.tools = response.tools;
        this.toolsWithPolicies = response.tools.filter((t: Tool) => t.rateLimits);
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.message || 'Failed to load tools';
        this.loading = false;
      }
    });
  }

  loadPolicy(): void {
    if (!this.selectedToolId) {
      this.policy = null;
      return;
    }

    this.loading = true;
    this.error = null;
    this.policyService.getPolicy(this.selectedToolId).subscribe({
      next: (policy) => {
        this.policy = policy;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.message || 'Failed to load policy';
        this.loading = false;
      }
    });
  }
}

