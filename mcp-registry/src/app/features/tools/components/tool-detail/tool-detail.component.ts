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
import { DatePipe } from '@angular/common';
import { ToolService } from '../../services/tool.service';
import { Tool } from '../../../../shared/models/tool.model';
import { LifecycleStateComponent } from '../../../../shared/components/lifecycle-state/lifecycle-state.component';
import { QualityScoreComponent } from '../../../../shared/components/quality-score/quality-score.component';
import { ComplianceTagsComponent } from '../../../../shared/components/compliance-tags/compliance-tags.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { ToolChangelogComponent } from '../tool-changelog/tool-changelog.component';
import { ToolSchemaViewerComponent } from '../tool-schema-viewer/tool-schema-viewer.component';
import { VersionDiffComponent } from '../version-diff/version-diff.component';
import { AuditLogComponent } from '../audit-log/audit-log.component';
import { InspectorLauncherComponent } from '../../../inspector/components/inspector-launcher/inspector-launcher.component';
import { InspectorService } from '../../../inspector/services/inspector.service';

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
    ComplianceTagsComponent,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
    ToolChangelogComponent,
    ToolSchemaViewerComponent,
    VersionDiffComponent,
    AuditLogComponent,
    InspectorLauncherComponent,
    DatePipe
  ],
  template: `
    <div class="tool-detail-container">
      <app-loading-spinner *ngIf="loading" message="Loading tool..."></app-loading-spinner>
      <app-error-display 
        *ngIf="error && !loading" 
        [title]="'Failed to Load Tool'"
        [message]="error"
        [showRetry]="true"
        (onRetry)="retryLoad()">
      </app-error-display>
      
      <div *ngIf="tool && !loading">
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
              <button mat-raised-button color="primary" (click)="launchInspector()" *ngIf="canInspectTool()">
                <mat-icon>bug_report</mat-icon>
                Inspect
              </button>
            </div>
          </div>

          <mat-tab-group>
            <mat-tab label="Overview">
              <div class="tab-content">
                <h3>Description</h3>
                <p>{{ tool.description }}</p>

                <h3>Health Status</h3>
                <div *ngIf="healthStatus" class="health-status">
                  <mat-chip [class]="'status-' + healthStatus.status">
                    {{ healthStatus.status || 'unknown' }}
                  </mat-chip>
                  <p *ngIf="healthStatus.lastCheck">
                    Last Check: {{ healthStatus.lastCheck | date:'short' }}
                  </p>
                  <p *ngIf="healthStatus.message">{{ healthStatus.message }}</p>
                </div>
                <p *ngIf="!healthStatus">Health status not available</p>

                <h3>Usage Analytics</h3>
                <div *ngIf="usageData" class="usage-analytics">
                  <mat-list>
                    <mat-list-item>
                      <span matListItemTitle>Total Calls</span>
                      <span matListItemLine>{{ usageData.totalCalls || 0 }}</span>
                    </mat-list-item>
                    <mat-list-item>
                      <span matListItemTitle>Success Rate</span>
                      <span matListItemLine>{{ (usageData.successRate * 100).toFixed(2) }}%</span>
                    </mat-list-item>
                    <mat-list-item>
                      <span matListItemTitle>Average Latency</span>
                      <span matListItemLine>{{ usageData.avgLatencyMs || 0 }}ms</span>
                    </mat-list-item>
                    <mat-list-item>
                      <span matListItemTitle>Last Used</span>
                      <span matListItemLine>{{ usageData.lastUsed | date:'short' }}</span>
                    </mat-list-item>
                  </mat-list>
                </div>
                <p *ngIf="!usageData">Usage data not available</p>

                <h3>Promotion Status</h3>
                <div *ngIf="tool.promotionRequirements && tool.promotionRequirements.length > 0">
                  <mat-list>
                    <mat-list-item *ngFor="let req of tool.promotionRequirements">
                      <span matListItemTitle>{{ req.name }}</span>
                      <span matListItemLine>
                        <mat-chip [class]="'status-' + req.status">{{ req.status }}</mat-chip>
                      </span>
                    </mat-list-item>
                  </mat-list>
                </div>
                <p *ngIf="!tool.promotionRequirements || tool.promotionRequirements.length === 0">
                  No promotion requirements defined
                </p>

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

            <mat-tab label="Changelog">
              <div class="tab-content">
                <app-tool-changelog [changelog]="tool.changelog || []"></app-tool-changelog>
              </div>
            </mat-tab>

            <mat-tab label="Schema">
              <div class="tab-content">
                <app-tool-schema-viewer 
                  [schemaJson]="getLatestSchema()"
                  [openApiJson]="getLatestOpenApi()">
                </app-tool-schema-viewer>
              </div>
            </mat-tab>

            <mat-tab label="Version Diff">
              <div class="tab-content">
                <app-version-diff [versions]="tool.versions || []"></app-version-diff>
              </div>
            </mat-tab>

            <mat-tab label="Audit Log">
              <div class="tab-content">
                <app-audit-log [toolId]="tool.toolId"></app-audit-log>
              </div>
            </mat-tab>

            <mat-tab label="Inspect">
              <div class="tab-content">
                <app-inspector-launcher [tool]="tool"></app-inspector-launcher>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
      </div>
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
    .health-status {
      padding: 16px;
      background: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 16px;
    }
    .status-healthy {
      background-color: #4caf50;
      color: white;
    }
    .status-unhealthy {
      background-color: #f44336;
      color: white;
    }
    .status-unknown {
      background-color: #9e9e9e;
      color: white;
    }
    .status-passed {
      background-color: #4caf50;
      color: white;
    }
    .status-failed {
      background-color: #f44336;
      color: white;
    }
    .status-pending {
      background-color: #ff9800;
      color: white;
    }
    .usage-analytics {
      margin-bottom: 16px;
    }
  `]
})
export class ToolDetailComponent implements OnInit {
  tool: Tool | null = null;
  loading: boolean = false;
  error: string | null = null;
  healthStatus: any = null;
  usageData: any = null;

