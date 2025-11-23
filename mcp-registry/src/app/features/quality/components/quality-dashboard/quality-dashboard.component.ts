import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { QualityService } from '../../services/quality.service';

@Component({
  selector: 'app-quality-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="quality-dashboard">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Quality Dashboard</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Quality metrics and scoring will be displayed here.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .quality-dashboard {
      padding: 20px;
    }
  `]
})
export class QualityDashboardComponent implements OnInit {
  constructor(private qualityService: QualityService) {}

  ngOnInit(): void {}
}

