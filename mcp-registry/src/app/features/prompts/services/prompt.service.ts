import { Injectable } from '@angular/core';
import { Observable, of, catchError, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { LangFusePrompt } from '../../../shared/models/langfuse.model';
import { PromptVersion } from '../../../shared/models/prompt.model';

@Injectable({
  providedIn: 'root'
})
export class PromptService {
  private prompts: LangFusePrompt[] = [];

  constructor(private api: ApiService) {
    // Initialize with mock prompts as fallback
    this.prompts = [
      {
        id: 'prompt-1',
        name: 'Document Summarization',
        prompt: 'Summarize the following document: {{document}}',
        version: 1,
        labels: ['summarization', 'document'],
        config: {
          temperature: 0.7,
          maxTokens: 500
        },
        tags: ['document', 'nlp'],
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      },
      {
        id: 'prompt-2',
        name: 'Code Review',
        prompt: 'Review the following code and provide feedback: {{code}}',
        version: 1,
        labels: ['code', 'review'],
        config: {
          temperature: 0.3,
          maxTokens: 1000
        },
        tags: ['code', 'review'],
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      }
    ];
  }

  /**
   * Get all prompts
   */
  getPrompts(): Observable<LangFusePrompt[]> {
    return this.api.get<{ prompts: LangFusePrompt[] }>('/langfuse/prompts').pipe(
      catchError(() => {
        return of({ prompts: this.prompts });
      }),
      map((response) => response.prompts || [])
    );
  }

  /**
   * Get prompt by ID
   */
  getPrompt(id: string, version?: number): Observable<LangFusePrompt | null> {
    const params = version ? { version } : {};
    return this.api.get<LangFusePrompt>(`/langfuse/prompts/${id}`, params).pipe(
      catchError(() => {
        const prompt = this.prompts.find(p => p.id === id);
        return of(prompt || null);
      })
    );
  }

  /**
   * Create a new prompt
   */
  createPrompt(prompt: Partial<LangFusePrompt>): Observable<LangFusePrompt> {
    const promptData = {
      name: prompt.name || 'Untitled Prompt',
      prompt: prompt.prompt || '',
      labels: prompt.labels || [],
      config: prompt.config,
      tags: prompt.tags || []
    };

    return this.api.post<LangFusePrompt>('/langfuse/prompts', promptData).pipe(
      catchError(() => {
        // Fallback to mock creation
        const newPrompt: LangFusePrompt = {
          id: `prompt-${Date.now()}`,
          name: promptData.name,
          prompt: promptData.prompt,
          version: 1,
          labels: promptData.labels,
          config: promptData.config,
          tags: promptData.tags,
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        };
        this.prompts.push(newPrompt);
        return of(newPrompt);
      })
    );
  }

  /**
   * Update a prompt
   */
  updatePrompt(id: string, updates: Partial<LangFusePrompt>): Observable<LangFusePrompt> {
    const promptData: any = {};
    if (updates.prompt) promptData.prompt = updates.prompt;
    if (updates.labels) promptData.labels = updates.labels;
    if (updates.config) promptData.config = updates.config;
    if (updates.tags) promptData.tags = updates.tags;

    return this.api.put<LangFusePrompt>(`/langfuse/prompts/${id}`, promptData).pipe(
      catchError(() => {
        // Fallback to mock update
        const index = this.prompts.findIndex(p => p.id === id);
        if (index === -1) {
          throw new Error('Prompt not found');
        }
        const updated = {
          ...this.prompts[index],
          ...updates,
          updated: new Date().toISOString()
        };
        this.prompts[index] = updated;
        return of(updated);
      })
    );
  }

  /**
   * Delete a prompt
   */
  deletePrompt(id: string): Observable<void> {
    return this.api.delete(`/langfuse/prompts/${id}`).pipe(
      catchError(() => {
        // Fallback to mock deletion
        const index = this.prompts.findIndex(p => p.id === id);
        if (index !== -1) {
          this.prompts.splice(index, 1);
        }
        return of(undefined);
      }),
      map(() => undefined)
    );
  }

  /**
   * Search prompts
   */
  searchPrompts(query: string): Observable<LangFusePrompt[]> {
    // For now, filter locally. Could be enhanced with backend search endpoint
    return this.getPrompts().pipe(
      map((prompts) => {
        const lowerQuery = query.toLowerCase();
        return prompts.filter(p =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.prompt.toLowerCase().includes(lowerQuery) ||
          p.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      })
    );
  }

  /**
   * Get prompt versions
   */
  getPromptVersions(id: string): Observable<PromptVersion[]> {
    return this.api.get<{ versions: any[] }>(`/langfuse/prompts/${id}/versions`).pipe(
      catchError(() => {
        // Fallback to mock versions
        const prompt = this.prompts.find(p => p.id === id);
        if (!prompt || !prompt.id) {
          return of({ versions: [] });
        }
        return of({
          versions: [{
            id: `${prompt.id}-v${prompt.version || 1}`,
            promptId: prompt.id,
            version: (prompt.version || 1).toString(),
            content: prompt.prompt || '',
            createdAt: prompt.created || new Date().toISOString(),
            createdBy: undefined,
            isActive: true,
            langfuseVersionId: prompt.id
          }]
        });
      }),
      map((response) => {
        // Convert LangFuse versions to PromptVersion format
        return (response.versions || []).map((v: any) => ({
          id: v.id || `${id}-v${v.version}`,
          promptId: id,
          version: v.version?.toString() || '1',
          content: v.prompt || v.content || '',
          createdAt: v.createdAt || v.created || new Date().toISOString(),
          createdBy: v.createdBy,
          isActive: v.isActive !== false,
          langfuseVersionId: v.id
        }));
      })
    );
  }

  /**
   * Run batch evaluation on test dataset
   */
  batchEvaluate(promptId: string, testCases: any[]): Observable<any> {
    return this.api.post<any>(
      `/langfuse/prompts/${promptId}/batch-evaluate`,
      { testCases }
    );
  }

  /**
   * Get prompt performance analytics
   */
  getPromptAnalytics(promptId: string, fromTimestamp?: string, toTimestamp?: string): Observable<any> {
    const params: any = {};
    if (fromTimestamp) params.fromTimestamp = fromTimestamp;
    if (toTimestamp) params.toTimestamp = toTimestamp;
    
    return this.api.get<any>(`/langfuse/prompts/${promptId}/analytics`, params);
  }

  /**
   * Rollback prompt to a previous version
   */
  rollbackPromptVersion(promptId: string, targetVersion: number): Observable<LangFusePrompt> {
    return this.api.post<LangFusePrompt>(
      `/langfuse/prompts/${promptId}/rollback`,
      { targetVersion }
    );
  }
}
