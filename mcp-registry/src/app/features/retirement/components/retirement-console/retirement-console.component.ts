import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { RetirementService } from '../../services/retirement.service';
import { ToolService } from '../../../tools/services/tool.service';
import { Tool } from '../../../../shared/models/tool.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-retirement-console',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="retirement-console">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Retirement Console</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <app-loading-spinner *ngIf="loading" message="Loading retirement data..."></app-loading-spinner>
          <app-error-display 
            *ngIf="error && !loading" 
            [title]="'Failed to Load Data'"
            [message]="error"
            [showRetry]="true"
            (onRetry)="loadOrphans()">
          </app-error-display>

          <div *ngIf="!loading && !error">
            <h3>Orphan Tools</h3>
            <p>Tools without an owning team or with missing metadata</p>
            
            <table mat-table [dataSource]="orphans" class="orphans-table">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Tool Name</th>
                <td mat-cell *matCellDef="let tool">
                  <a [routerLink]="['/tools', tool.toolId]">{{ tool.name }}</a>
                </td>
              </ng-container>

              <ng-container matColumnDef="reason">
                <th mat-header-cell *matHeaderCellDef>Reason</th>
                <td mat-cell *matCellDef="let tool">
                  <mat-chip>{{ getOrphanReason(tool) }}</mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="retirementDate">
                <th mat-header-cell *matHeaderCellDef>Scheduled Retirement</th>
                <td mat-cell *matCellDef="let tool">
                  {{ tool.retirementPlan?.retirementDate || 'Not scheduled' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let tool">
                  <button mat-button [routerLink]="['/retirement/schedule', tool.toolId]">
                    <mat-icon>schedule</mat-icon>
                    Schedule
                  </button>
                  <button mat-button (click)="assignOwner(tool)">
                    <mat-icon>person_add</mat-icon>
                    Assign Owner
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>

            <app-empty-state
              *ngIf="orphans.length === 0"
              icon="check_circle"
              title="No Orphan Tools"
              message="All tools have proper ownership and metadata.">
            </app-empty-state>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .retirement-console {
      padding: 20px;
    }
    .orphans-table {
      width: 100%;
    }
    .orphans-table a {
      text-decoration: none;
      color: inherit;
    }
    .orphans-table a:hover {
      text-decoration: underline;
    }
    h3 {
      margin-top: 24px;
      margin-bottom: 12px;
    }
  `]
})
export class RetirementConsoleComponent implements OnInit {
  orphans: Tool[] = [];
  loading: boolean = false;
  error: string | null = null;
  displayedColumns: string[] = ['name', 'reason', 'retirementDate', 'actions'];

  constructor(
    private retirementService: RetirementService,
    private toolService: ToolService
  ) {}

  ngOnInit(): void {
    this.loadOrphans();
  }

  loadOrphans(): void {
    this.loading = true;
    this.error = null;
    this.retirementService.getOrphans().subscribe({
      next: (orphans) => {
        this.orphans = orphans;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.message || 'Failed to load orphan tools';
        this.loading = false;
      }
    });
  }

  getOrphanReason(tool: Tool): string {
    if (!tool.ownerTeam || tool.ownerTeam.trim() === '') {
      return 'No Owner';
    }
    if (!tool.description || tool.description.trim() === '') {
      return 'Missing Description';
    }
    if (!tool.contact || tool.contact.trim() === '') {
      return 'Missing Contact';
    }
    return 'Orphan';
  }

  scheduleRetirement(tool: Tool): void {
    // Implementation for scheduling retirement
    console.log('Schedule retirement for:', tool.toolId);
  }

  assignOwner(tool: Tool): void {
    // Implementation for assigning owner
    console.log('Assign owner for:', tool.toolId);
  }
}

