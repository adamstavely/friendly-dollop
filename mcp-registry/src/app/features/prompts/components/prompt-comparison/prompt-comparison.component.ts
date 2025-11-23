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
                              <span class="metric-value">{{ '$' + formatCost(result.metrics.cost) }}</span>
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
                        {{ '$' + formatCost(result.metrics.cost) }}
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
                <button mat-raised-button (click)="runMultipleComparisons()" [disabled]="comparing">
                  <mat-icon>repeat</mat-icon>
                  Run {{ runCount }} More Times
                </button>
                <button mat-raised-button (click)="saveComparison()">
                  <mat-icon>save</mat-icon>
                  Save Comparison
                </button>
                <button mat-raised-button (click)="exportComparison()">
                  <mat-icon>download</mat-icon>
                  Export Results
                </button>
              </div>

              <div *ngIf="statisticalAnalysis" class="statistics-section">
                <h3>Statistical Analysis</h3>
                
                <div class="stats-grid">
                  <div *ngFor="let stat of statisticalAnalysis.versions" class="stat-card">
                    <h4>Version {{ stat.version }}</h4>
                    <div class="stat-item">
                      <span class="stat-label">Mean Latency:</span>
                      <span class="stat-value">{{ stat.meanLatency.toFixed(2) }}ms</span>
                      <span class="stat-stddev">±{{ stat.stdDevLatency.toFixed(2) }}ms</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">95% CI Latency:</span>
                      <span class="stat-value">[{{ stat.confidenceInterval95.latency[0].toFixed(2) }}, {{ stat.confidenceInterval95.latency[1].toFixed(2) }}]ms</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">Mean Cost:</span>
                      <span class="stat-value">${{ stat.meanCost.toFixed(4) }}</span>
                      <span class="stat-stddev">±${{ stat.stdDevCost.toFixed(4) }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">Mean Tokens:</span>
                      <span class="stat-value">{{ stat.meanTokens.toFixed(0) }}</span>
                      <span class="stat-stddev">±{{ stat.stdDevTokens.toFixed(0) }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">Sample Size:</span>
                      <span class="stat-value">{{ stat.sampleSize }}</span>
                    </div>
                  </div>
                </div>

                <div class="t-test-results">
                  <h4>T-Test Results (Version {{ selectedVersions[0] }} vs {{ selectedVersions[1] }})</h4>
                  <table class="t-test-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>T-Statistic</th>
                        <th>P-Value</th>
                        <th>Significant (p < 0.05)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Latency</td>
                        <td>{{ statisticalAnalysis.tTest.latency.tStatistic.toFixed(4) }}</td>
                        <td>{{ statisticalAnalysis.tTest.latency.pValue.toFixed(4) }}</td>
                        <td>
                          <mat-chip [class]="statisticalAnalysis.tTest.latency.significant ? 'significant' : 'not-significant'">
                            {{ statisticalAnalysis.tTest.latency.significant ? 'Yes' : 'No' }}
                          </mat-chip>
                        </td>
                      </tr>
                      <tr>
                        <td>Cost</td>
                        <td>{{ statisticalAnalysis.tTest.cost.tStatistic.toFixed(4) }}</td>
                        <td>{{ statisticalAnalysis.tTest.cost.pValue.toFixed(4) }}</td>
                        <td>
                          <mat-chip [class]="statisticalAnalysis.tTest.cost.significant ? 'significant' : 'not-significant'">
                            {{ statisticalAnalysis.tTest.cost.significant ? 'Yes' : 'No' }}
                          </mat-chip>
                        </td>
                      </tr>
                      <tr>
                        <td>Tokens</td>
                        <td>{{ statisticalAnalysis.tTest.tokens.tStatistic.toFixed(4) }}</td>
                        <td>{{ statisticalAnalysis.tTest.tokens.pValue.toFixed(4) }}</td>
                        <td>
                          <mat-chip [class]="statisticalAnalysis.tTest.tokens.significant ? 'significant' : 'not-significant'">
                            {{ statisticalAnalysis.tTest.tokens.significant ? 'Yes' : 'No' }}
                          </mat-chip>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div *ngIf="statisticalAnalysis.winner" class="winner-section">
                  <h4>Winner</h4>
                  <div class="winner-card">
                    <strong>Version {{ statisticalAnalysis.winner.version }}</strong> wins on 
                    <strong>{{ statisticalAnalysis.winner.metric }}</strong> with 
                    <strong>{{ (statisticalAnalysis.winner.improvement * 100).toFixed(1) }}%</strong> improvement
                  </div>
                </div>
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
    .statistics-section {
      margin-top: 32px;
      padding: 24px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-card h4 {
      margin: 0 0 12px 0;
      color: #6366f1;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
      margin-bottom: 8px;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
    }
    .stat-value {
      font-size: 16px;
      font-weight: bold;
      color: #333;
    }
    .stat-stddev {
      font-size: 12px;
      color: #999;
    }
    .t-test-results {
      margin-top: 24px;
    }
    .t-test-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }
    .t-test-table th,
    .t-test-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    .t-test-table th {
      background: #f3f4f6;
      font-weight: 600;
    }
    .significant {
      background: #10b981;
      color: white;
    }
    .not-significant {
      background: #ef4444;
      color: white;
    }
    .winner-section {
      margin-top: 24px;
    }
    .winner-card {
      background: #dbeafe;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }
  `]
})
export interface StatisticalAnalysis {
  version: string;
  meanLatency: number;
  stdDevLatency: number;
  meanCost: number;
  stdDevCost: number;
  meanTokens: number;
  stdDevTokens: number;
  confidenceInterval95: {
    latency: [number, number];
    cost: [number, number];
    tokens: [number, number];
  };
  sampleSize: number;
}

export interface ComparisonStatistics {
  versions: StatisticalAnalysis[];
  tTest: {
    latency: { tStatistic: number; pValue: number; significant: boolean };
    cost: { tStatistic: number; pValue: number; significant: boolean };
    tokens: { tStatistic: number; pValue: number; significant: boolean };
  };
  winner: {
    version: string;
    metric: 'latency' | 'cost' | 'tokens';
    improvement: number;
  } | null;
}

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
  statisticalAnalysis: ComparisonStatistics | null = null;
  multipleRuns: Map<string, PromptComparisonResult[]> = new Map();
  runCount = 1;

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
        if (prompt?.prompt) {
          this.extractVariables(prompt.prompt);
        }
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

  formatCost(cost: number | undefined | null): string {
    if (cost == null) return '-';
    return cost.toFixed(4);
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
        
        // Store results for statistical analysis
        results.forEach(result => {
          const versionKey = result.version;
          if (!this.multipleRuns.has(versionKey)) {
            this.multipleRuns.set(versionKey, []);
          }
          this.multipleRuns.get(versionKey)!.push(result);
        });

        // Calculate statistics if we have multiple runs
        if (this.multipleRuns.size > 0) {
          this.calculateStatistics();
        }
        
        this.comparing = false;
      },
      error: (err) => {
        console.error('Error running comparison:', err);
        this.comparing = false;
      }
    });
  }

  runMultipleComparisons(): void {
    if (!this.prompt || this.selectedVersions.length < 2) return;
    
    for (let i = 0; i < this.runCount; i++) {
      setTimeout(() => {
        this.runComparison();
      }, i * 1000);
    }
  }

  calculateStatistics(): void {
    if (this.selectedVersions.length < 2) return;

    const versionStats: StatisticalAnalysis[] = [];
    
    // Calculate statistics for each version
    this.selectedVersions.forEach(version => {
      const versionKey = version.toString();
      const runs = this.multipleRuns.get(versionKey) || [];
      
      if (runs.length === 0) return;

      const latencies = runs.map(r => r.metrics.latency);
      const costs = runs.map(r => r.metrics.cost || 0);
      const tokens = runs.map(r => r.metrics.tokenUsage?.totalTokens || 0);

      const meanLatency = this.mean(latencies);
      const stdDevLatency = this.standardDeviation(latencies);
      const meanCost = this.mean(costs);
      const stdDevCost = this.standardDeviation(costs);
      const meanTokens = this.mean(tokens);
      const stdDevTokens = this.standardDeviation(tokens);

      const ci95Latency = this.confidenceInterval95(latencies);
      const ci95Cost = this.confidenceInterval95(costs);
      const ci95Tokens = this.confidenceInterval95(tokens);

      versionStats.push({
        version: versionKey,
        meanLatency,
        stdDevLatency,
        meanCost,
        stdDevCost,
        meanTokens,
        stdDevTokens,
        confidenceInterval95: {
          latency: ci95Latency,
          cost: ci95Cost,
          tokens: ci95Tokens
        },
        sampleSize: runs.length
      });
    });

    // Perform t-tests between versions
    const version1Key = this.selectedVersions[0].toString();
    const version2Key = this.selectedVersions[1].toString();
    const runs1 = this.multipleRuns.get(version1Key) || [];
    const runs2 = this.multipleRuns.get(version2Key) || [];

    if (runs1.length > 0 && runs2.length > 0) {
      const latencies1 = runs1.map(r => r.metrics.latency);
      const latencies2 = runs2.map(r => r.metrics.latency);
      const costs1 = runs1.map(r => r.metrics.cost || 0);
      const costs2 = runs2.map(r => r.metrics.cost || 0);
      const tokens1 = runs1.map(r => r.metrics.tokenUsage?.totalTokens || 0);
      const tokens2 = runs2.map(r => r.metrics.tokenUsage?.totalTokens || 0);

      const tTestLatency = this.tTest(latencies1, latencies2);
      const tTestCost = this.tTest(costs1, costs2);
      const tTestTokens = this.tTest(tokens1, tokens2);

      // Determine winner
      let winner: ComparisonStatistics['winner'] = null;
      const stat1 = versionStats.find(s => s.version === version1Key);
      const stat2 = versionStats.find(s => s.version === version2Key);

      if (stat1 && stat2) {
        // Compare on latency (lower is better)
        if (stat1.meanLatency < stat2.meanLatency) {
          const improvement = (stat2.meanLatency - stat1.meanLatency) / stat2.meanLatency;
          winner = { version: version1Key, metric: 'latency', improvement };
        } else {
          const improvement = (stat1.meanLatency - stat2.meanLatency) / stat1.meanLatency;
          winner = { version: version2Key, metric: 'latency', improvement };
        }
      }

      this.statisticalAnalysis = {
        versions: versionStats,
        tTest: {
          latency: { ...tTestLatency, significant: tTestLatency.pValue < 0.05 },
          cost: { ...tTestCost, significant: tTestCost.pValue < 0.05 },
          tokens: { ...tTestTokens, significant: tTestTokens.pValue < 0.05 }
        },
        winner
      };
    }
  }

  private mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private standardDeviation(values: number[]): number {
    const avg = this.mean(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = this.mean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  private confidenceInterval95(values: number[]): [number, number] {
    const mean = this.mean(values);
    const stdDev = this.standardDeviation(values);
    const n = values.length;
    const tValue = 1.96; // Approximate t-value for 95% CI with large n
    const margin = tValue * (stdDev / Math.sqrt(n));
    return [mean - margin, mean + margin];
  }

  private tTest(sample1: number[], sample2: number[]): { tStatistic: number; pValue: number } {
    const mean1 = this.mean(sample1);
    const mean2 = this.mean(sample2);
    const stdDev1 = this.standardDeviation(sample1);
    const stdDev2 = this.standardDeviation(sample2);
    const n1 = sample1.length;
    const n2 = sample2.length;

    // Pooled standard deviation
    const pooledStd = Math.sqrt(
      ((n1 - 1) * stdDev1 * stdDev1 + (n2 - 1) * stdDev2 * stdDev2) / (n1 + n2 - 2)
    );

    // Standard error
    const se = pooledStd * Math.sqrt(1 / n1 + 1 / n2);

    // t-statistic
    const tStatistic = (mean1 - mean2) / se;

    // Degrees of freedom
    const df = n1 + n2 - 2;

    // Approximate p-value (simplified - in production, use proper t-distribution)
    // Using normal approximation for large samples
    const pValue = 2 * (1 - this.normalCDF(Math.abs(tStatistic)));

    return { tStatistic, pValue };
  }

  private normalCDF(x: number): number {
    // Approximation of standard normal CDF
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
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

