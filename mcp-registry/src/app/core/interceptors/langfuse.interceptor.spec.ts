import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandler } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { langfuseInterceptor } from './langfuse.interceptor';
import { LangFuseService } from '../services/langfuse.service';
import { ConfigService } from '../services/config.service';

describe('langfuseInterceptor', () => {
  let interceptor: typeof langfuseInterceptor;
  let langfuseService: any;
  let configService: any;
  let next: any;

  beforeEach(() => {
    langfuseService = {
      isEnabled: vi.fn(),
      createWorkflowTrace: vi.fn(),
      updateTraceOutput: vi.fn(),
      endTrace: vi.fn()
    };
    configService = {
      isLangFuseEnabled: vi.fn()
    };
    next = {
      handle: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LangFuseService, useValue: langfuseService },
        { provide: ConfigService, useValue: configService }
      ]
    });

    interceptor = langfuseInterceptor;
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should pass through non-LLM requests', (done) => {
    configService.isLangFuseEnabled.mockReturnValue(true);
    langfuseService.isEnabled.mockReturnValue(true);
    next.handle.mockReturnValue(of({ status: 200 }));

    const request = new HttpRequest('GET', '/api/tools');
    interceptor(request, next).subscribe(() => {
      expect(next.handle).toHaveBeenCalled();
      expect(langfuseService.createWorkflowTrace).not.toHaveBeenCalled();
      done();
    });
  });

  it('should track workflow execution requests', (done) => {
    configService.isLangFuseEnabled.mockReturnValue(true);
    langfuseService.isEnabled.mockReturnValue(true);
    langfuseService.createWorkflowTrace.mockReturnValue('trace-123');
    next.handle.mockReturnValue(of({ status: 200, body: { result: 'success' } }));

    const request = new HttpRequest('POST', '/api/workflows/workflow-1/execute', { input: 'test' });
    interceptor(request, next).subscribe(() => {
      expect(langfuseService.createWorkflowTrace).toHaveBeenCalled();
      done();
    });
  });

  it('should skip tracking if LangFuse is disabled', (done) => {
    configService.isLangFuseEnabled.mockReturnValue(false);
    next.handle.mockReturnValue(of({ status: 200 }));

    const request = new HttpRequest('POST', '/api/workflows/workflow-1/execute');
    interceptor(request, next).subscribe(() => {
      expect(langfuseService.createWorkflowTrace).not.toHaveBeenCalled();
      done();
    });
  });
});

