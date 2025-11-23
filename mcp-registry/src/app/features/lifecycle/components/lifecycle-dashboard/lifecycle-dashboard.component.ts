import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { LifecycleService } from '../../services/lifecycle.service';

@Component({
  selector: 'app-lifecycle-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <div class="lifecycle-dashboard">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Lifecycle Management Dashboard</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Lifecycle dashboard content will be displayed here.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .lifecycle-dashboard {
      padding: 20px;
    }
  `]
})
export class LifecycleDashboardComponent implements OnInit {
  constructor(private lifecycleService: LifecycleService) {}

  ngOnInit(): void {
    this.lifecycleService.getLifecycleDashboard().subscribe({
      next: (data) => {
        console.log('Lifecycle dashboard data:', data);
      }
    });
  }
}

