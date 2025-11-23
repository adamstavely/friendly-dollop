import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { ToolService } from '../../services/tool.service';
import { Tool } from '../../../../shared/models/tool.model';
import { LifecycleStateComponent } from '../../../../shared/components/lifecycle-state/lifecycle-state.component';
import { QualityScoreComponent } from '../../../../shared/components/quality-score/quality-score.component';
import { ComplianceTagsComponent } from '../../../../shared/components/compliance-tags/compliance-tags.component';

@Component({
  selector: 'app-tool-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatExpansionModule,
    LifecycleStateComponent,
    QualityScoreComponent,
    ComplianceTagsComponent
  ],
  template: `
    <div class="tool-detail-container" *ngIf="tool">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ tool.name }}</mat-card-title>
          <mat-card-subtitle>{{ tool.domain }} • {{ tool.toolId }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="tool-header">
            <div class="tool-meta">
              <app-lifecycle-state [state]="tool.lifecycleState || 'development'"></app-lifecycle-state>
              <app-quality-score [score]="tool.qualityScore || 0"></app-quality-score>
              <app-compliance-tags [tags]="tool.complianceTags || []"></app-compliance-tags>
            </div>
            <div class="tool-actions">
              <button mat-raised-button color="primary" [routerLink]="['/tools', tool.toolId, 'edit']">
                <mat-icon>edit</mat-icon>
                Edit
              </button>
              <button mat-raised-button color="accent" (click)="promoteTool()" *ngIf="canPromote()">
                <mat-icon>arrow_upward</mat-icon>
                Promote
              </button>
            </div>
          </div>

          <mat-tab-group>
            <mat-tab label="Overview">
              <div class="tab-content">
                <h3>Description</h3>
                <p>{{ tool.description }}</p>

                <h3>Metadata</h3>
                <mat-list>
                  <mat-list-item>
                    <span matListItemTitle>Owner Team</span>
                    <span matListItemLine>{{ tool.ownerTeam }}</span>
                  </mat-list-item>
                  <mat-list-item>
                    <span matListItemTitle>Contact</span>
                    <span matListItemLine>{{ tool.contact }}</span>
                  </mat-list-item>
                  <mat-list-item>
                    <span matListItemTitle>Security Class</span>
                    <span matListItemLine>{{ tool.securityClass }}</span>
                  </mat-list-item>
                  <mat-list-item>
                    <span matListItemTitle>Capabilities</span>
                    <span matListItemLine>
                      <mat-chip *ngFor="let cap of tool.capabilities">{{ cap }}</mat-chip>
                    </span>
                  </mat-list-item>
                  <mat-list-item>
                    <span matListItemTitle>Tags</span>
                    <span matListItemLine>
                      <mat-chip *ngFor="let tag of tool.tags">{{ tag }}</mat-chip>
                    </span>
                  </mat-list-item>
                </mat-list>
              </div>
            </mat-tab>

            <mat-tab label="Versions">
              <div class="tab-content">
                <mat-expansion-panel *ngFor="let version of tool.versions">
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      v{{ version.version }}
                      <mat-chip *ngIf="version.deprecated" class="deprecated">Deprecated</mat-chip>
                    </mat-panel-title>
                    <mat-panel-description>
                      {{ version.deployment?.env || 'N/A' }}
                    </mat-panel-description>
                  </mat-expansion-panel-header>
                  <div>
                    <p><strong>Status:</strong> {{ version.health?.status || 'unknown' }}</p>
                    <p><strong>Last Check:</strong> {{ version.health?.lastCheck || 'N/A' }}</p>
                    <p><strong>Endpoint:</strong> {{ version.deployment?.endpoint || 'N/A' }}</p>
                  </div>
                </mat-expansion-panel>
              </div>
            </mat-tab>

            <mat-tab label="Dependencies">
              <div class="tab-content">
                <h3>Dependencies</h3>
                <mat-list *ngIf="tool.dependencyGraph">
                  <mat-list-item *ngFor="let dep of tool.dependencyGraph.dependsOnTools">
                    <a [routerLink]="['/tools', dep]">{{ dep }}</a>
                  </mat-list-item>
                </mat-list>

                <h3>Reverse Dependencies</h3>
                <mat-list *ngIf="tool.reverseDependencies && tool.reverseDependencies.length > 0">
                  <mat-list-item *ngFor="let revDep of tool.reverseDependencies">
                    <a [routerLink]="['/tools', revDep]">{{ revDep }}</a>
                  </mat-list-item>
                </mat-list>
              </div>
            </mat-tab>

            <mat-tab label="Quality & Feedback">
              <div class="tab-content">
                <h3>Quality Metrics</h3>
                <div *ngIf="tool.agentFeedback">
                  <p>Success Rate: {{ (tool.agentFeedback.successRate * 100).toFixed(2) }}%</p>
                  <p>Average Latency: {{ tool.agentFeedback.avgLatencyMs }}ms</p>
                  <p>Failure Rate: {{ (tool.agentFeedback.failureRate * 100).toFixed(2) }}%</p>
                </div>
              </div>
            </mat-tab>

            <mat-tab label="Rate Limits">
              <div class="tab-content" *ngIf="tool.rateLimits">
                <mat-list>
                  <mat-list-item>
                    <span matListItemTitle>Max Per Minute</span>
                    <span matListItemLine>{{ tool.rateLimits.maxPerMinute || 'N/A' }}</span>
                  </mat-list-item>
                  <mat-list-item>
                    <span matListItemTitle>Max Concurrency</span>
                    <span matListItemLine>{{ tool.rateLimits.maxConcurrency || 'N/A' }}</span>
                  </mat-list-item>
                  <mat-list-item>
                    <span matListItemTitle>Timeout (ms)</span>
                    <span matListItemLine>{{ tool.rateLimits.timeoutMs || 'N/A' }}</span>
                  </mat-list-item>
                  <mat-list-item>
                    <span matListItemTitle>Retry Policy</span>
                    <span matListItemLine>{{ tool.rateLimits.retryPolicy || 'N/A' }}</span>
                  </mat-list-item>
                </mat-list>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .tool-detail-container {
      padding: 20px;
    }
    .tool-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .tool-meta {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .tool-actions {
      display: flex;
      gap: 8px;
    }
    .tab-content {
      padding: 20px;
    }
    .tab-content h3 {
      margin-top: 20px;
      margin-bottom: 10px;
    }
  `]
})
export class ToolDetailComponent implements OnInit {
  tool: Tool | null = null;

  constructor(
    private route: ActivatedRoute,
    private toolService: ToolService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTool(id);
    }
  }

  loadTool(id: string): void {
    this.toolService.getToolById(id).subscribe({
      next: (tool) => {
        this.tool = tool;
      },
      error: (err) => {
        console.error('Error loading tool:', err);
      }
    });
  }

  canPromote(): boolean {
    if (!this.tool) return false;
    const state = this.tool.lifecycleState || 'development';
    return state !== 'production' && state !== 'retired';
  }

  promoteTool(): void {
    if (!this.tool) return;
    // Implementation for promotion workflow
    console.log('Promote tool:', this.tool.toolId);
  }
}

