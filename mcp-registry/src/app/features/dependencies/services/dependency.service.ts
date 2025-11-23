import { Injectable } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { MockDataService } from '../../../core/services/mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class DependencyService {
  constructor(
    private api: ApiService,
    private mockData: MockDataService
  ) {}

  getDependencies(toolId: string): Observable<any> {
    return this.api.get(`/tools/${toolId}/dependencies`).pipe(
      catchError(() => of(this.mockData.getMockDependencies(toolId)))
    );
  }

  getReverseDependencies(toolId: string): Observable<any> {
    return this.api.get(`/tools/${toolId}/reverse-dependencies`).pipe(
      catchError(() => of({ reverseDependencies: [] }))
    );
  }
}

