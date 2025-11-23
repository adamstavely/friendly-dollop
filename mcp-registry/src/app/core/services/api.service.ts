import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ConfigService } from './config.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}

  private getHeaders(): HttpHeaders {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      return headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  get<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    // In development with mock data enabled, immediately fail to trigger catchError
    if (environment.useMockData && !environment.production) {
      return throwError(() => new Error('Using mock data - API call skipped'));
    }
    
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<T>(`${this.config.getApiUrl()}${endpoint}`, {
      headers: this.getHeaders(),
      params: httpParams
    });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    if (environment.useMockData && !environment.production) {
      return throwError(() => new Error('Using mock data - API call skipped'));
    }
    return this.http.post<T>(`${this.config.getApiUrl()}${endpoint}`, body, {
      headers: this.getHeaders()
    });
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    if (environment.useMockData && !environment.production) {
      return throwError(() => new Error('Using mock data - API call skipped'));
    }
    return this.http.put<T>(`${this.config.getApiUrl()}${endpoint}`, body, {
      headers: this.getHeaders()
    });
  }

  delete<T>(endpoint: string): Observable<T> {
    if (environment.useMockData && !environment.production) {
      return throwError(() => new Error('Using mock data - API call skipped'));
    }
    return this.http.delete<T>(`${this.config.getApiUrl()}${endpoint}`, {
      headers: this.getHeaders()
    });
  }
}

