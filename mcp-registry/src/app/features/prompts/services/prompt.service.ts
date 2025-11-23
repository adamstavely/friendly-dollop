import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LangFuseService } from '../../../core/services/langfuse.service';
import { LangFusePrompt } from '../../../shared/models/langfuse.model';

@Injectable({
  providedIn: 'root'
})
export class PromptService {
  private prompts: LangFusePrompt[] = [];

  constructor(private langfuse: LangFuseService) {
    // Initialize with mock prompts
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
    // In production, this would fetch from LangFuse API
    return of(this.prompts);
  }

  /**
   * Get prompt by ID
   */
  getPrompt(id: string): Observable<LangFusePrompt | null> {
    const prompt = this.prompts.find(p => p.id === id);
    return of(prompt || null);
  }

  /**
   * Create a new prompt
   */
  createPrompt(prompt: Partial<LangFusePrompt>): Observable<LangFusePrompt> {
    const newPrompt: LangFusePrompt = {
      id: `prompt-${Date.now()}`,
      name: prompt.name || 'Untitled Prompt',
      prompt: prompt.prompt || '',
      version: 1,
      labels: prompt.labels || [],
      config: prompt.config,
      tags: prompt.tags || [],
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    this.prompts.push(newPrompt);
    return of(newPrompt);
  }

  /**
   * Update a prompt
   */
  updatePrompt(id: string, updates: Partial<LangFusePrompt>): Observable<LangFusePrompt> {
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
  }

  /**
   * Delete a prompt
   */
  deletePrompt(id: string): Observable<void> {
    const index = this.prompts.findIndex(p => p.id === id);
    if (index !== -1) {
      this.prompts.splice(index, 1);
    }
    return of(undefined);
  }

  /**
   * Search prompts
   */
  searchPrompts(query: string): Observable<LangFusePrompt[]> {
    const filtered = this.prompts.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.prompt.toLowerCase().includes(query.toLowerCase()) ||
      p.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    return of(filtered);
  }

  /**
   * Get prompt versions
   */
  getPromptVersions(id: string): Observable<LangFusePrompt[]> {
    // In production, this would fetch versions from LangFuse
    const prompt = this.prompts.find(p => p.id === id);
    return of(prompt ? [prompt] : []);
  }
}
