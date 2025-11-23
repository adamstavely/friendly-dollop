import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { PromptService } from '../../services/prompt.service';
import { PromptPlaygroundService } from '../../services/prompt-playground.service';
import { LangFusePrompt } from '../../../../shared/models/langfuse.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

export interface TestCase {
  id: string;
  inputs: Record<string, any>;
  expectedOutput?: string;
  tags?: string[];
}

export interface TestDataset {
  id: string;
  name: string;
  description?: string;
  promptId: string;
  testCases: TestCase[];
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationResult {
  testCaseId: string;
  inputs: Record<string, any>;
  expectedOutput?: string;
  actualOutput: string;
  passed: boolean;
  latency: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

@Component({
  selector: 'app-test-dataset',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatTabsModule,
    MatChipsModule,
    MatDialogModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="test-dataset">
      <app-loading-spinner *ngIf="loading" message="Loading dataset..."></app-loading-spinner>

      <div *ngIf="prompt && !loading">
        <mat-card>
          <mat-card-header>
            <div class="header-content">
              <div>
                <mat-card-title>Test Dataset: {{ dataset?.name || 'New Dataset' }}</mat-card-title>
                <mat-card-subtitle *ngIf="dataset">{{ dataset.description }}</mat-card-subtitle>
              </div>
              <div class="header-actions">
                <button mat-raised-button (click)="importDataset()">
                  <mat-icon>upload</mat-icon>
                  Import
                </button>
                <button mat-raised-button (click)="exportDataset()" [disabled]="!dataset || dataset.testCases.length === 0">
                  <mat-icon>download</mat-icon>
                  Export
                </button>
                <button mat-raised-button color="primary" (click)="saveDataset()">
                  <mat-icon>save</mat-icon>
                  Save Dataset
                </button>
              </div>
            </div>
          </mat-card-header>
          <mat-card-content>
            <mat-tab-group>
              <mat-tab label="Test Cases">
                <div class="tab-content">
                  <div class="dataset-info">
                    <mat-form-field>
                      <mat-label>Dataset Name</mat-label>
                      <input matInput [(ngModel)]="datasetName" placeholder="Enter dataset name">
                    </mat-form-field>
                    <mat-form-field>
                      <mat-label>Description</mat-label>
                      <textarea matInput [(ngModel)]="datasetDescription" placeholder="Enter description" rows="2"></textarea>
                    </mat-form-field>
                  </div>

                  <div class="test-cases-section">
                    <div class="section-header">
                      <h3>Test Cases</h3>
                      <button mat-raised-button (click)="addTestCase()">
                        <mat-icon>add</mat-icon>
                        Add Test Case
                      </button>
                    </div>

                    <table mat-table [dataSource]="testCases" *ngIf="testCases.length > 0">
                      <ng-container matColumnDef="inputs">
                        <th mat-header-cell *matHeaderCellDef>Inputs</th>
                        <td mat-cell *matCellDef="let testCase">
                          <div class="inputs-display">
                            <span *ngFor="let key of Object.keys(testCase.inputs)" class="input-item">
                              <strong>{{ key }}:</strong> {{ testCase.inputs[key] }}
                            </span>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="expectedOutput">
                        <th mat-header-cell *matHeaderCellDef>Expected Output</th>
                        <td mat-cell *matCellDef="let testCase">
                          {{ testCase.expectedOutput || '-' }}
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="tags">
                        <th mat-header-cell *matHeaderCellDef>Tags</th>
                        <td mat-cell *matCellDef="let testCase">
                          <mat-chip *ngFor="let tag of testCase.tags">{{ tag }}</mat-chip>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="actions">
                        <th mat-header-cell *matHeaderCellDef>Actions</th>
                        <td mat-cell *matCellDef="let testCase; let i = index">
                          <button mat-icon-button (click)="editTestCase(i)">
                            <mat-icon>edit</mat-icon>
                          </button>
                          <button mat-icon-button (click)="deleteTestCase(i)">
                            <mat-icon>delete</mat-icon>
                          </button>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
                    </table>

                    <div *ngIf="testCases.length === 0" class="empty-state">
                      <p>No test cases yet. Click "Add Test Case" to create one.</p>
                    </div>
                  </div>
                </div>
              </mat-tab>

              <mat-tab label="Evaluation">
                <div class="tab-content">
                  <div class="evaluation-controls">
                    <button mat-raised-button color="primary" (click)="runEvaluation()" [disabled]="evaluating || testCases.length === 0">
                      <mat-icon>play_arrow</mat-icon>
                      Run Evaluation
                    </button>
                    <button mat-raised-button (click)="exportResults()" [disabled]="evaluationResults.length === 0">
                      <mat-icon>download</mat-icon>
                      Export Results
                    </button>
                  </div>

                  <app-loading-spinner *ngIf="evaluating" message="Running evaluation..."></app-loading-spinner>

                  <div *ngIf="evaluationResults.length > 0 && !evaluating" class="evaluation-results">
                    <div class="summary-stats">
                      <div class="stat-card">
                        <div class="stat-value">{{ passedCount }}</div>
                        <div class="stat-label">Passed</div>
                      </div>
                      <div class="stat-card">
                        <div class="stat-value">{{ failedCount }}</div>
                        <div class="stat-label">Failed</div>
                      </div>
                      <div class="stat-card">
                        <div class="stat-value">{{ (passRate * 100).toFixed(1) }}%</div>
                        <div class="stat-label">Pass Rate</div>
                      </div>
                      <div class="stat-card">
                        <div class="stat-value">{{ averageLatency.toFixed(0) }}ms</div>
                        <div class="stat-label">Avg Latency</div>
                      </div>
                    </div>

                    <table mat-table [dataSource]="evaluationResults" class="results-table">
                      <ng-container matColumnDef="testCase">
                        <th mat-header-cell *matHeaderCellDef>Test Case</th>
                        <td mat-cell *matCellDef="let result">
                          <div class="test-case-inputs">
                            <span *ngFor="let key of Object.keys(result.inputs)" class="input-item">
                              <strong>{{ key }}:</strong> {{ result.inputs[key] }}
                            </span>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef>Status</th>
                        <td mat-cell *matCellDef="let result">
                          <mat-chip [class]="result.passed ? 'status-pass' : 'status-fail'">
                            {{ result.passed ? 'Pass' : 'Fail' }}
                          </mat-chip>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="latency">
                        <th mat-header-cell *matHeaderCellDef>Latency</th>
                        <td mat-cell *matCellDef="let result">{{ result.latency }}ms</td>
                      </ng-container>

                      <ng-container matColumnDef="output">
                        <th mat-header-cell *matHeaderCellDef>Output</th>
                        <td mat-cell *matCellDef="let result">
                          <div class="output-preview">{{ result.actualOutput | slice:0:100 }}{{ result.actualOutput.length > 100 ? '...' : '' }}</div>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="resultsColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: resultsColumns"></tr>
                    </table>
                  </div>
                </div>
              </mat-tab>
            </mat-tab-group>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .test-dataset {
      padding: 20px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .header-actions {
      display: flex;
      gap: 8px;
    }
    .tab-content {
      padding: 20px;
    }
    .dataset-info {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }
    .dataset-info mat-form-field {
      flex: 1;
    }
    .test-cases-section {
      margin-top: 24px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .inputs-display {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .input-item {
      font-size: 12px;
    }
    .empty-state {
      padding: 40px;
      text-align: center;
      color: #999;
    }
    .evaluation-controls {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #6366f1;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 8px;
    }
    .results-table {
      width: 100%;
    }
    .status-pass {
      background: #10b981;
      color: white;
    }
    .status-fail {
      background: #ef4444;
      color: white;
    }
    .output-preview {
      color: #666;
      font-size: 12px;
    }
  `]
})
export class TestDatasetComponent implements OnInit {
  prompt: LangFusePrompt | null = null;
  dataset: TestDataset | null = null;
  loading = false;
  evaluating = false;
  datasetName = '';
  datasetDescription = '';
  testCases: TestCase[] = [];
  evaluationResults: EvaluationResult[] = [];
  displayedColumns: string[] = ['inputs', 'expectedOutput', 'tags', 'actions'];
  resultsColumns: string[] = ['testCase', 'status', 'latency', 'output'];
  Object = Object;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private promptService: PromptService,
    private playgroundService: PromptPlaygroundService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPrompt(id);
      this.loadDataset(id);
    }
  }

  loadPrompt(id: string): void {
    this.loading = true;
    this.promptService.getPrompt(id).subscribe({
      next: (prompt) => {
        this.prompt = prompt;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading prompt:', err);
        this.loading = false;
      }
    });
  }

  loadDataset(promptId: string): void {
    // Load from localStorage for now (could be from backend)
    const saved = localStorage.getItem(`testDataset_${promptId}`);
    if (saved) {
      this.dataset = JSON.parse(saved);
      this.datasetName = this.dataset!.name;
      this.datasetDescription = this.dataset!.description || '';
      this.testCases = this.dataset!.testCases;
    } else {
      this.datasetName = `Test Dataset for ${promptId}`;
      this.testCases = [];
    }
  }

  addTestCase(): void {
    const newCase: TestCase = {
      id: `case-${Date.now()}`,
      inputs: {},
      tags: []
    };
    this.testCases.push(newCase);
    this.editTestCase(this.testCases.length - 1);
  }

  editTestCase(index: number): void {
    const testCase = this.testCases[index];
    // In a real implementation, open a dialog to edit test case
    // For now, just allow inline editing via a simple prompt
    const inputsStr = prompt('Enter inputs as JSON:', JSON.stringify(testCase.inputs, null, 2));
    if (inputsStr) {
      try {
        testCase.inputs = JSON.parse(inputsStr);
      } catch (e) {
        alert('Invalid JSON');
      }
    }
  }

  deleteTestCase(index: number): void {
    if (confirm('Delete this test case?')) {
      this.testCases.splice(index, 1);
    }
  }

  saveDataset(): void {
    if (!this.prompt) return;

    const dataset: TestDataset = {
      id: this.dataset?.id || `dataset-${Date.now()}`,
      name: this.datasetName,
      description: this.datasetDescription,
      promptId: this.prompt.id!,
      testCases: this.testCases,
      createdAt: this.dataset?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to localStorage (could be sent to backend)
    localStorage.setItem(`testDataset_${this.prompt.id}`, JSON.stringify(dataset));
    this.dataset = dataset;
    alert('Dataset saved!');
  }

  importDataset(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          try {
            if (file.name.endsWith('.json')) {
              const data = JSON.parse(event.target.result);
              if (data.testCases) {
                this.testCases = data.testCases;
                this.datasetName = data.name || this.datasetName;
                this.datasetDescription = data.description || this.datasetDescription;
              }
            } else if (file.name.endsWith('.csv')) {
              // Parse CSV (simplified)
              const lines = event.target.result.split('\n');
              const headers = lines[0].split(',');
              this.testCases = lines.slice(1).filter((l: string) => l.trim()).map((line: string, i: number) => {
                const values = line.split(',');
                const inputs: Record<string, any> = {};
                headers.forEach((h: string, idx: number) => {
                  if (h !== 'expectedOutput') {
                    inputs[h.trim()] = values[idx]?.trim() || '';
                  }
                });
                return {
                  id: `case-${i}`,
                  inputs,
                  expectedOutput: values[headers.indexOf('expectedOutput')]?.trim()
                };
              });
            }
            alert('Dataset imported successfully!');
          } catch (error) {
            alert('Error importing dataset: ' + (error as Error).message);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  exportDataset(): void {
    if (!this.dataset) return;

    const exportData = {
      ...this.dataset,
      testCases: this.testCases
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.datasetName.replace(/\s+/g, '-')}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  runEvaluation(): void {
    if (!this.prompt || this.testCases.length === 0) return;

    this.evaluating = true;
    this.evaluationResults = [];

    // Run evaluation for each test case
    const evaluations = this.testCases.map(testCase => {
      return this.playgroundService.executePrompt(
        this.prompt!.id!,
        testCase.inputs
      ).pipe(
        // Map to EvaluationResult
        // This is a simplified version - in real implementation would compare outputs
      );
    });

    // Execute all test cases
    let completed = 0;
    this.testCases.forEach((testCase, index) => {
      this.playgroundService.executePrompt(
        this.prompt!.id!,
        testCase.inputs
      ).subscribe({
        next: (result) => {
          const evalResult: EvaluationResult = {
            testCaseId: testCase.id,
            inputs: testCase.inputs,
            expectedOutput: testCase.expectedOutput,
            actualOutput: result.output,
            passed: testCase.expectedOutput ? result.output.includes(testCase.expectedOutput) : true,
            latency: result.latency,
            tokenUsage: result.tokenUsage
          };
          this.evaluationResults.push(evalResult);
          completed++;
          if (completed === this.testCases.length) {
            this.evaluating = false;
          }
        },
        error: (err) => {
          const evalResult: EvaluationResult = {
            testCaseId: testCase.id,
            inputs: testCase.inputs,
            expectedOutput: testCase.expectedOutput,
            actualOutput: '',
            passed: false,
            latency: 0,
            error: err.message
          };
          this.evaluationResults.push(evalResult);
          completed++;
          if (completed === this.testCases.length) {
            this.evaluating = false;
          }
        }
      });
    });
  }

  exportResults(): void {
    const exportData = {
      promptId: this.prompt?.id,
      promptName: this.prompt?.name,
      datasetName: this.datasetName,
      evaluationResults: this.evaluationResults,
      summary: {
        total: this.evaluationResults.length,
        passed: this.passedCount,
        failed: this.failedCount,
        passRate: this.passRate,
        averageLatency: this.averageLatency
      },
      evaluatedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evaluation-results-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  get passedCount(): number {
    return this.evaluationResults.filter(r => r.passed).length;
  }

  get failedCount(): number {
    return this.evaluationResults.filter(r => !r.passed).length;
  }

  get passRate(): number {
    if (this.evaluationResults.length === 0) return 0;
    return this.passedCount / this.evaluationResults.length;
  }

  get averageLatency(): number {
    if (this.evaluationResults.length === 0) return 0;
    const sum = this.evaluationResults.reduce((acc, r) => acc + r.latency, 0);
    return sum / this.evaluationResults.length;
  }
}

