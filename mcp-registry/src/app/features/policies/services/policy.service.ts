import { Injectable } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class PolicyService {
  constructor(private api: ApiService) {}

  getPolicy(toolId: string): Observable<any> {
    return this.api.get(`/tools/${toolId}/policy`).pipe(
      catchError(() => of({
        rateLimits: {
          maxPerMinute: 100,
          maxConcurrency: 5,
          timeoutMs: 30000,
          retryPolicy: 'exponential'
        },
        policyRef: 'default-policy',
        securityClass: 'internal'
      }))
    );
  }
}

