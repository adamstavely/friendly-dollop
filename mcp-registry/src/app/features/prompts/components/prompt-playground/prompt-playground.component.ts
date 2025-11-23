import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { PromptService } from '../../services/prompt.service';
import { LangFusePrompt } from '../../../../shared/models/langfuse.model';
import { LangFuseService } from '../../../../core/services/langfuse.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-prompt-playground',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="prompt-playground">
      <app-loading-spinner *ngIf="loading" message="Loading prompt..."></app-loading-spinner>

      <div *ngIf="prompt && !loading">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Prompt Playground: {{ prompt.name }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-tab-group>
              <mat-tab label="Execute">
                <div class="tab-content">
                  <div class="playground-layout">
                    <div class="input-panel">
                      <h3>Input Variables</h3>
                      <div *ngFor="let variable of variables" class="variable-input">
                        <mat-form-field>
                          <mat-label>{{ variable }}</mat-label>
                          <input matInput [(ngModel)]="variableValues[variable]" [placeholder]="'Enter value for ' + variable">
                        </mat-form-field>
                      </div>

                      <div class="execution-controls">
                        <mat-form-field>
                          <mat-label>Model</mat-label>
                          <mat-select [(ngModel)]="selectedModel">
                            <mat-option value="gpt-4">GPT-4</mat-option>
                            <mat-option value="gpt-3.5-turbo">GPT-3.5 Turbo</mat-option>
                          </mat-select>
                        </mat-form-field>

                        <button mat-raised-button color="primary" (click)="executePrompt()" [disabled]="executing">
                          <mat-icon>play_arrow</mat-icon>
                          Execute
                        </button>
                      </div>
                    </div>

                    <div class="output-panel">
                      <h3>Output</h3>
                      <app-loading-spinner *ngIf="executing" message="Executing prompt..."></app-loading-spinner>
                      <div *ngIf="!executing && executionResult" class="output-result">
                        <pre>{{ executionResult }}</pre>
                      </div>
                      <div *ngIf="!executing && !executionResult" class="output-placeholder">
                        <p>Click Execute to run the prompt</p>
                      </div>
                    </div>
                  </div>
                </div>
              </mat-tab>

              <mat-tab label="Prompt Preview">
                <div class="tab-content">
                  <h3>Prompt Template</h3>
                  <pre class="prompt-preview">{{ prompt.prompt }}</pre>
                  
                  <h3>Rendered Prompt</h3>
                  <pre class="prompt-rendered">{{ renderedPrompt }}</pre>
                </div>
              </mat-tab>
            </mat-tab-group>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .prompt-playground {
      padding: 20px;
    }
    .tab-content {
      padding: 20px;
    }
    .playground-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .input-panel, .output-panel {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
    }
    .variable-input {
      margin-bottom: 16px;
    }
    .execution-controls {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-top: 16px;
    }
    .output-result {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
    }
    .output-result pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .output-placeholder {
      padding: 40px;
      text-align: center;
      color: #999;
    }
    .prompt-preview, .prompt-rendered {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  `]
})
export class PromptPlaygroundComponent implements OnInit {
  prompt: LangFusePrompt | null = null;
  loading: boolean = false;
  executing: boolean = false;
  variables: string[] = [];
  variableValues: Record<string, string> = {};
  selectedModel: string = 'gpt-4';
  executionResult: string | null = null;
  renderedPrompt: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private promptService: PromptService,
    private langfuse: LangFuseService
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
        this.extractVariables();
        this.updateRenderedPrompt();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading prompt:', err);
        this.loading = false;
      }
    });
  }

  extractVariables(): void {
    if (!this.prompt) return;
    
    const regex = /\{\{(\w+)\}\}/g;
    const matches = this.prompt.prompt.matchAll(regex);
    this.variables = Array.from(matches, m => m[1]);
    
    // Initialize variable values
    this.variables.forEach(v => {
      if (!this.variableValues[v]) {
        this.variableValues[v] = '';
      }
    });
  }

  updateRenderedPrompt(): void {
    if (!this.prompt) return;
    
    let rendered = this.prompt.prompt;
    this.variables.forEach(v => {
      const value = this.variableValues[v] || `{{${v}}}`;
      rendered = rendered.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), value);
    });
    this.renderedPrompt = rendered;
  }

  executePrompt(): void {
    if (!this.prompt) return;
    
    this.executing = true;
    this.executionResult = null;
    
    // Update rendered prompt
    this.updateRenderedPrompt();
    
    // Create LangFuse trace for prompt execution
    const traceId = this.langfuse.createWorkflowTrace(
      'prompt-playground',
      this.prompt.name,
      `playground-${Date.now()}`,
      { prompt: this.renderedPrompt, variables: this.variableValues }
    );
    
    // Simulate prompt execution (in production, this would call LLM API)
    setTimeout(() => {
      this.executionResult = `This is a mock execution result. In production, this would call the ${this.selectedModel} model with the rendered prompt.\n\nRendered prompt:\n${this.renderedPrompt}`;
      this.executing = false;
      
      // Create generation in LangFuse
      if (traceId) {
        this.langfuse.createGeneration(
          traceId,
          'Prompt Execution',
          { prompt: this.renderedPrompt, model: this.selectedModel },
          this.executionResult,
          this.selectedModel,
          { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
        );
        this.langfuse.endTrace(traceId, { output: this.executionResult });
      }
    }, 1500);
  }
}
