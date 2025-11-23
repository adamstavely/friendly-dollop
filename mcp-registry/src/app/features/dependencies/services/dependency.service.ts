import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class DependencyService {
  constructor(private api: ApiService) {}

  getDependencies(toolId: string): Observable<any> {
    return this.api.get(`/tools/${toolId}/dependencies`);
  }

  getReverseDependencies(toolId: string): Observable<any> {
    return this.api.get(`/tools/${toolId}/reverse-dependencies`);
  }
}

