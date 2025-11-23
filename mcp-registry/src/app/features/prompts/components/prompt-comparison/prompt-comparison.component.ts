import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { PromptService } from '../../services/prompt.service';
import { PromptPlaygroundService, PromptComparisonResult } from '../../services/prompt-playground.service';
import { LangFusePrompt } from '../../../../shared/models/langfuse.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-prompt-comparison',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="prompt-comparison">
      <app-loading-spinner *ngIf="loading" message="Loading prompt..."></app-loading-spinner>

      <div *ngIf="prompt && !loading">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Prompt Comparison: {{ prompt.name }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="setup-section">
              <h3>Select Versions to Compare</h3>
              <div class="version-selection">
                <mat-form-field *ngFor="let version of availableVersions; let i = index">
                  <mat-label>Version {{ i + 1 }}</mat-label>
                  <mat-select [(ngModel)]="selectedVersions[i]">
                    <mat-option *ngFor="let v of availableVersions" [value]="v">
                      Version {{ v }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
                <button mat-raised-button (click)="addVersionSlot()" *ngIf="selectedVersions.length < availableVersions.length">
                  <mat-icon>add</mat-icon>
                  Add Version
                </button>
              </div>

              <div class="test-inputs">
                <h3>Test Inputs</h3>
                <div *ngFor="let variable of variables" class="variable-input">
                  <mat-form-field>
                    <mat-label>{{ variable }}</mat-label>
                    <input matInput [(ngModel)]="testInputs[variable]" [placeholder]="'Enter value for ' + variable">
                  </mat-form-field>
                </div>
              </div>

              <button mat-raised-button color="primary" (click)="runComparison()" [disabled]="comparing || selectedVersions.length < 2">
                <mat-icon>compare_arrows</mat-icon>
                Compare Versions
              </button>
            </div>

            <div *ngIf="comparisonResults.length > 0" class="results-section">
              <h3>Comparison Results</h3>
              
              <mat-tab-group>
                <mat-tab label="Side-by-Side">
                  <div class="comparison-grid">
                    <div *ngFor="let result of comparisonResults" class="comparison-card">
                      <mat-card>
                        <mat-card-header>
                          <mat-card-title>Version {{ result.version }}</mat-card-title>
                        </mat-card-header>
                        <mat-card-content>
                          <div class="output-section">
                            <h4>Output</h4>
                            <pre class="output-text">{{ result.result.output }}</pre>
                          </div>
                          <div class="metrics-section">
                            <div class="metric">
                              <span class="metric-label">Latency:</span>
                              <span class="metric-value">{{ result.metrics.latency }}ms</span>
                            </div>
                            <div class="metric" *ngIf="result.metrics.tokenUsage">
                              <span class="metric-label">Tokens:</span>
                              <span class="metric-value">{{ result.metrics.tokenUsage.totalTokens }}</span>
                            </div>
                            <div class="metric" *ngIf="result.metrics.cost">
                              <span class="metric-label">Cost:</span>
                              <span class="metric-value">${{ result.metrics.cost.toFixed(4) }}</span>
                            </div>
                          </div>
                        </mat-card-content>
                      </mat-card>
                    </div>
                  </div>
                </mat-tab>

                <mat-tab label="Metrics Table">
                  <table mat-table [dataSource]="comparisonResults" class="metrics-table">
                    <ng-container matColumnDef="version">
                      <th mat-header-cell *matHeaderCellDef>Version</th>
                      <td mat-cell *matCellDef="let result">v{{ result.version }}</td>
                    </ng-container>

                    <ng-container matColumnDef="latency">
                      <th mat-header-cell *matHeaderCellDef>Latency (ms)</th>
                      <td mat-cell *matCellDef="let result">{{ result.metrics.latency }}</td>
                    </ng-container>

                    <ng-container matColumnDef="tokens">
                      <th mat-header-cell *matHeaderCellDef>Tokens</th>
                      <td mat-cell *matCellDef="let result">
                        {{ result.metrics.tokenUsage?.totalTokens || '-' }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="cost">
                      <th mat-header-cell *matHeaderCellDef>Cost</th>
                      <td mat-cell *matCellDef="let result">
                        ${{ result.metrics.cost?.toFixed(4) || '-' }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="output">
                      <th mat-header-cell *matHeaderCellDef>Output Preview</th>
                      <td mat-cell *matCellDef="let result">
                        <div class="output-preview">{{ result.result.output | slice:0:100 }}{{ result.result.output.length > 100 ? '...' : '' }}</div>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
                  </table>
                </mat-tab>

                <mat-tab label="Diff View">
                  <div class="diff-view">
                    <div *ngFor="let result of comparisonResults; let i = index" class="diff-section">
                      <h4>Version {{ result.version }}</h4>
                      <pre class="diff-output">{{ result.result.output }}</pre>
                    </div>
                  </div>
                </mat-tab>
              </mat-tab-group>

              <div class="actions-section">
                <button mat-raised-button (click)="saveComparison()">
                  <mat-icon>save</mat-icon>
                  Save Comparison
                </button>
                <button mat-raised-button (click)="exportComparison()">
                  <mat-icon>download</mat-icon>
                  Export Results
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .prompt-comparison {
      padding: 20px;
    }
    .setup-section {
      margin-bottom: 32px;
    }
    .version-selection {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .version-selection mat-form-field {
      flex: 0 0 200px;
    }
    .test-inputs {
      margin-bottom: 24px;
    }
    .variable-input {
      margin-bottom: 16px;
    }
    .results-section {
      margin-top: 32px;
    }
    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
      margin-top: 24px;
    }
    .comparison-card {
      height: 100%;
    }
    .output-section {
      margin-bottom: 16px;
    }
    .output-text {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: 300px;
      overflow-y: auto;
    }
    .metrics-section {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .metric {
      display: flex;
      flex-direction: column;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
    }
    .metric-value {
      font-size: 18px;
      font-weight: bold;
      color: #6366f1;
    }
    .metrics-table {
      width: 100%;
      margin-top: 24px;
    }
    .output-preview {
      color: #666;
      font-size: 14px;
    }
    .diff-view {
      margin-top: 24px;
    }
    .diff-section {
      margin-bottom: 32px;
    }
    .diff-section h4 {
      margin-bottom: 8px;
    }
    .diff-output {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: 400px;
      overflow-y: auto;
    }
    .actions-section {
      display: flex;
      gap: 16px;
      margin-top: 24px;
    }
  `]
})
export class PromptComparisonComponent implements OnInit {
  prompt: LangFusePrompt | null = null;
  loading = false;
  comparing = false;
  availableVersions: number[] = [];
  selectedVersions: number[] = [];
  variables: string[] = [];
  testInputs: Record<string, string> = {};
  comparisonResults: PromptComparisonResult[] = [];
  displayedColumns: string[] = ['version', 'latency', 'tokens', 'cost', 'output'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private promptService: PromptService,
    private playgroundService: PromptPlaygroundService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPrompt(id);
    }
  }

  loadPrompt(id: string): void {
    this.loading = true;
    this.promptService.getPrompt(id).subscribe({
      next: (prompt) => {
        this.prompt = prompt;
        this.loadVersions(id);
        this.extractVariables(prompt.prompt);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading prompt:', err);
        this.loading = false;
      }
    });
  }

  loadVersions(promptId: string): void {
    this.promptService.getPromptVersions(promptId).subscribe({
      next: (versions) => {
        this.availableVersions = versions.map(v => Number(v.version) || 1).sort((a, b) => b - a);
        // Select first two versions by default
        if (this.availableVersions.length >= 2) {
          this.selectedVersions = [this.availableVersions[0], this.availableVersions[1]];
        } else if (this.availableVersions.length === 1) {
          this.selectedVersions = [this.availableVersions[0]];
        }
      },
      error: (err) => {
        console.error('Error loading versions:', err);
      }
    });
  }

  extractVariables(promptText: string): void {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const matches = promptText.matchAll(variableRegex);
    this.variables = Array.from(new Set(Array.from(matches).map(m => m[1])));
  }

  addVersionSlot(): void {
    if (this.selectedVersions.length < this.availableVersions.length) {
      const nextVersion = this.availableVersions.find(v => !this.selectedVersions.includes(v));
      if (nextVersion) {
        this.selectedVersions.push(nextVersion);
      }
    }
  }

  runComparison(): void {
    if (!this.prompt || this.selectedVersions.length < 2) return;

    this.comparing = true;
    this.comparisonResults = [];

    this.playgroundService.compareVersions(
      this.prompt.id!,
      this.selectedVersions.map(v => v.toString()),
      this.testInputs
    ).subscribe({
      next: (results) => {
        this.comparisonResults = results;
        this.comparing = false;
      },
      error: (err) => {
        console.error('Error running comparison:', err);
        this.comparing = false;
      }
    });
  }

  saveComparison(): void {
    const comparisonData = {
      promptId: this.prompt?.id,
      promptName: this.prompt?.name,
      versions: this.selectedVersions,
      testInputs: this.testInputs,
      results: this.comparisonResults,
      timestamp: new Date().toISOString()
    };

    // Save to localStorage for now (could be sent to backend)
    const savedComparisons = JSON.parse(localStorage.getItem('promptComparisons') || '[]');
    savedComparisons.push(comparisonData);
    localStorage.setItem('promptComparisons', JSON.stringify(savedComparisons));

    alert('Comparison saved successfully!');
  }

  exportComparison(): void {
    const exportData = {
      promptId: this.prompt?.id,
      promptName: this.prompt?.name,
      versions: this.selectedVersions,
      testInputs: this.testInputs,
      results: this.comparisonResults,
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prompt-comparison-${this.prompt?.id}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

