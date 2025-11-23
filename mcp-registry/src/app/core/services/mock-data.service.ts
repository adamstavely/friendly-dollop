import { Injectable } from '@angular/core';
import { Tool } from '../../shared/models/tool.model';
import { Bundle } from '../../shared/models/bundle.model';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private mockTools: Tool[] = [
    {
      toolId: 'tool-1',
      name: 'Search API',
      description: 'A powerful search API for finding documents and content',
      domain: 'search',
      capabilities: ['search', 'filter', 'rank'],
      versions: [
        {
          version: '1.0.0',
          schema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              limit: { type: 'number' }
            }
          },
          deployment: {
            env: 'prod',
            endpoint: 'https://api.example.com/search'
          },
          health: {
            lastCheck: new Date().toISOString(),
            status: 'healthy'
          },
          deprecated: false
        }
      ],
      ownerTeam: 'platform-team',
      contact: 'platform@example.com',
      securityClass: 'internal',
      tags: ['search', 'api'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lifecycleState: 'production',
      qualityScore: 85,
      complianceTags: ['Internal-Only'],
      agentPersonaRules: {
        'finance-agent': true,
        'junior-agent': true
      },
      rateLimits: {
        maxPerMinute: 100,
        maxConcurrency: 5,
        timeoutMs: 30000,
        retryPolicy: 'exponential'
      },
      agentFeedback: {
        successRate: 0.95,
        avgLatencyMs: 180,
        failureRate: 0.05
      }
    },
    {
      toolId: 'tool-2',
      name: 'Data Processor',
      description: 'Processes and transforms data streams',
      domain: 'platform',
      capabilities: ['process', 'transform'],
      versions: [
        {
          version: '2.1.0',
          schema: {
            type: 'object',
            properties: {
              data: { type: 'array' },
              format: { type: 'string' }
            }
          },
          deployment: {
            env: 'prod',
            endpoint: 'https://api.example.com/process'
          },
          health: {
            lastCheck: new Date().toISOString(),
            status: 'healthy'
          },
          deprecated: false
        }
      ],
      ownerTeam: 'data-team',
      contact: 'data@example.com',
      securityClass: 'restricted',
      tags: ['data', 'processing'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lifecycleState: 'production',
      qualityScore: 92,
      complianceTags: ['PII'],
      agentPersonaRules: {
        'finance-agent': true,
        'senior-agent': true
      },
      rateLimits: {
        maxPerMinute: 50,
        maxConcurrency: 3,
        timeoutMs: 60000,
        retryPolicy: 'linear'
      },
      agentFeedback: {
        successRate: 0.98,
        avgLatencyMs: 250,
        failureRate: 0.02
      }
    },
    {
      toolId: 'tool-3',
      name: 'Finance Calculator',
      description: 'Financial calculations and computations',
      domain: 'finance',
      capabilities: ['calculate', 'analyze'],
      versions: [
        {
          version: '1.5.0',
          schema: {
            type: 'object',
            properties: {
              operation: { type: 'string' },
              values: { type: 'array' }
            }
          },
          deployment: {
            env: 'staging',
            endpoint: 'https://staging.example.com/finance'
          },
          health: {
            lastCheck: new Date().toISOString(),
            status: 'healthy'
          },
          deprecated: false
        }
      ],
      ownerTeam: 'finance-team',
      contact: 'finance@example.com',
      securityClass: 'restricted',
      tags: ['finance', 'calculation'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lifecycleState: 'staging',
      qualityScore: 78,
      complianceTags: ['PCI', 'PII'],
      agentPersonaRules: {
        'finance-agent': true,
        'junior-agent': false
      },
      rateLimits: {
        maxPerMinute: 200,
        maxConcurrency: 10,
        timeoutMs: 15000,
        retryPolicy: 'exponential'
      },
      agentFeedback: {
        successRate: 0.90,
        avgLatencyMs: 120,
        failureRate: 0.10
      }
    }
  ];

  private mockBundles: Bundle[] = [
    {
      bundleId: 'bundle-1',
      name: 'Document Processing Suite',
      description: 'A comprehensive suite of tools for document processing',
      toolIds: ['tool-1', 'tool-2'],
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerTeam: 'platform-team',
      tags: ['document', 'processing'],
      active: true
    }
  ];

  getMockTools(): Tool[] {
    return [...this.mockTools];
  }

  getMockTool(id: string): Tool | undefined {
    return this.mockTools.find(t => t.toolId === id);
  }

  getMockBundles(): Bundle[] {
    return [...this.mockBundles];
  }

  getMockBundle(id: string): Bundle | undefined {
    return this.mockBundles.find(b => b.bundleId === id);
  }

  getMockDependencies(toolId: string): any {
    return {
      toolId,
      dependsOnTools: toolId === 'tool-2' ? ['tool-1'] : [],
      dependsOnServices: [],
      modelDependencies: []
    };
  }

  getMockQualityScore(toolId: string): any {
    const tool = this.getMockTool(toolId);
    return {
      toolId,
      score: tool?.qualityScore || 80,
      metrics: {
        uptime: 0.99,
        latency: tool?.agentFeedback?.avgLatencyMs || 200,
        failureRate: tool?.agentFeedback?.failureRate || 0.05,
        security: 0.9,
        documentation: 0.85
      }
    };
  }

  getMockLifecycleDashboard(): any {
    return {
      totalTools: this.mockTools.length,
      productionTools: this.mockTools.filter(t => t.lifecycleState === 'production').length,
      stagingTools: this.mockTools.filter(t => t.lifecycleState === 'staging').length,
      developmentTools: this.mockTools.filter(t => t.lifecycleState === 'development').length,
      deprecatedTools: this.mockTools.filter(t => t.lifecycleState === 'deprecated').length
    };
  }

  getMockOrphans(): Tool[] {
    return this.mockTools.filter(t => !t.ownerTeam || t.ownerTeam.trim() === '');
  }
}

