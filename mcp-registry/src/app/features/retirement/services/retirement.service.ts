import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class RetirementService {
  constructor(private api: ApiService) {}

  getOrphans(): Observable<any[]> {
    return this.api.get<any[]>('/tools/orphans');
  }

  retireTool(toolId: string, retirementPlan: any): Observable<void> {
    return this.api.post(`/tools/${toolId}/retire`, retirementPlan);
  }
}

