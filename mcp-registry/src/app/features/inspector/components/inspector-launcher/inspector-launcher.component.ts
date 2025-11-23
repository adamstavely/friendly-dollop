import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Tool, ToolVersion } from '../../../../shared/models/tool.model';
import { InspectorService } from '../../services/inspector.service';
import { TransportType } from '../../../../shared/models/inspector.model';

@Component({
  selector: 'app-inspector-launcher',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card *ngIf="tool">
      <mat-card-header>
        <mat-card-title>MCP Inspector</mat-card-title>
        <mat-card-subtitle>Test and inspect this MCP server</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div *ngIf="!canInspect" class="warning-message">
          <mat-icon>warning</mat-icon>
          <p>This tool cannot be inspected. A valid deployment endpoint is required.</p>
        </div>

        <div *ngIf="canInspect" class="inspector-info">
          <div class="info-row">
            <span class="label">Transport Type:</span>
            <mat-chip>{{ transportType || 'Unknown' }}</mat-chip>
          </div>
          <div class="info-row" *ngIf="endpoint">
            <span class="label">Endpoint:</span>
            <span class="value">{{ endpoint }}</span>
          </div>
          <div class="info-row" *ngIf="selectedVersion">
            <span class="label">Version:</span>
            <span class="value">v{{ selectedVersion.version }}</span>
          </div>
        </div>

        <div class="actions" *ngIf="canInspect">
          <button 
            mat-raised-button 
            color="primary" 
            (click)="launchInspector()"
            [disabled]="!canInspect">
            <mat-icon>open_in_new</mat-icon>
            Launch Inspector
          </button>
          <button 
            mat-stroked-button 
            (click)="downloadConfig()"
            [disabled]="!canInspect">
            <mat-icon>download</mat-icon>
            Download Config
          </button>
        </div>

        <div *ngIf="tool.versions && tool.versions.length > 1" class="version-selector">
          <p><strong>Select Version:</strong></p>
          <div class="version-chips">
            <mat-chip 
              *ngFor="let version of tool.versions" 
              [class.selected]="selectedVersion?.version === version.version"
              (click)="selectVersion(version)">
              v{{ version.version }}
            </mat-chip>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    mat-card {
      margin: 16px 0;
    }
    .warning-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: #fff3cd;
      border-radius: 4px;
      margin-bottom: 16px;
    }
    .warning-message mat-icon {
      color: #856404;
    }
    .inspector-info {
      margin-bottom: 16px;
    }
    .info-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .label {
      font-weight: 500;
      min-width: 120px;
    }
    .value {
      color: #666;
      word-break: break-all;
    }
    .actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }
    .version-selector {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
    }
    .version-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    .version-chips mat-chip {
      cursor: pointer;
    }
    .version-chips mat-chip.selected {
      background-color: #7b1fa2;
      color: white;
    }
  `]
})
export class InspectorLauncherComponent implements OnInit {
  @Input() tool!: Tool;
  @Input() initialVersion?: ToolVersion;

  canInspect: boolean = false;
  transportType: TransportType | null = null;
  endpoint: string | null = null;
  selectedVersion: ToolVersion | null = null;

  constructor(
    private inspectorService: InspectorService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.tool) {
      this.selectedVersion = this.initialVersion || this.getLatestVersion();
      this.updateInspectionStatus();
    }
  }

  selectVersion(version: ToolVersion): void {
    this.selectedVersion = version;
    this.updateInspectionStatus();
  }

  private updateInspectionStatus(): void {
    if (!this.tool || !this.selectedVersion) {
      this.canInspect = false;
      return;
    }

    this.canInspect = this.inspectorService.canInspectTool(this.tool, this.selectedVersion);
    this.transportType = this.inspectorService.detectTransportType(this.tool, this.selectedVersion);
    this.endpoint = this.selectedVersion.deployment?.endpoint || null;
  }

  launchInspector(): void {
    if (!this.canInspect || !this.tool || !this.selectedVersion) {
      return;
    }

    try {
      this.inspectorService.launchInspectorForTool(this.tool, this.selectedVersion, this.transportType || undefined);
      this.snackBar.open('Opening Inspector in new tab...', 'Close', {
        duration: 3000
      });
    } catch (error) {
      console.error('Error launching Inspector:', error);
      this.snackBar.open('Failed to launch Inspector', 'Close', {
        duration: 5000
      });
    }
  }

  downloadConfig(): void {
    if (!this.canInspect || !this.tool || !this.selectedVersion) {
      return;
    }

    const config = this.inspectorService.generateInspectorConfig(this.tool, this.selectedVersion);
    if (!config) {
      this.snackBar.open('Failed to generate config', 'Close', {
        duration: 3000
      });
      return;
    }

    const filename = `${this.tool.toolId}-mcp-config.json`;
    this.inspectorService.downloadConfigFile(config, filename);
    this.snackBar.open('Config file downloaded', 'Close', {
      duration: 3000
    });
  }

  private getLatestVersion(): ToolVersion | null {
    if (!this.tool?.versions || this.tool.versions.length === 0) {
      return null;
    }
    return this.tool.versions[this.tool.versions.length - 1];
  }
}

