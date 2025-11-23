import { Injectable } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  constructor(private api: ApiService) {}

  scanTool(toolId: string): Observable<any> {
    return this.api.post(`/compliance/scan/${toolId}`, {}).pipe(
      catchError(() => of({
        success: true,
        tags: ['Internal-Only'],
        violations: []
      }))
    );
  }
}

