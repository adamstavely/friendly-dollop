import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

export interface QuickAction {
  label: string;
  icon: string;
  route: string;
  color?: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Quick Actions</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="actions-grid">
          <button 
            *ngFor="let action of actions"
            mat-raised-button 
            [color]="action.color || 'primary'"
            [routerLink]="action.route"
            class="action-button">
            <mat-icon>{{ action.icon }}</mat-icon>
            <span>{{ action.label }}</span>
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    }
    .action-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px;
      min-height: 100px;
    }
    .action-button mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
  `]
})
export class QuickActionsComponent {
  actions: QuickAction[] = [
    { label: 'Create Tool', icon: 'add', route: '/tools/new', color: 'primary' },
    { label: 'Create Bundle', icon: 'inventory_2', route: '/bundles/new', color: 'primary' },
    { label: 'View Dependencies', icon: 'account_tree', route: '/dependencies', color: 'accent' },
    { label: 'Lifecycle', icon: 'timeline', route: '/lifecycle', color: 'accent' },
    { label: 'Quality', icon: 'assessment', route: '/quality', color: 'accent' },
    { label: 'Compliance', icon: 'verified', route: '/compliance', color: 'accent' }
  ];
}

