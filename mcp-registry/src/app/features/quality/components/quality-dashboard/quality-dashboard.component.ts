import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { QualityService } from '../../services/quality.service';
import { ToolService } from '../../../tools/services/tool.service';
import { Tool } from '../../../../shared/models/tool.model';
import { QualityScoreComponent } from '../../../../shared/components/quality-score/quality-score.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { QualityMetricsComponent } from '../quality-metrics/quality-metrics.component';
import { QualityTrendsComponent } from '../quality-trends/quality-trends.component';

@Component({
  selector: 'app-quality-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    QualityScoreComponent,
    LoadingSpinnerComponent,
    QualityMetricsComponent,
    QualityTrendsComponent
  ],
  template: `
    <div class="quality-dashboard">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Quality Dashboard</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <app-loading-spinner *ngIf="loading" message="Loading quality data..."></app-loading-spinner>
          
          <div *ngIf="!loading">
            <h3>Quality Trends Overview</h3>
            <app-quality-trends></app-quality-trends>

            <h3>Quality Ranking</h3>
            <table mat-table [dataSource]="sortedTools" matSort (matSortChange)="sortData($event)" class="quality-table">
              <ng-container matColumnDef="rank">
                <th mat-header-cell *matHeaderCellDef>Rank</th>
                <td mat-cell *matCellDef="let tool; let i = index">{{ i + 1 }}</td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="name">Tool Name</th>
                <td mat-cell *matCellDef="let tool">
                  <a [routerLink]="['/tools', tool.toolId]">{{ tool.name }}</a>
                </td>
              </ng-container>

              <ng-container matColumnDef="qualityScore">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="qualityScore">Quality Score</th>
                <td mat-cell *matCellDef="let tool">
                  <app-quality-score [score]="tool.qualityScore || 0"></app-quality-score>
                </td>
              </ng-container>

              <ng-container matColumnDef="successRate">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="successRate">Success Rate</th>
                <td mat-cell *matCellDef="let tool">
                  {{ tool.agentFeedback ? (tool.agentFeedback.successRate * 100).toFixed(2) + '%' : 'N/A' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="latency">
                <th mat-header-cell *matHeaderCellDef mat-sort-header="latency">Avg Latency</th>
                <td mat-cell *matCellDef="let tool">
                  {{ tool.agentFeedback ? tool.agentFeedback.avgLatencyMs + 'ms' : 'N/A' }}
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .quality-dashboard {
      padding: 20px;
    }
    .quality-table {
      width: 100%;
    }
    .quality-table a {
      text-decoration: none;
      color: inherit;
    }
    .quality-table a:hover {
      text-decoration: underline;
    }
  `]
})
export class QualityDashboardComponent implements OnInit {
  tools: Tool[] = [];
  sortedTools: Tool[] = [];
  loading: boolean = false;
  displayedColumns: string[] = ['rank', 'name', 'qualityScore', 'successRate', 'latency'];

  constructor(
    private qualityService: QualityService,
    private toolService: ToolService
  ) {}

  ngOnInit(): void {
    this.loadTools();
  }

  loadTools(): void {
    this.loading = true;
    this.toolService.getTools({ limit: 1000 }).subscribe({
      next: (response: any) => {
        this.tools = response.tools;
        this.sortedTools = [...this.tools].sort((a, b) => 
          (b.qualityScore || 0) - (a.qualityScore || 0)
        );
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading tools:', err);
        this.loading = false;
      }
    });
  }

  sortData(sort: Sort): void {
    const data = [...this.tools];
    if (!sort.active || sort.direction === '') {
      this.sortedTools = data.sort((a, b) => 
        (b.qualityScore || 0) - (a.qualityScore || 0)
      );
      return;
    }

    this.sortedTools = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name':
          return this.compare(a.name, b.name, isAsc);
        case 'qualityScore':
          return this.compare(a.qualityScore || 0, b.qualityScore || 0, isAsc);
        case 'successRate':
          return this.compare(
            a.agentFeedback?.successRate || 0,
            b.agentFeedback?.successRate || 0,
            isAsc
          );
        case 'latency':
          return this.compare(
            a.agentFeedback?.avgLatencyMs || 0,
            b.agentFeedback?.avgLatencyMs || 0,
            isAsc
          );
        default:
          return 0;
      }
    });
  }

  compare(a: number | string, b: number | string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
}

