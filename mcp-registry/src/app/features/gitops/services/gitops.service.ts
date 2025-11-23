import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class GitOpsService {
  constructor(private api: ApiService) {}

  sync(): Observable<any> {
    return this.api.post('/gitops/sync', {});
  }

  validateYaml(yaml: string): Observable<any> {
    return this.api.post('/gitops/validate', { yaml });
  }
}

