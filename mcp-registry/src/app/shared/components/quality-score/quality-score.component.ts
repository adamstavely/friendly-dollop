import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-quality-score',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule, MatTooltipModule],
  template: `
    <div class="quality-score-container">
      <div class="score-value">{{ score }}/100</div>
      <mat-progress-bar 
        [value]="score" 
        [color]="getScoreColor()"
        [matTooltip]="getTooltip()">
      </mat-progress-bar>
    </div>
  `,
  styles: [`
    .quality-score-container {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 200px;
    }
    .score-value {
      min-width: 60px;
      font-weight: bold;
      color: #d1c4e9;
    }
  `]
})
export class QualityScoreComponent {
  @Input() score: number = 0;

  getScoreColor(): string {
    if (this.score >= 80) return 'primary';
    if (this.score >= 60) return 'accent';
    return 'warn';
  }

  getTooltip(): string {
    return `Quality Score: ${this.score}/100`;
  }
}

