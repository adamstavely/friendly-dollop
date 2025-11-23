import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { ObservabilityService } from '../../services/observability.service';
import { LangFuseTrace } from '../../../../shared/models/langfuse.model';

@Component({
  selector: 'app-trace-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTableModule, MatCardModule],
  template: `
    <div class="trace-list-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Traces</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="traces">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let trace">
                <a [routerLink]="['/observability/traces', trace.id]">{{ trace.name }}</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="timestamp">
              <th mat-header-cell *matHeaderCellDef>Timestamp</th>
              <td mat-cell *matCellDef="let trace">{{ trace.timestamp | date:'short' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['name', 'timestamp']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['name', 'timestamp']"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`.trace-list-container { padding: 20px; }`]
})
export class TraceListComponent implements OnInit {
  traces: LangFuseTrace[] = [];

  constructor(private observabilityService: ObservabilityService) {}

  ngOnInit(): void {
    this.observabilityService.getTraces().subscribe({
      next: (result) => {
        this.traces = result.traces;
      }
    });
  }
}

