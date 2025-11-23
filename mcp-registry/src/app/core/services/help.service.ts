import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relatedArticles?: string[];
}

export interface HelpCategory {
  id: string;
  name: string;
  icon: string;
  articles: HelpArticle[];
}

@Injectable({
  providedIn: 'root'
})
export class HelpService {
  private articles: HelpArticle[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: `
        <h2>Welcome to MCP Registry</h2>
        <p>The MCP Registry is a centralized system for managing Model Context Protocol (MCP) tools and services.</p>
        <h3>Key Features:</h3>
        <ul>
          <li><strong>Tool Management:</strong> Register, update, and manage MCP tools</li>
          <li><strong>Lifecycle Management:</strong> Track tools through development, staging, pilot, and production</li>
          <li><strong>Quality Metrics:</strong> Monitor tool performance and quality scores</li>
          <li><strong>Dependency Tracking:</strong> Visualize relationships between tools</li>
          <li><strong>Bundle Management:</strong> Group related tools together</li>
        </ul>
        <h3>Quick Start:</h3>
        <ol>
          <li>Navigate to <strong>Tools</strong> to view all registered tools</li>
          <li>Click <strong>New Tool</strong> to register a new MCP tool</li>
          <li>Use the <strong>Dashboard</strong> for an overview of your registry</li>
        </ol>
      `,
      category: 'general',
      tags: ['getting-started', 'overview']
    },
    {
      id: 'tool-lifecycle',
      title: 'Tool Lifecycle Management',
      content: `
        <h2>Tool Lifecycle States</h2>
        <p>Tools progress through several lifecycle states:</p>
        <ul>
          <li><strong>Development:</strong> Tool is under active development</li>
          <li><strong>Staging:</strong> Tool is ready for testing in a staging environment</li>
          <li><strong>Pilot:</strong> Tool is being tested with a limited user base</li>
          <li><strong>Production:</strong> Tool is live and available for general use</li>
          <li><strong>Deprecated:</strong> Tool is no longer recommended but still available</li>
          <li><strong>Retired:</strong> Tool has been removed from service</li>
        </ul>
        <h3>Promoting Tools</h3>
        <p>To promote a tool to the next lifecycle state:</p>
        <ol>
          <li>Navigate to the <strong>Lifecycle</strong> section</li>
          <li>Select the tool you want to promote</li>
          <li>Review and complete all promotion requirements</li>
          <li>Request approval if required</li>
          <li>Confirm the promotion</li>
        </ol>
      `,
      category: 'lifecycle',
      tags: ['lifecycle', 'promotion', 'states']
    },
    {
      id: 'quality-metrics',
      title: 'Understanding Quality Metrics',
      content: `
        <h2>Quality Scoring</h2>
        <p>Tools are scored based on several factors:</p>
        <ul>
          <li><strong>Success Rate:</strong> Percentage of successful tool invocations</li>
          <li><strong>Average Latency:</strong> Mean response time in milliseconds</li>
          <li><strong>Failure Rate:</strong> Percentage of failed invocations</li>
          <li><strong>Agent Feedback:</strong> Ratings and comments from users</li>
        </ul>
        <h3>Quality Score Calculation</h3>
        <p>The overall quality score (0-100) is calculated from:</p>
        <ul>
          <li>Success rate (40%)</li>
          <li>Latency performance (30%)</li>
          <li>User feedback (20%)</li>
          <li>Uptime/availability (10%)</li>
        </ul>
        <h3>Improving Quality</h3>
        <p>To improve your tool's quality score:</p>
        <ol>
          <li>Monitor metrics in the <strong>Quality</strong> dashboard</li>
          <li>Review agent feedback and address common issues</li>
          <li>Optimize for lower latency</li>
          <li>Ensure high availability and uptime</li>
        </ol>
      `,
      category: 'quality',
      tags: ['quality', 'metrics', 'scoring']
    },
    {
      id: 'dependencies',
      title: 'Managing Dependencies',
      content: `
        <h2>Tool Dependencies</h2>
        <p>Tools can depend on other tools or external services. The dependency graph helps visualize these relationships.</p>
        <h3>Viewing Dependencies</h3>
        <ul>
          <li>Navigate to <strong>Dependencies</strong> to see the full dependency graph</li>
          <li>Click on a tool in the graph to view its details</li>
          <li>Use filters to show only tools in specific lifecycle states</li>
        </ul>
        <h3>Adding Dependencies</h3>
        <p>When creating or editing a tool:</p>
        <ol>
          <li>Go to the tool's edit page</li>
          <li>Find the <strong>Dependency Graph</strong> section</li>
          <li>Add tool IDs that this tool depends on</li>
          <li>Save the changes</li>
        </ol>
        <h3>Impact Analysis</h3>
        <p>Before retiring or deprecating a tool, check:</p>
        <ul>
          <li>Reverse dependencies (tools that depend on this one)</li>
          <li>Bundle membership</li>
          <li>Production usage</li>
        </ul>
      `,
      category: 'dependencies',
      tags: ['dependencies', 'graph', 'relationships']
    },
    {
      id: 'bundles',
      title: 'Working with Bundles',
      content: `
        <h2>Tool Bundles</h2>
        <p>Bundles allow you to group related tools together for easier management and deployment.</p>
        <h3>Creating a Bundle</h3>
        <ol>
          <li>Navigate to <strong>Bundles</strong></li>
          <li>Click <strong>New Bundle</strong></li>
          <li>Enter bundle name, description, and version</li>
          <li>Select tools to include in the bundle</li>
          <li>Save the bundle</li>
        </ol>
        <h3>Bundle Management</h3>
        <ul>
          <li><strong>Active/Inactive:</strong> Toggle bundle availability</li>
          <li><strong>Versioning:</strong> Track bundle versions</li>
          <li><strong>Tool Updates:</strong> Update tools within a bundle</li>
        </ul>
      `,
      category: 'bundles',
      tags: ['bundles', 'grouping', 'deployment']
    },
    {
      id: 'search',
      title: 'Using Global Search',
      content: `
        <h2>Global Search</h2>
        <p>The global search allows you to quickly find tools, bundles, and other resources.</p>
        <h3>Search Features</h3>
        <ul>
          <li><strong>Quick Search:</strong> Type in the search bar in the toolbar</li>
          <li><strong>Keyboard Shortcut:</strong> Press Ctrl+K (or Cmd+K on Mac) to open search</li>
          <li><strong>Autocomplete:</strong> Get suggestions as you type</li>
          <li><strong>Search History:</strong> View your recent searches</li>
        </ul>
        <h3>Search Tips</h3>
        <ul>
          <li>Search by tool name, ID, or description</li>
          <li>Use filters to narrow results by type, domain, or state</li>
          <li>Click on a result to navigate directly</li>
        </ul>
      `,
      category: 'general',
      tags: ['search', 'navigation', 'shortcuts']
    }
  ];

  private categories: HelpCategory[] = [
    {
      id: 'general',
      name: 'General',
      icon: 'help',
      articles: this.articles.filter(a => a.category === 'general')
    },
    {
      id: 'lifecycle',
      name: 'Lifecycle',
      icon: 'timeline',
      articles: this.articles.filter(a => a.category === 'lifecycle')
    },
    {
      id: 'quality',
      name: 'Quality',
      icon: 'assessment',
      articles: this.articles.filter(a => a.category === 'quality')
    },
    {
      id: 'dependencies',
      name: 'Dependencies',
      icon: 'account_tree',
      articles: this.articles.filter(a => a.category === 'dependencies')
    },
    {
      id: 'bundles',
      name: 'Bundles',
      icon: 'inventory_2',
      articles: this.articles.filter(a => a.category === 'bundles')
    }
  ];

  getCategories(): Observable<HelpCategory[]> {
    return of(this.categories);
  }

  getArticle(id: string): Observable<HelpArticle | undefined> {
    const article = this.articles.find(a => a.id === id);
    return of(article);
  }

  searchArticles(query: string): Observable<HelpArticle[]> {
    const searchTerm = query.toLowerCase();
    return of(
      this.articles.filter(article =>
        article.title.toLowerCase().includes(searchTerm) ||
        article.content.toLowerCase().includes(searchTerm) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    );
  }

  getArticlesByCategory(categoryId: string): Observable<HelpArticle[]> {
    return of(this.articles.filter(a => a.category === categoryId));
  }

  getContextualHelp(context: string): Observable<HelpArticle | undefined> {
    // Map context strings to help articles
    const contextMap: Record<string, string> = {
      'tool-detail': 'getting-started',
      'lifecycle': 'tool-lifecycle',
      'quality': 'quality-metrics',
      'dependencies': 'dependencies',
      'bundles': 'bundles',
      'search': 'search'
    };

    const articleId = contextMap[context];
    return articleId ? this.getArticle(articleId) : of(undefined);
  }
}

