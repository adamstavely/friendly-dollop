import { Injectable } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { LangFuseService } from '../../../core/services/langfuse.service';
import { Prompt, PromptExecutionResult } from '../../../shared/models/prompt.model';

export interface PromptExecutionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  variables?: Record<string, any>;
}

export interface PromptComparisonResult {
  promptId: string;
  version: string;
  result: PromptExecutionResult;
  metrics: {
    latency: number;
    cost?: number;
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class PromptPlaygroundService {
  constructor(
    private api: ApiService,
    private langfuse: LangFuseService
  ) {}

  /**
   * Execute a prompt with test inputs
   */
  executePrompt(
    promptId: string,
    variables: Record<string, any>,
    options?: PromptExecutionOptions
  ): Observable<PromptExecutionResult> {
    return this.api.post<PromptExecutionResult>(
      `/prompts/${promptId}/execute`,
      { variables, options }
    ).pipe(
      catchError(() => {
        // Mock execution
        return this.mockExecutePrompt(promptId, variables, options);
      })
    );
  }

  /**
   * Execute prompt content directly (for playground)
   */
  executePromptContent(
    content: string,
    variables: Record<string, any>,
    options?: PromptExecutionOptions
  ): Observable<PromptExecutionResult> {
    // Create a trace for this execution
    const traceName = 'Prompt Playground Execution';
    let traceId: string | null = null;

    return new Observable(observer => {
      // Create trace
      this.langfuse.createTrace({
        name: traceName,
        input: { content, variables, options },
        metadata: { source: 'playground' }
      }).subscribe(id => {
        traceId = id || null;

        // Mock execution (in real implementation, this would call LLM API)
        setTimeout(() => {
          const result: PromptExecutionResult = {
            output: this.mockLLMResponse(content, variables),
            latency: Math.floor(Math.random() * 2000) + 500,
            tokenUsage: {
              promptTokens: Math.floor(Math.random() * 1000) + 100,
              completionTokens: Math.floor(Math.random() * 500) + 50,
              totalTokens: 0
            },
            traceId: traceId || undefined
          };
          result.tokenUsage!.totalTokens = 
            result.tokenUsage!.promptTokens + result.tokenUsage!.completionTokens;

          // Update trace with output
          if (traceId) {
            this.langfuse.updateTrace(traceId, {
              output: result.output,
              metadata: {
                latency: result.latency,
                tokenUsage: result.tokenUsage
              }
            }).subscribe();
          }

          observer.next(result);
          observer.complete();
        }, 1000);
      });
    });
  }

  /**
   * Compare multiple prompt versions
   */
  compareVersions(
    promptId: string,
    versions: string[],
    testInputs: Record<string, any>
  ): Observable<PromptComparisonResult[]> {
    return this.api.post<PromptComparisonResult[]>(
      `/prompts/${promptId}/compare`,
      { versions, testInputs }
    ).pipe(
      catchError(() => {
        // Mock comparison
        const results: PromptComparisonResult[] = versions.map(version => ({
          promptId,
          version,
          result: {
            output: `Mock output for version ${version}`,
            latency: Math.floor(Math.random() * 2000) + 500
          },
          metrics: {
            latency: Math.floor(Math.random() * 2000) + 500,
            tokenUsage: {
              promptTokens: Math.floor(Math.random() * 1000) + 100,
              completionTokens: Math.floor(Math.random() * 500) + 50,
              totalTokens: 0
            }
          }
        }));

        results.forEach(r => {
          if (r.metrics.tokenUsage) {
            r.metrics.tokenUsage.totalTokens =
              r.metrics.tokenUsage.promptTokens + r.metrics.tokenUsage.completionTokens;
          }
        });

        return of(results);
      })
    );
  }

  /**
   * Estimate token cost for prompt
   */
  estimateCost(
    promptId: string,
    variables: Record<string, any>
  ): Observable<{ estimatedTokens: number; estimatedCost: number }> {
    return this.api.post<{ estimatedTokens: number; estimatedCost: number }>(
      `/prompts/${promptId}/estimate-cost`,
      { variables }
    ).pipe(
      catchError(() => {
        // Mock estimation
        return of({
          estimatedTokens: Math.floor(Math.random() * 2000) + 500,
          estimatedCost: Math.random() * 0.1
        });
      })
    );
  }

  /**
   * Validate variables against prompt template
   */
  validateVariables(promptId: string, variables: Record<string, any>): Observable<{
    valid: boolean;
    errors: string[];
  }> {
    return this.api.post<{ valid: boolean; errors: string[] }>(
      `/prompts/${promptId}/validate-variables`,
      { variables }
    ).pipe(
      catchError(() => {
        // Basic validation
        const errors: string[] = [];
        // In real implementation, would check against prompt variables
        return of({ valid: errors.length === 0, errors });
      })
    );
  }

  // Private helper methods
  private mockExecutePrompt(
    promptId: string,
    variables: Record<string, any>,
    options?: PromptExecutionOptions
  ): Observable<PromptExecutionResult> {
    return new Observable(observer => {
      setTimeout(() => {
        const result: PromptExecutionResult = {
          output: `Mock execution result for prompt ${promptId}`,
          latency: Math.floor(Math.random() * 2000) + 500,
          tokenUsage: {
            promptTokens: Math.floor(Math.random() * 1000) + 100,
            completionTokens: Math.floor(Math.random() * 500) + 50,
            totalTokens: 0
          }
        };
        result.tokenUsage!.totalTokens =
          result.tokenUsage!.promptTokens + result.tokenUsage!.completionTokens;

        observer.next(result);
        observer.complete();
      }, 1000);
    });
  }

  private mockLLMResponse(content: string, variables: Record<string, any>): string {
    // Simple mock response
    const varCount = Object.keys(variables).length;
    return `This is a mock LLM response. The prompt contains ${varCount} variable(s). ` +
           `Content length: ${content.length} characters. ` +
           `Variables provided: ${Object.keys(variables).join(', ')}.`;
  }
}

