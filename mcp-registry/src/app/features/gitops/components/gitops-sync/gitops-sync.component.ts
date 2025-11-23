import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-gitops-sync',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <div class="gitops-sync">
      <mat-card>
        <mat-card-header>
          <mat-card-title>GitOps Integration</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>GitOps sync and YAML editor will be displayed here.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .gitops-sync {
      padding: 20px;
    }
  `]
})
export class GitOpsSyncComponent {}

