import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { LangFuseGeneration } from '../../../../shared/models/langfuse.model';

@Component({
  selector: 'app-generation-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatExpansionModule,
    MatListModule,
    MatChipsModule
  ],
  template: `
    <div class="generation-viewer">
      <mat-card *ngFor="let generation of generations" class="generation-card">
        <mat-card-header>
          <mat-card-title>{{ generation.name }}</mat-card-title>
          <mat-card-subtitle>
            <mat-chip *ngIf="generation.model">{{ generation.model }}</mat-chip>
            <span *ngIf="generation.usage" class="usage-info">
              {{ generation.usage.totalTokens }} tokens
            </span>
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>Input</mat-panel-title>
            </mat-expansion-panel-header>
            <pre class="json-viewer">{{ generation.input | json }}</pre>
          </mat-expansion-panel>

          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>Output</mat-panel-title>
            </mat-expansion-panel-header>
            <pre class="json-viewer">{{ generation.output | json }}</pre>
          </mat-expansion-panel>

          <div *ngIf="generation.usage" class="usage-details">
            <h4>Token Usage</h4>
            <mat-list>
              <mat-list-item>
                <span matListItemTitle>Prompt Tokens</span>
                <span matListItemLine>{{ generation.usage.promptTokens }}</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>Completion Tokens</span>
                <span matListItemLine>{{ generation.usage.completionTokens }}</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>Total Tokens</span>
                <span matListItemLine>{{ generation.usage.totalTokens }}</span>
              </mat-list-item>
            </mat-list>
          </div>

          <div *ngIf="generation.metadata" class="metadata-section">
            <h4>Metadata</h4>
            <pre class="json-viewer">{{ generation.metadata | json }}</pre>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .generation-viewer {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .generation-card {
      margin-bottom: 16px;
    }
    .usage-info {
      margin-left: 8px;
      color: #666;
      font-size: 14px;
    }
    .json-viewer {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
      max-height: 400px;
      overflow-y: auto;
    }
    .usage-details, .metadata-section {
      margin-top: 16px;
    }
    .usage-details h4, .metadata-section h4 {
      margin-bottom: 8px;
    }
  `]
})
export class GenerationViewerComponent {
  @Input() generations: LangFuseGeneration[] = [];
}
