import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { ObservabilityService } from '../../services/observability.service';
import { LangFuseTrace, LangFuseGeneration } from '../../../../shared/models/langfuse.model';

@Component({
  selector: 'app-trace-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="trace-detail-container">
      <mat-card *ngIf="trace">
        <mat-card-header>
          <mat-card-title>{{ trace.name }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="trace-info">
            <h3>Input</h3>
            <pre>{{ trace.input | json }}</pre>
            <h3>Output</h3>
            <pre>{{ trace.output | json }}</pre>
            <h3>Generations</h3>
            <div *ngFor="let gen of generations">
              <p><strong>{{ gen.name }}</strong> ({{ gen.model }})</p>
              <pre>{{ gen.output | json }}</pre>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .trace-detail-container { padding: 20px; }
    pre { background: #f5f5f5; padding: 12px; border-radius: 4px; }
  `]
})
export class TraceDetailComponent implements OnInit {
  trace: LangFuseTrace | null = null;
  generations: LangFuseGeneration[] = [];

  constructor(
    private route: ActivatedRoute,
    private observabilityService: ObservabilityService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTrace(id);
    }
  }

  loadTrace(id: string): void {
    this.observabilityService.getTrace(id).subscribe({
      next: (trace) => {
        this.trace = trace;
        if (trace?.id) {
          this.observabilityService.getGenerations(trace.id).subscribe({
            next: (generations) => {
              this.generations = generations;
            }
          });
        }
      }
    });
  }
}

