import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DatePipe } from '@angular/common';
import { BundleService } from '../../services/bundle.service';
import { ToolService } from '../../../tools/services/tool.service';
import { Bundle } from '../../../../shared/models/bundle.model';
import { Tool } from '../../../../shared/models/tool.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { HelpTooltipComponent } from '../../../../shared/components/help-tooltip/help-tooltip.component';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';

@Component({
  selector: 'app-bundle-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatSlideToggleModule,
    DatePipe,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
    HelpTooltipComponent
  ],
  template: `
    <div class="bundle-detail">
      <app-loading-spinner *ngIf="loading" message="Loading bundle..."></app-loading-spinner>
      <app-error-display 
        *ngIf="error && !loading" 
        [title]="'Failed to Load Bundle'"
        [message]="error"
        [showRetry]="true"
        (onRetry)="retryLoad()">
      </app-error-display>

      <div *ngIf="bundle && !loading">
        <mat-card>
          <mat-card-header>
            <div class="header-content">
              <div>
                <mat-card-title>{{ bundle.name }}</mat-card-title>
                <mat-card-subtitle>Version {{ bundle.version }} • {{ bundle.bundleId }}</mat-card-subtitle>
              </div>
              <app-help-tooltip context="bundles" tooltip="Learn about bundles"></app-help-tooltip>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="bundle-header">
              <div class="bundle-meta">
                <mat-slide-toggle 
                  [checked]="bundle.active"
                  (change)="toggleActive($event.checked)">
                  {{ bundle.active ? 'Active' : 'Inactive' }}
                </mat-slide-toggle>
                <mat-chip>{{ bundle.toolIds.length }} tools</mat-chip>
              </div>
              <div class="bundle-actions">
                <button mat-raised-button color="primary" [routerLink]="['/bundles', bundle.bundleId, 'edit']">
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>
                <button mat-raised-button color="warn" (click)="deleteBundle()">
                  <mat-icon>delete</mat-icon>
                  Delete
                </button>
              </div>
            </div>

            <h3>Description</h3>
            <p>{{ bundle.description }}</p>

            <h3>Metadata</h3>
            <mat-list>
              <mat-list-item>
                <span matListItemTitle>Owner Team</span>
                <span matListItemLine>{{ bundle.ownerTeam }}</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>Version</span>
                <span matListItemLine>{{ bundle.version }}</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>Created</span>
                <span matListItemLine>{{ bundle.createdAt | date:'short' }}</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>Updated</span>
                <span matListItemLine>{{ bundle.updatedAt | date:'short' }}</span>
              </mat-list-item>
              <mat-list-item *ngIf="bundle.tags && bundle.tags.length > 0">
                <span matListItemTitle>Tags</span>
                <span matListItemLine>
                  <mat-chip *ngFor="let tag of bundle.tags">{{ tag }}</mat-chip>
                </span>
              </mat-list-item>
            </mat-list>

            <h3>Tools in Bundle</h3>
            <div *ngIf="tools.length > 0" class="tools-list">
              <mat-card *ngFor="let tool of tools" class="tool-card">
                <mat-card-header>
                  <mat-card-title>
                    <a [routerLink]="['/tools', tool.toolId]">{{ tool.name }}</a>
                  </mat-card-title>
                  <mat-card-subtitle>{{ tool.domain }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <p>{{ tool.description }}</p>
                </mat-card-content>
              </mat-card>
            </div>
            <p *ngIf="tools.length === 0">No tools in this bundle</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .bundle-detail {
      padding: 20px;
    }
    .bundle-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .bundle-meta {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .bundle-actions {
      display: flex;
      gap: 8px;
    }
    .tools-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    .tool-card a {
      text-decoration: none;
      color: inherit;
    }
    .tool-card a:hover {
      text-decoration: underline;
    }
    h3 {
      margin-top: 24px;
      margin-bottom: 12px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
    }
  `]
})
export class BundleDetailComponent implements OnInit {
  bundle: Bundle | null = null;
  tools: Tool[] = [];
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private bundleService: BundleService,
    private toolService: ToolService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBundle(id);
    }
  }

  loadBundle(id: string): void {
    this.loading = true;
    this.error = null;
    this.bundleService.getBundle(id).subscribe({
      next: (bundle) => {
        this.bundle = bundle;
        this.loadTools(bundle.toolIds);
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.message || 'Failed to load bundle';
        this.loading = false;
      }
    });
  }

  loadTools(toolIds: string[]): void {
    if (toolIds.length === 0) {
      this.tools = [];
      return;
    }

    const toolPromises = toolIds.map(id =>
      this.toolService.getToolById(id).toPromise()
    );

    Promise.all(toolPromises).then((tools) => {
      this.tools = tools.filter(t => t !== null) as Tool[];
    }).catch((err) => {
      console.error('Error loading tools:', err);
    });
  }

  toggleActive(active: boolean): void {
    if (!this.bundle) return;
    this.bundleService.updateBundle(this.bundle.bundleId, { active }).subscribe({
      next: () => {
        if (this.bundle) {
          this.bundle.active = active;
        }
        this.toastService.success(`Bundle ${active ? 'activated' : 'deactivated'} successfully`);
      },
      error: (err: any) => {
        console.error('Error updating bundle:', err);
        this.toastService.error(err.message || 'Failed to update bundle status');
      }
    });
  }

  public deleteBundle(): void {
    if (!this.bundle) return;
    this.confirmationService.confirmDelete(this.bundle.name).subscribe(confirmed => {
      if (confirmed) {
        this.bundleService.deleteBundle(this.bundle!.bundleId).subscribe({
          next: () => {
            this.toastService.success(`Bundle "${this.bundle!.name}" deleted successfully`);
            this.router.navigate(['/bundles']);
          },
          error: (err) => {
            this.toastService.error(err.message || 'Failed to delete bundle');
          }
        });
      }
    });
  }

  retryLoad(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBundle(id);
    }
  }
}

