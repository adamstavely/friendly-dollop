import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class QualityService {
  constructor(private api: ApiService) {}

  getQualityScore(toolId: string): Observable<any> {
    return this.api.get(`/tools/${toolId}/quality-score`);
  }

  submitFeedback(toolId: string, feedback: any): Observable<void> {
    return this.api.post(`/tools/${toolId}/feedback`, feedback);
  }
}

