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

  getLangFuseConfig(): typeof environment.langfuse | null {
    return environment.langfuse || null;
  }

  isLangFuseEnabled(): boolean {
    return environment.langfuse?.enabled === true;
  }

  getLangFuseFeatureFlags(): {
    trackWorkflows: boolean;
    trackToolCalls: boolean;
    trackQualityScores: boolean;
    trackAgentInteractions: boolean;
  } {
    const config = environment.langfuse;
    return {
      trackWorkflows: config?.trackWorkflows ?? true,
      trackToolCalls: config?.trackToolCalls ?? true,
      trackQualityScores: config?.trackQualityScores ?? true,
      trackAgentInteractions: config?.trackAgentInteractions ?? true
    };
  }
}

