import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ToolService } from '../../services/tool.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatIconModule
  ],
  template: `
    <div class="audit-log-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Audit Log</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="auditLogs" class="audit-table">
            <ng-container matColumnDef="timestamp">
              <th mat-header-cell *matHeaderCellDef>Timestamp</th>
              <td mat-cell *matCellDef="let log">{{ log.timestamp | date:'short' }}</td>
            </ng-container>

            <ng-container matColumnDef="event">
              <th mat-header-cell *matHeaderCellDef>Event</th>
              <td mat-cell *matCellDef="let log">
                <mat-chip [class]="'event-' + log.eventType">{{ log.event }}</mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="user">
              <th mat-header-cell *matHeaderCellDef>User</th>
              <td mat-cell *matCellDef="let log">{{ log.user }}</td>
            </ng-container>

            <ng-container matColumnDef="details">
              <th mat-header-cell *matHeaderCellDef>Details</th>
              <td mat-cell *matCellDef="let log">{{ log.details }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>

          <div *ngIf="auditLogs.length === 0" class="empty-state">
            <p>No audit logs available</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .audit-log-container {
      padding: 16px;
    }
    .audit-table {
      width: 100%;
    }
    .event-create {
      background-color: #4caf50;
      color: white;
    }
    .event-update {
      background-color: #2196f3;
      color: white;
    }
    .event-delete {
      background-color: #f44336;
      color: white;
    }
    .event-security {
      background-color: #ff9800;
      color: white;
    }
    .empty-state {
      padding: 40px;
      text-align: center;
      color: #999;
    }
  `]
})
export class AuditLogComponent implements OnInit {
  @Input() toolId: string = '';
  auditLogs: any[] = [];
  displayedColumns: string[] = ['timestamp', 'event', 'user', 'details'];

  constructor(private toolService: ToolService) {}

  ngOnInit(): void {
    if (this.toolId) {
      this.loadAuditLogs();
    }
  }

  loadAuditLogs(): void {
    this.toolService.getToolAudit(this.toolId).subscribe({
      next: (logs) => {
        this.auditLogs = logs;
      },
      error: (err) => {
        console.error('Error loading audit logs:', err);
      }
    });
  }
}

