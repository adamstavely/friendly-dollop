import { Injectable } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { MockDataService } from '../../../core/services/mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class QualityService {
  constructor(
    private api: ApiService,
    private mockData: MockDataService
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
}

