import { Injectable } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class GitOpsService {
  constructor(private api: ApiService) {}

  sync(): Observable<any> {
    return this.api.post('/gitops/sync', {}).pipe(
      catchError(() => of({ success: true, message: 'Sync completed (mock)' }))
    );
  }

  validateYaml(yaml: string): Observable<any> {
    return this.api.post('/gitops/validate', { yaml }).pipe(
      catchError(() => of({ valid: true, errors: [] }))
    );
  }

  getToolSchema(): Observable<any> {
    return this.api.get('/gitops/schema').pipe(
      catchError(() => {
        // Return default schema if API fails
        return of(this.getDefaultToolSchema());
      })
    );
  }

  private getDefaultToolSchema(): any {
    return {
      type: 'object',
      properties: {
        toolId: { 
          type: 'string',
          description: 'Unique identifier for the tool'
        },
        name: { 
          type: 'string',
          description: 'Tool name'
        },
        description: { 
          type: 'string',
          description: 'Tool description'
        },
        domain: { 
          type: 'string',
          description: 'Tool domain'
        },
        capabilities: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'List of tool capabilities'
        },
        ownerTeam: { 
          type: 'string',
          description: 'Owner team'
        },
        contact: { 
          type: 'string',
          description: 'Contact email'
        },
        securityClass: { 
          type: 'string', 
          enum: ['public', 'internal', 'restricted', 'highly-restricted'],
          description: 'Security classification'
        },
        lifecycleState: { 
          type: 'string', 
          enum: ['development', 'staging', 'pilot', 'production', 'deprecated', 'retired'],
          description: 'Lifecycle state'
        },
        tags: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'List of tags'
        },
        rateLimits: {
          type: 'object',
          properties: {
            maxPerMinute: { 
              type: 'number',
              description: 'Maximum requests per minute'
            },
            maxConcurrency: { 
              type: 'number',
              description: 'Maximum concurrent requests'
            },
            timeoutMs: { 
              type: 'number',
              description: 'Request timeout in milliseconds'
            },
            retryPolicy: { 
              type: 'string', 
              enum: ['exponential', 'linear', 'fixed'],
              description: 'Retry policy type'
            }
          },
          description: 'Rate limit configuration'
        },
        versions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              version: { type: 'string' },
              schema: { type: 'object' },
              deprecated: { type: 'boolean' }
            }
          },
          description: 'Tool versions'
        }
      },
      required: ['toolId', 'name']
    };
  }
}

