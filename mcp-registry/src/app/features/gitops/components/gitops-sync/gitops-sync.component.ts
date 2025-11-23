import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { DatePipe } from '@angular/common';
import { GitOpsService } from '../../services/gitops.service';
import { YamlEditorComponent } from '../yaml-editor/yaml-editor.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-gitops-sync',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    DatePipe,
    YamlEditorComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="gitops-sync">
      <mat-card>
        <mat-card-header>
          <mat-card-title>GitOps Integration</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="sync-controls">
            <button mat-raised-button color="primary" (click)="sync()" [disabled]="syncing">
              <mat-icon>sync</mat-icon>
              {{ syncing ? 'Syncing...' : 'Sync from Git' }}
            </button>
            <mat-chip *ngIf="lastSync">
              Last Sync: {{ lastSync | date:'short' }}
            </mat-chip>
          </div>

          <div *ngIf="syncStatus" class="sync-status">
            <h4>Sync Status</h4>
            <mat-list>
              <mat-list-item>
                <span matListItemTitle>Status</span>
                <span matListItemLine>
                  <mat-chip [class]="'status-' + syncStatus.status">
                    {{ syncStatus.status }}
                  </mat-chip>
                </span>
              </mat-list-item>
              <mat-list-item *ngIf="syncStatus.toolsAdded">
                <span matListItemTitle>Tools Added</span>
                <span matListItemLine>{{ syncStatus.toolsAdded }}</span>
              </mat-list-item>
              <mat-list-item *ngIf="syncStatus.toolsUpdated">
                <span matListItemTitle>Tools Updated</span>
                <span matListItemLine>{{ syncStatus.toolsUpdated }}</span>
              </mat-list-item>
              <mat-list-item *ngIf="syncStatus.errors && syncStatus.errors.length > 0">
                <span matListItemTitle>Errors</span>
                <span matListItemLine>
                  <mat-chip *ngFor="let error of syncStatus.errors" class="error-chip">
                    {{ error }}
                  </mat-chip>
                </span>
              </mat-list-item>
            </mat-list>
          </div>

          <h3>YAML Editor</h3>
          <app-yaml-editor></app-yaml-editor>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .gitops-sync {
      padding: 20px;
    }
    .sync-controls {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 24px;
    }
    .sync-status {
      margin-bottom: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .status-success {
      background-color: #4caf50;
      color: white;
    }
    .status-error {
      background-color: #f44336;
      color: white;
    }
    .status-pending {
      background-color: #ff9800;
      color: white;
    }
    .error-chip {
      background-color: #f44336;
      color: white;
      margin: 4px;
    }
  `]
})
export class GitOpsSyncComponent implements OnInit {
  syncing: boolean = false;
  lastSync: Date | null = null;
  syncStatus: any = null;

  constructor(private gitOpsService: GitOpsService) {}

  ngOnInit(): void {}

  sync(): void {
    this.syncing = true;
    this.gitOpsService.sync().subscribe({
      next: (result: any) => {
        this.syncStatus = result;
        this.lastSync = new Date();
        this.syncing = false;
      },
      error: (err: any) => {
        this.syncStatus = {
          status: 'error',
          errors: [err.message || 'Sync failed']
        };
        this.syncing = false;
      }
    });
  }
}

