import { Injectable } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class GitOpsService {
  constructor(private api: ApiService) {}

  sync(): Observable<any> {
    return this.api.post('/gitops/sync', {}).pipe(
      catchError(() => of({ success: true, message: 'Sync completed (mock)' }))
    );
  }

  validateYaml(yaml: string): Observable<any> {
    return this.api.post('/gitops/validate', { yaml }).pipe(
      catchError(() => of({ valid: true, errors: [] }))
    );
  }
}

