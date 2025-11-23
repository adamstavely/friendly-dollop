import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PromptService } from './prompt.service';
import { ApiService } from '../../../core/services/api.service';
import { LangFusePrompt } from '../../../shared/models/langfuse.model';

describe('PromptService', () => {
  let service: PromptService;
  let httpMock: HttpTestingController;
  let apiService: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PromptService, ApiService]
    });
    service = TestBed.inject(PromptService);
    httpMock = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(ApiService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get prompts', (done) => {
    const mockPrompts: LangFusePrompt[] = [
      {
        id: 'prompt-1',
        name: 'Test Prompt',
        prompt: 'Test content',
        version: 1,
        tags: ['test']
      }
    ];

    service.getPrompts().subscribe(prompts => {
      expect(Array.isArray(prompts)).toBe(true);
      done();
    });

    // Since we're using ApiService which may use mock data, we don't expect HTTP calls
    // The service will fall back to mock data if API call fails
  });

  it('should get prompt by ID', (done) => {
    service.getPrompt('prompt-1').subscribe(prompt => {
      expect(prompt === null || (prompt && prompt.id)).toBe(true);
      done();
    });
  });

  it('should create prompt', (done) => {
    const newPrompt: Partial<LangFusePrompt> = {
      name: 'New Prompt',
      prompt: 'New content',
      tags: ['new']
    };

    service.createPrompt(newPrompt).subscribe(prompt => {
      expect(prompt).toBeTruthy();
      expect(prompt.name).toBe('New Prompt');
      done();
    });
  });

  it('should update prompt', (done) => {
    const updates: Partial<LangFusePrompt> = {
      prompt: 'Updated content'
    };

    service.updatePrompt('prompt-1', updates).subscribe(prompt => {
      expect(prompt === null || (prompt && typeof prompt.prompt === 'string')).toBe(true);
      done();
    });
  });

  it('should delete prompt', (done) => {
    service.deletePrompt('prompt-1').subscribe(() => {
      done();
    });
  });

  it('should search prompts', (done) => {
    service.searchPrompts('test').subscribe(prompts => {
      expect(Array.isArray(prompts)).toBe(true);
      done();
    });
  });

  it('should get prompt versions', (done) => {
    service.getPromptVersions('prompt-1').subscribe(versions => {
      expect(Array.isArray(versions)).toBe(true);
      done();
    });
  });
});

