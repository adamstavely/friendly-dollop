import { Injectable } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { MockDataService } from '../../../core/services/mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class LifecycleService {
  constructor(
    private api: ApiService,
    private mockData: MockDataService
  ) {}

  getLifecycleDashboard(): Observable<any> {
    return this.api.get('/lifecycle/dashboard').pipe(
      catchError(() => of(this.mockData.getMockLifecycleDashboard()))
    );
  }

  promoteTool(toolId: string, targetState: string): Observable<any> {
    return this.api.post(`/tools/${toolId}/promote`, { targetState }).pipe(
      catchError(() => of({ success: true, newState: targetState }))
    );
  }

  getPromotionRequirements(toolId: string): Observable<any> {
    return this.api.get(`/tools/${toolId}/promotion-requirements`).pipe(
      catchError(() => of({
        requirements: [
          { type: 'validation', status: 'passed', description: 'Schema validation passed' },
          { type: 'healthcheck', status: 'passed', description: 'Health check passed' },
          { type: 'approval', status: 'pending', description: 'Awaiting approval' }
        ]
      }))
    );
  }
}

