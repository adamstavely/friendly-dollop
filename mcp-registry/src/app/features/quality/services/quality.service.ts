import { Injectable } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { LangFuseService } from '../../../core/services/langfuse.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QualityService {
  constructor(
    private api: ApiService,
    private mockData: MockDataService,
    private langfuse: LangFuseService
  ) {}

  getQualityScore(toolId: string): Observable<any> {
    return this.api.get(`/tools/${toolId}/quality-score`).pipe(
      catchError(() => of(this.mockData.getMockQualityScore(toolId)))
    );
  }

  getQualityDashboard(): Observable<any> {
    return this.api.get('/quality/dashboard').pipe(
      catchError(() => of({
        overallScore: 85,
        metrics: {
          averageUptime: 0.99,
          averageLatency: 180,
          averageFailureRate: 0.03
        }
      }))
    );
  }

  submitFeedback(toolId: string, feedback: any): Observable<void> {
    return this.api.post<void>(`/tools/${toolId}/feedback`, feedback).pipe(
      catchError(() => of(undefined as void))
    );
  }

  /**
   * Submit quality feedback linked to a LangFuse trace
   */
  submitFeedbackWithTrace(
    executionId: string,
    scoreName: string,
    value: number,
    comment?: string
  ): Observable<string | null> {
    if (!environment.langfuse?.enabled || !environment.langfuse?.trackQualityScores) {
      return of(null);
    }

    try {
      const scoreId = this.langfuse.createScore(executionId, scoreName, value, comment);
      return of(scoreId);
    } catch (error) {
      console.error('Failed to create quality score in LangFuse:', error);
      return of(null);
    }
  }

  /**
   * Get quality scores from LangFuse for a trace
   */
  getTraceScores(executionId: string): Observable<any[]> {
    if (!this.langfuse.isEnabled()) {
      return of([]);
    }

    // This would query LangFuse for scores linked to this trace
    // For now, return empty array - would need backend API
    return of([]);
  }
}

