import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  getApiUrl(): string {
    return this.apiUrl;
  }

  getAuthUrl(): string {
    return environment.authUrl || this.apiUrl + '/auth';
  }
}

