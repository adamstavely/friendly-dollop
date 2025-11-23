import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ToolService } from '../../features/tools/services/tool.service';
import { BundleService } from '../../features/bundles/services/bundle.service';
import { Tool } from '../../shared/models/tool.model';
import { Bundle } from '../../shared/models/bundle.model';

export interface SearchResult {
  type: 'tool' | 'bundle' | 'schema';
  id: string;
  name: string;
  description?: string;
  url: string;
  metadata?: any;
}

export interface SearchFilters {
  type?: 'tool' | 'bundle' | 'schema' | 'all';
  domain?: string;
  lifecycleState?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchHistory: string[] = [];

  constructor(
    private toolService: ToolService,
    private bundleService: BundleService
  ) {
    this.loadSearchHistory();
  }

  search(query: string, filters?: SearchFilters): Observable<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return of([]);
    }

    const searchTerm = query.toLowerCase().trim();
    const results: Observable<SearchResult[]>[] = [];

    // Search tools
    if (!filters || filters.type === 'all' || filters.type === 'tool' || !filters.type) {
      results.push(
        this.toolService.getTools({ 
          q: searchTerm, 
          limit: 50,
          domain: filters?.domain,
          lifecycleState: filters?.lifecycleState
        }).pipe(
          map(response => response.tools.map(tool => ({
            type: 'tool' as const,
            id: tool.toolId,
            name: tool.name,
            description: tool.description,
            url: `/tools/${tool.toolId}`,
            metadata: {
              domain: tool.domain,
              lifecycleState: tool.lifecycleState,
              qualityScore: tool.qualityScore
            }
          }))),
          catchError(() => of([]))
        )
      );
    }

    // Search bundles
    if (!filters || filters.type === 'all' || filters.type === 'bundle' || !filters.type) {
      results.push(
        this.bundleService.getBundles().pipe(
          map(bundles => bundles
            .filter(bundle => 
              bundle.name.toLowerCase().includes(searchTerm) ||
              bundle.description?.toLowerCase().includes(searchTerm)
            )
            .map(bundle => ({
              type: 'bundle' as const,
              id: bundle.bundleId,
              name: bundle.name,
              description: bundle.description,
              url: `/bundles/${bundle.bundleId}`,
              metadata: {
                version: bundle.version,
                toolCount: bundle.toolIds.length
              }
            }))),
          catchError(() => of([]))
        )
      );
    }

    if (results.length === 0) {
      return of([]);
    }

    return forkJoin(results).pipe(
      map(resultArrays => {
        const allResults = resultArrays.flat();
        this.addToHistory(query);
        return allResults;
      })
    );
  }

  getSuggestions(query: string): Observable<string[]> {
    if (!query || query.trim().length < 1) {
      return of([]);
    }

    const searchTerm = query.toLowerCase().trim();
    const suggestions: string[] = [];

    // Get suggestions from tools
    this.toolService.getTools({ q: searchTerm, limit: 10 }).subscribe({
      next: (response) => {
        response.tools.forEach(tool => {
          if (tool.name.toLowerCase().includes(searchTerm)) {
            suggestions.push(tool.name);
          }
        });
      }
    });

    // Get suggestions from history
    this.searchHistory
      .filter(term => term.toLowerCase().includes(searchTerm))
      .slice(0, 5)
      .forEach(term => {
        if (!suggestions.includes(term)) {
          suggestions.push(term);
        }
      });

    return of(suggestions.slice(0, 10));
  }

  addToHistory(query: string): void {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    // Remove if exists
    const index = this.searchHistory.indexOf(trimmed);
    if (index > -1) {
      this.searchHistory.splice(index, 1);
    }

    // Add to front
    this.searchHistory.unshift(trimmed);

    // Keep only last 20
    if (this.searchHistory.length > 20) {
      this.searchHistory = this.searchHistory.slice(0, 20);
    }

    this.saveSearchHistory();
  }

  getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  clearSearchHistory(): void {
    this.searchHistory = [];
    this.saveSearchHistory();
  }

  private loadSearchHistory(): void {
    try {
      const saved = localStorage.getItem('search-history');
      if (saved) {
        this.searchHistory = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load search history:', e);
    }
  }

  private saveSearchHistory(): void {
    try {
      localStorage.setItem('search-history', JSON.stringify(this.searchHistory));
    } catch (e) {
      console.error('Failed to save search history:', e);
    }
  }
}

