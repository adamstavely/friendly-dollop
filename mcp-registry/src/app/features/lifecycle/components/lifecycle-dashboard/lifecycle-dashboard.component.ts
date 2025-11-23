import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { LifecycleService } from '../../services/lifecycle.service';
import { ToolService } from '../../../tools/services/tool.service';
import { Tool } from '../../../../shared/models/tool.model';
import { LifecycleStateComponent } from '../../../../shared/components/lifecycle-state/lifecycle-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-lifecycle-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatTabsModule,
    MatChipsModule,
    MatGridListModule,
    LifecycleStateComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="lifecycle-dashboard">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Lifecycle Management Dashboard</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <app-loading-spinner *ngIf="loading" message="Loading lifecycle data..."></app-loading-spinner>
          
          <div *ngIf="!loading">
            <div class="metrics">
              <mat-chip>Development: {{ getCountByState('development') }}</mat-chip>
              <mat-chip>Staging: {{ getCountByState('staging') }}</mat-chip>
              <mat-chip>Pilot: {{ getCountByState('pilot') }}</mat-chip>
              <mat-chip>Production: {{ getCountByState('production') }}</mat-chip>
              <mat-chip>Deprecated: {{ getCountByState('deprecated') }}</mat-chip>
              <mat-chip>Retired: {{ getCountByState('retired') }}</mat-chip>
            </div>

            <mat-tab-group>
              <mat-tab *ngFor="let state of states" [label]="state | titlecase">
                <div class="tools-grid">
                  <mat-card *ngFor="let tool of getToolsByState(state)" class="tool-card">
                    <mat-card-header>
                      <mat-card-title>
                        <a [routerLink]="['/tools', tool.toolId]">{{ tool.name }}</a>
                      </mat-card-title>
                      <mat-card-subtitle>
                        <app-lifecycle-state [state]="tool.lifecycleState || 'development'"></app-lifecycle-state>
                      </mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <p>{{ tool.description }}</p>
                      <div class="tool-meta">
                        <span>Owner: {{ tool.ownerTeam }}</span>
                        <span>Domain: {{ tool.domain }}</span>
                      </div>
                    </mat-card-content>
                    <mat-card-actions>
                      <button mat-button [routerLink]="['/tools', tool.toolId]">View</button>
                      <button mat-button *ngIf="canPromote(tool)" (click)="promoteTool(tool)">
                        Promote
                      </button>
                    </mat-card-actions>
                  </mat-card>
                </div>
              </mat-tab>
            </mat-tab-group>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .lifecycle-dashboard {
      padding: 20px;
    }
    .metrics {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }
    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    .tool-card {
      height: 100%;
    }
    .tool-card a {
      text-decoration: none;
      color: inherit;
    }
    .tool-card a:hover {
      text-decoration: underline;
    }
    .tool-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #666;
      margin-top: 8px;
    }
  `]
})
export class LifecycleDashboardComponent implements OnInit {
  tools: Tool[] = [];
  loading: boolean = false;
  states = ['development', 'staging', 'pilot', 'production', 'deprecated', 'retired'];

  constructor(
    private lifecycleService: LifecycleService,
    private toolService: ToolService
  ) {}

  ngOnInit(): void {
    this.loadTools();
  }

  loadTools(): void {
    this.loading = true;
    this.toolService.getTools({ limit: 1000 }).subscribe({
      next: (response) => {
        this.tools = response.tools;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading tools:', err);
        this.loading = false;
      }
    });
  }

  getCountByState(state: string): number {
    return this.tools.filter(t => (t.lifecycleState || 'development') === state).length;
  }

  getToolsByState(state: string): Tool[] {
    return this.tools.filter(t => (t.lifecycleState || 'development') === state);
  }

  canPromote(tool: Tool): boolean {
    const state = tool.lifecycleState || 'development';
    return state !== 'production' && state !== 'retired';
  }

  promoteTool(tool: Tool): void {
    // Navigate to promotion workflow or open dialog
    console.log('Promote tool:', tool.toolId);
  }
}

