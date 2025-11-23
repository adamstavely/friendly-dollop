import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { QualityService } from '../../services/quality.service';

@Component({
  selector: 'app-quality-trends',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    BaseChartDirective
  ],
  template: `
    <div class="quality-trends">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Quality Trends</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="chart-container">
            <canvas baseChart
              [data]="lineChartData"
              [options]="lineChartOptions"
              [type]="lineChartType">
            </canvas>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .quality-trends {
      padding: 16px;
    }
    .chart-container {
      position: relative;
      height: 400px;
      width: 100%;
    }
  `]
})
export class QualityTrendsComponent implements OnInit {
  @Input() toolId: string = '';
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  lineChartType: ChartType = 'line';
  lineChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Quality Score',
        backgroundColor: 'rgba(77, 175, 124, 0.2)',
        borderColor: 'rgba(77, 175, 124, 1)',
        pointBackgroundColor: 'rgba(77, 175, 124, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(77, 175, 124, 1)',
        fill: 'origin'
      }
    ]
  };

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.5
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    },
    plugins: {
      legend: {
        display: true
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    }
  };

  constructor(private qualityService: QualityService) {}

  ngOnInit(): void {
    if (this.toolId) {
      this.loadTrends();
    }
  }

  loadTrends(): void {
    // Mock data - in production, fetch from API
    const dates = [];
    const scores = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      scores.push(80 + Math.random() * 20); // Mock score between 80-100
    }

    this.lineChartData = {
      labels: dates,
      datasets: [
        {
          data: scores,
          label: 'Quality Score',
          backgroundColor: 'rgba(77, 175, 124, 0.2)',
          borderColor: 'rgba(77, 175, 124, 1)',
          pointBackgroundColor: 'rgba(77, 175, 124, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(77, 175, 124, 1)',
          fill: 'origin'
        }
      ]
    };
  }
}

