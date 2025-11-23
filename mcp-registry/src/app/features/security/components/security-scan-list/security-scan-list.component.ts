import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { AISecurityService } from '../../services/ai-security.service';
import { SecurityScan } from '../../../../shared/models/security.model';

@Component({
  selector: 'app-security-scan-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTableModule, MatCardModule],
  template: `
    <div class="scan-list-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Security Scans</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="scans">
            <ng-container matColumnDef="traceId">
              <th mat-header-cell *matHeaderCellDef>Trace ID</th>
              <td mat-cell *matCellDef="let scan">
                <a [routerLink]="['/security/scans', scan.id]">{{ scan.traceId }}</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="score">
              <th mat-header-cell *matHeaderCellDef>Score</th>
              <td mat-cell *matCellDef="let scan">{{ scan.score }}/100</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['traceId', 'score']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['traceId', 'score']"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`.scan-list-container { padding: 20px; }`]
})
export class SecurityScanListComponent implements OnInit {
  scans: SecurityScan[] = [];

  constructor(private securityService: AISecurityService) {}

  ngOnInit(): void {
    this.securityService.getSecurityScans().subscribe({
      next: (scans) => {
        this.scans = scans;
      }
    });
  }
}

