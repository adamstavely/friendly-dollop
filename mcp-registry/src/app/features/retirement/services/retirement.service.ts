import { Injectable } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { MockDataService } from '../../../core/services/mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class RetirementService {
  constructor(
    private api: ApiService,
    private mockData: MockDataService
  ) {}

  getOrphans(): Observable<any[]> {
    return this.api.get<any[]>('/tools/orphans').pipe(
      catchError(() => of(this.mockData.getMockOrphans()))
    );
  }

  retireTool(toolId: string, retirementPlan: any): Observable<void> {
    return this.api.post<void>(`/tools/${toolId}/retire`, retirementPlan).pipe(
      catchError(() => of(undefined as void))
    );
  }

  scheduleRetirement(toolId: string, schedule: any): Observable<void> {
    return this.api.post<void>(`/tools/${toolId}/schedule-retirement`, schedule).pipe(
      catchError(() => of(undefined as void))
    );
  }
}

