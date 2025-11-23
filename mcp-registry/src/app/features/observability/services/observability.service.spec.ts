import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ObservabilityService } from './observability.service';
import { ApiService } from '../../../core/services/api.service';
import { LangFuseService } from '../../../core/services/langfuse.service';

describe('ObservabilityService', () => {
  let service: ObservabilityService;
  let httpMock: HttpTestingController;
  let apiService: ApiService;
  let langfuseService: any;

  beforeEach(() => {
    langfuseService = {
      isEnabled: vi.fn().mockReturnValue(false)
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ObservabilityService,
        ApiService,
        { provide: LangFuseService, useValue: langfuseService }
      ]
    });
    service = TestBed.inject(ObservabilityService);
    httpMock = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(ApiService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get traces', (done) => {
    service.getTraces().subscribe(result => {
      expect(result).toBeTruthy();
      expect(Array.isArray(result.traces)).toBe(true);
      expect(typeof result.total).toBe('number');
      done();
    });
  });

  it('should get trace by ID', (done) => {
    service.getTrace('trace-1').subscribe(trace => {
      expect(trace === null || (trace && trace.id)).toBe(true);
      done();
    });
  });

  it('should get generations', (done) => {
    service.getGenerations('trace-1').subscribe(generations => {
      expect(Array.isArray(generations)).toBe(true);
      done();
    });
  });

  it('should get scores', (done) => {
    service.getScores().subscribe(scores => {
      expect(Array.isArray(scores)).toBe(true);
      done();
    });
  });

  it('should get scores for specific trace', (done) => {
    service.getScores('trace-1').subscribe(scores => {
      expect(Array.isArray(scores)).toBe(true);
      done();
    });
  });

  it('should get metrics', (done) => {
    service.getMetrics().subscribe(metrics => {
      expect(metrics).toBeTruthy();
      expect(typeof metrics.totalTraces).toBe('number');
      expect(typeof metrics.successRate).toBe('number');
      expect(typeof metrics.averageLatency).toBe('number');
      expect(typeof metrics.totalCost).toBe('number');
      expect(typeof metrics.errorRate).toBe('number');
      done();
    });
  });

  it('should search traces', (done) => {
    service.searchTraces('test query').subscribe(traces => {
      expect(Array.isArray(traces)).toBe(true);
      done();
    });
  });

  it('should export traces', (done) => {
    service.exportTraces(undefined, 'json').subscribe(blob => {
      expect(blob).toBeTruthy();
      expect(blob instanceof Blob).toBe(true);
      done();
    });
  });
});