  constructor(
    private route: ActivatedRoute,
    private toolService: ToolService,
    private inspectorService: InspectorService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTool(id);
    }
  }

  loadTool(id: string): void {
    this.loading = true;
    this.error = null;
    this.toolService.getToolById(id).subscribe({
      next: (tool) => {
        this.tool = tool;
        this.loading = false;
        this.loadHealthStatus(id);
        this.loadUsageData(id);
      },
      error: (err) => {
        console.error('Error loading tool:', err);
        this.error = err.message || 'Failed to load tool';
        this.loading = false;
      }
    });
  }

  retryLoad(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTool(id);
    }
  }

  loadHealthStatus(id: string): void {
    this.toolService.getToolHealth(id).subscribe({
      next: (health) => {
        this.healthStatus = health;
      },
      error: (err) => {
        console.error('Error loading health status:', err);
      }
    });
  }

  loadUsageData(id: string): void {
    this.toolService.getToolUsage(id).subscribe({
      next: (usage) => {
        this.usageData = usage;
      },
      error: (err) => {
        console.error('Error loading usage data:', err);
      }
    });
  }

  getLatestSchema(): any {
    if (!this.tool || !this.tool.versions || this.tool.versions.length === 0) {
      return null;
    }
    const latestVersion = this.tool.versions[this.tool.versions.length - 1];
    return latestVersion.schema;
  }

  getLatestOpenApi(): any {
    if (!this.tool || !this.tool.versions || this.tool.versions.length === 0) {
      return null;
    }
    const latestVersion = this.tool.versions[this.tool.versions.length - 1];
    return latestVersion.openapi;
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

  canInspectTool(): boolean {
    if (!this.tool) return false;
    return this.inspectorService.canInspectTool(this.tool);
  }

  launchInspector(): void {
    if (!this.tool) return;
    this.inspectorService.launchInspectorForTool(this.tool);
  }
}

