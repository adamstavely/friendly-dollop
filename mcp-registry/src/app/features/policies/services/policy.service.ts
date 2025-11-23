import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class PolicyService {
  constructor(private api: ApiService) {}

  getPolicy(toolId: string): Observable<any> {
    return this.api.get(`/tools/${toolId}/policy`);
  }
}

