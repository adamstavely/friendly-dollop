import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { BundleService } from '../../services/bundle.service';
import { Bundle } from '../../../../shared/models/bundle.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-bundle-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatTableModule,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="bundle-list">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Tool Bundles</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="bundle-header">
            <button mat-raised-button color="primary" routerLink="/bundles/new">
              <mat-icon>add</mat-icon>
              New Bundle
            </button>
          </div>

          <app-loading-spinner *ngIf="loading" message="Loading bundles..."></app-loading-spinner>
          <app-error-display 
            *ngIf="error && !loading" 
            [title]="'Failed to Load Bundles'"
            [message]="error"
            [showRetry]="true"
            (onRetry)="loadBundles()">
          </app-error-display>

          <div *ngIf="!loading && !error">
            <table mat-table [dataSource]="bundles" class="bundles-table">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let bundle">
                  <a [routerLink]="['/bundles', bundle.bundleId]">{{ bundle.name }}</a>
                </td>
              </ng-container>

              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let bundle">{{ bundle.description }}</td>
              </ng-container>

              <ng-container matColumnDef="tools">
                <th mat-header-cell *matHeaderCellDef>Tools</th>
                <td mat-cell *matCellDef="let bundle">
                  <mat-chip>{{ bundle.toolIds.length }} tools</mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="version">
                <th mat-header-cell *matHeaderCellDef>Version</th>
                <td mat-cell *matCellDef="let bundle">{{ bundle.version }}</td>
              </ng-container>

              <ng-container matColumnDef="active">
                <th mat-header-cell *matHeaderCellDef>Active</th>
                <td mat-cell *matCellDef="let bundle">
                  <mat-slide-toggle 
                    [checked]="bundle.active"
                    (change)="toggleActive(bundle, $event.checked)">
                  </mat-slide-toggle>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let bundle">
                  <button mat-icon-button [routerLink]="['/bundles', bundle.bundleId]">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button [routerLink]="['/bundles', bundle.bundleId, 'edit']">
                    <mat-icon>edit</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>

            <app-empty-state
              *ngIf="bundles.length === 0"
              icon="inventory_2"
              title="No Bundles"
              message="Create your first tool bundle to group related tools together."
              actionLabel="Create Bundle"
              (onAction)="createBundle()">
            </app-empty-state>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .bundle-list {
      padding: 20px;
    }
    .bundle-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }
    .bundles-table {
      width: 100%;
    }
    .bundles-table a {
      text-decoration: none;
      color: inherit;
    }
    .bundles-table a:hover {
      text-decoration: underline;
    }
  `]
})
export class BundleListComponent implements OnInit {
  bundles: Bundle[] = [];
  loading: boolean = false;
  error: string | null = null;
  displayedColumns: string[] = ['name', 'description', 'tools', 'version', 'active', 'actions'];

  constructor(
    private bundleService: BundleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBundles();
  }

  loadBundles(): void {
    this.loading = true;
    this.error = null;
    this.bundleService.getBundles().subscribe({
      next: (bundles) => {
        this.bundles = bundles;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.message || 'Failed to load bundles';
        this.loading = false;
      }
    });
  }

  toggleActive(bundle: Bundle, active: boolean): void {
    this.bundleService.updateBundle(bundle.bundleId, { active }).subscribe({
      next: () => {
        bundle.active = active;
      },
      error: (err: any) => {
        console.error('Error updating bundle:', err);
      }
    });
  }

  createBundle(): void {
    // Navigation handled by routerLink in template
  }
}

