import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { ObservabilityService, ObservabilityMetrics, TraceFilters } from '../../services/observability.service';
import { CustomDashboardService, CustomDashboard, DashboardWidget } from '../../services/custom-dashboard.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-custom-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatListModule,
    MatMenuModule,
    DragDropModule,
    BaseChartDirective,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="custom-dashboard-container">
      <div class="dashboard-header">
        <div class="header-left">
          <h2>Custom Dashboards</h2>
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            Create Dashboard
          </button>
        </div>
        <div class="header-right" *ngIf="currentDashboard">
          <mat-form-field>
            <mat-label>Select Dashboard</mat-label>
            <mat-select [(ngModel)]="selectedDashboardId" (selectionChange)="loadDashboard()">
              <mat-option *ngFor="let dashboard of dashboards" [value]="dashboard.id">
                {{ dashboard.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-icon-button [matMenuTriggerFor]="dashboardMenu">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #dashboardMenu="matMenu">
            <button mat-menu-item (click)="editDashboard()">
              <mat-icon>edit</mat-icon>
              Edit Dashboard
            </button>
            <button mat-menu-item (click)="duplicateDashboard()">
              <mat-icon>content_copy</mat-icon>
              Duplicate
            </button>
            <button mat-menu-item (click)="deleteDashboard()">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
          </mat-menu>
        </div>
      </div>

      <div *ngIf="!currentDashboard && dashboards.length === 0" class="empty-state">
        <p>No custom dashboards yet. Create your first dashboard to get started.</p>
      </div>

      <div *ngIf="currentDashboard" class="dashboard-content">
        <div class="dashboard-toolbar">
          <button mat-button (click)="toggleEditMode()">
            <mat-icon>{{ editMode ? 'check' : 'edit' }}</mat-icon>
            {{ editMode ? 'Done Editing' : 'Edit Layout' }}
          </button>
          <button mat-button (click)="refreshDashboard()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>

        <div class="widgets-grid" [class.edit-mode]="editMode" cdkDropList (cdkDropListDropped)="drop($event)">
          <div
            *ngFor="let widget of currentDashboard.widgets"
            class="widget-container"
            cdkDrag
            [cdkDragDisabled]="!editMode">
            <mat-card class="widget-card">
              <mat-card-header>
                <div class="widget-header">
                  <mat-card-title>{{ widget.title }}</mat-card-title>
                  <div class="widget-actions" *ngIf="editMode">
                    <button mat-icon-button (click)="configureWidget(widget)">
                      <mat-icon>settings</mat-icon>
                    </button>
                    <button mat-icon-button (click)="removeWidget(widget.id)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </div>
              </mat-card-header>
              <mat-card-content>
                <div class="widget-content">
                  <!-- Metric Widget -->
                  <div *ngIf="widget.type === 'metric'" class="metric-widget">
                    <div class="metric-value">{{ getMetricValue(widget.config?.metric) }}</div>
                    <div class="metric-label">{{ widget.config?.label || widget.title }}</div>
                  </div>

                  <!-- Chart Widget -->
                  <div *ngIf="widget.type === 'chart'" class="chart-widget">
                    <canvas
                      baseChart
                      [data]="getChartData(widget)"
                      [options]="chartOptions"
                      [type]="widget.config?.chartType || 'line'">
                    </canvas>
                  </div>

                  <!-- Table Widget -->
                  <div *ngIf="widget.type === 'table'" class="table-widget">
                    <table class="widget-table">
                      <thead>
                        <tr>
                          <th *ngFor="let col of widget.config?.columns">{{ col }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let row of getTableData(widget)">
                          <td *ngFor="let col of widget.config?.columns">{{ row[col] }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
            <div *cdkDragPlaceholder class="widget-placeholder"></div>
          </div>
        </div>

        <div class="add-widget-section" *ngIf="editMode">
          <button mat-raised-button (click)="openAddWidgetDialog()">
            <mat-icon>add</mat-icon>
            Add Widget
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-dashboard-container {
      padding: 20px;
    }
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .empty-state {
      padding: 40px;
      text-align: center;
      color: #999;
    }
    .dashboard-content {
      margin-top: 24px;
    }
    .dashboard-toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .widgets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }
    .widgets-grid.edit-mode .widget-container {
      cursor: move;
    }
    .widget-container {
      position: relative;
    }
    .widget-card {
      height: 100%;
    }
    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .widget-actions {
      display: flex;
      gap: 4px;
    }
    .widget-content {
      padding: 16px 0;
    }
    .metric-widget {
      text-align: center;
    }
    .metric-value {
      font-size: 48px;
      font-weight: bold;
      color: #6366f1;
      margin-bottom: 8px;
    }
    .metric-label {
      font-size: 14px;
      color: #666;
    }
    .chart-widget {
      position: relative;
      height: 300px;
      width: 100%;
    }
    .table-widget {
      overflow-x: auto;
    }
    .widget-table {
      width: 100%;
      border-collapse: collapse;
    }
    .widget-table th,
    .widget-table td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .widget-table th {
      background: #f5f5f5;
      font-weight: 600;
    }
    .widget-placeholder {
      background: #f0f0f0;
      border: 2px dashed #ccc;
      min-height: 200px;
      margin-bottom: 24px;
    }
    .add-widget-section {
      text-align: center;
      padding: 24px;
      border: 2px dashed #ddd;
      border-radius: 8px;
    }
  `]
})
export class CustomDashboardComponent implements OnInit {
  dashboards: CustomDashboard[] = [];
  currentDashboard: CustomDashboard | null = null;
  selectedDashboardId: string | null = null;
  editMode = false;
  metrics: ObservabilityMetrics | null = null;
  loading = false;

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  };

  constructor(
    private customDashboardService: CustomDashboardService,
    private observabilityService: ObservabilityService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadDashboards();
    this.loadMetrics();
  }

  loadDashboards(): void {
    this.dashboards = this.customDashboardService.getDashboards();
    if (this.dashboards.length > 0 && !this.selectedDashboardId) {
      this.selectedDashboardId = this.dashboards[0].id;
      this.loadDashboard();
    }
  }

  loadDashboard(): void {
    if (!this.selectedDashboardId) return;
    this.currentDashboard = this.customDashboardService.getDashboard(this.selectedDashboardId);
  }

  loadMetrics(): void {
    this.observabilityService.getMetrics().subscribe({
      next: (metrics) => {
        this.metrics = metrics;
      }
    });
  }

  openCreateDialog(): void {
    const name = prompt('Enter dashboard name:');
    if (!name) return;

    const dashboard = this.customDashboardService.createDashboard(name);
    this.selectedDashboardId = dashboard.id;
    this.loadDashboards();
    this.loadDashboard();
    this.editMode = true;
  }

  editDashboard(): void {
    if (!this.currentDashboard) return;
    const newName = prompt('Enter new dashboard name:', this.currentDashboard.name);
    if (!newName) return;

    this.customDashboardService.updateDashboard(this.currentDashboard.id, { name: newName });
    this.loadDashboards();
    this.loadDashboard();
  }

  duplicateDashboard(): void {
    if (!this.currentDashboard) return;
    const newName = prompt('Enter name for duplicate:', `${this.currentDashboard.name} (Copy)`);
    if (!newName) return;

    const duplicate = this.customDashboardService.duplicateDashboard(this.currentDashboard.id, newName);
    this.selectedDashboardId = duplicate.id;
    this.loadDashboards();
    this.loadDashboard();
  }

  deleteDashboard(): void {
    if (!this.currentDashboard) return;
    if (!confirm(`Are you sure you want to delete "${this.currentDashboard.name}"?`)) return;

    this.customDashboardService.deleteDashboard(this.currentDashboard.id);
    this.currentDashboard = null;
    this.selectedDashboardId = null;
    this.loadDashboards();
    if (this.dashboards.length > 0) {
      this.selectedDashboardId = this.dashboards[0].id;
      this.loadDashboard();
    }
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode && this.currentDashboard) {
      this.customDashboardService.updateDashboard(this.currentDashboard.id, {
        widgets: this.currentDashboard.widgets
      });
    }
  }

  openAddWidgetDialog(): void {
    const type = prompt('Widget type (metric/chart/table):');
    if (!type || !['metric', 'chart', 'table'].includes(type)) return;

    const title = prompt('Widget title:');
    if (!title) return;

    const widget: DashboardWidget = {
      id: this.generateId(),
      type: type as 'metric' | 'chart' | 'table',
      title,
      config: {}
    };

    if (this.currentDashboard) {
      this.currentDashboard.widgets.push(widget);
      this.customDashboardService.updateDashboard(this.currentDashboard.id, {
        widgets: this.currentDashboard.widgets
      });
    }
  }

  configureWidget(widget: DashboardWidget): void {
    // Simple configuration - could be enhanced with a proper dialog
    const newTitle = prompt('Widget title:', widget.title);
    if (newTitle) {
      widget.title = newTitle;
      if (this.currentDashboard) {
        this.customDashboardService.updateDashboard(this.currentDashboard.id, {
          widgets: this.currentDashboard.widgets
        });
      }
    }
  }

  removeWidget(widgetId: string): void {
    if (!this.currentDashboard) return;
    this.currentDashboard.widgets = this.currentDashboard.widgets.filter(w => w.id !== widgetId);
    this.customDashboardService.updateDashboard(this.currentDashboard.id, {
      widgets: this.currentDashboard.widgets
    });
  }

  drop(event: CdkDragDrop<DashboardWidget[]>): void {
    if (!this.currentDashboard) return;
    moveItemInArray(this.currentDashboard.widgets, event.previousIndex, event.currentIndex);
  }

  refreshDashboard(): void {
    this.loadMetrics();
  }

  getMetricValue(metric?: string): string {
    if (!this.metrics || !metric) return 'N/A';
    
    switch (metric) {
      case 'totalTraces':
        return this.metrics.totalTraces.toString();
      case 'successRate':
        return `${(this.metrics.successRate * 100).toFixed(1)}%`;
      case 'averageLatency':
        return `${this.metrics.averageLatency}ms`;
      case 'totalCost':
        return `$${this.metrics.totalCost.toFixed(2)}`;
      case 'errorRate':
        return `${(this.metrics.errorRate * 100).toFixed(1)}%`;
      default:
        return 'N/A';
    }
  }

  getChartData(widget: DashboardWidget): ChartConfiguration['data'] {
    if (!this.metrics) {
      return { labels: [], datasets: [] };
    }

    const chartType = widget.config?.chartType || 'line';
    const dataType = widget.config?.dataType || 'tracesOverTime';

    if (dataType === 'tracesOverTime' && this.metrics.tracesOverTime) {
      return {
        labels: this.metrics.tracesOverTime.map(t => new Date(t.date).toLocaleDateString()),
        datasets: [{
          data: this.metrics.tracesOverTime.map(t => t.count),
          label: 'Traces',
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgba(99, 102, 241, 1)'
        }]
      };
    }

    if (dataType === 'latencyTrend' && this.metrics.latencyTrend) {
      return {
        labels: this.metrics.latencyTrend.map(t => new Date(t.date).toLocaleDateString()),
        datasets: [{
          data: this.metrics.latencyTrend.map(t => t.latency),
          label: 'Latency (ms)',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgba(34, 197, 94, 1)'
        }]
      };
    }

    return { labels: [], datasets: [] };
  }

  getTableData(widget: DashboardWidget): any[] {
    // Return sample table data - could be enhanced to fetch real data
    return [];
  }

  private generateId(): string {
    return `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

