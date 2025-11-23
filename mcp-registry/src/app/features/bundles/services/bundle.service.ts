import { Injectable } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { Bundle } from '../../../shared/models/bundle.model';

@Injectable({
  providedIn: 'root'
})
export class BundleService {
  constructor(
    private api: ApiService,
    private mockData: MockDataService
  ) {}

  getBundles(): Observable<Bundle[]> {
    return this.api.get<Bundle[]>('/bundles').pipe(
      catchError(() => of(this.mockData.getMockBundles()))
    );
  }

  getBundle(id: string): Observable<Bundle> {
    return this.api.get<Bundle>(`/bundles/${id}`).pipe(
      catchError(() => {
        const bundle = this.mockData.getMockBundle(id);
        if (bundle) {
          return of(bundle);
        }
        throw new Error('Bundle not found');
      })
    );
  }

  createBundle(bundle: Partial<Bundle>): Observable<Bundle> {
    return this.api.post<Bundle>('/bundles', bundle).pipe(
      catchError(() => {
        const newBundle: Bundle = {
          ...bundle as Bundle,
          bundleId: `bundle-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return of(newBundle);
      })
    );
  }

  updateBundle(id: string, bundle: Partial<Bundle>): Observable<Bundle> {
    return this.api.put<Bundle>(`/bundles/${id}`, bundle).pipe(
      catchError(() => {
        const existing = this.mockData.getMockBundle(id);
        if (existing) {
          const updated = { ...existing, ...bundle, updatedAt: new Date().toISOString() };
          return of(updated as Bundle);
        }
        throw new Error('Bundle not found');
      })
    );
  }

  deleteBundle(id: string): Observable<void> {
    return this.api.delete<void>(`/bundles/${id}`).pipe(
      catchError(() => of(undefined as void))
    );
  }
}

