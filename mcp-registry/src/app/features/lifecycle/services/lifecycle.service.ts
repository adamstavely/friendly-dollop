import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class LifecycleService {
  constructor(private api: ApiService) {}

  getLifecycleDashboard(): Observable<any> {
    return this.api.get('/lifecycle/dashboard');
  }

  promoteTool(toolId: string, targetState: string): Observable<any> {
    return this.api.post(`/tools/${toolId}/promote`, { targetState });
  }

  getPromotionRequirements(toolId: string): Observable<any> {
    return this.api.get(`/tools/${toolId}/promotion-requirements`);
  }
}

