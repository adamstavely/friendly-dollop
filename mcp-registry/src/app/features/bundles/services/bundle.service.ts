import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Bundle } from '../../../shared/models/bundle.model';

@Injectable({
  providedIn: 'root'
})
export class BundleService {
  constructor(private api: ApiService) {}

  getBundles(): Observable<Bundle[]> {
    return this.api.get<Bundle[]>('/bundles');
  }

  getBundle(id: string): Observable<Bundle> {
    return this.api.get<Bundle>(`/bundles/${id}`);
  }

  createBundle(bundle: Partial<Bundle>): Observable<Bundle> {
    return this.api.post<Bundle>('/bundles', bundle);
  }

  updateBundle(id: string, bundle: Partial<Bundle>): Observable<Bundle> {
    return this.api.put<Bundle>(`/bundles/${id}`, bundle);
  }
}

