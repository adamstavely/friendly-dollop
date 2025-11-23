import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TraceFilters } from './observability.service';

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: TraceFilters;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class SavedFiltersService {
  private readonly STORAGE_KEY = 'observability-saved-filters';
  private filtersSubject: BehaviorSubject<SavedFilter[]>;
  public filters$: Observable<SavedFilter[]>;

  constructor() {
    const savedFilters = this.loadFromStorage();
    this.filtersSubject = new BehaviorSubject<SavedFilter[]>(savedFilters);
    this.filters$ = this.filtersSubject.asObservable();
  }

  /**
   * Get all saved filters
   */
  getSavedFilters(): SavedFilter[] {
    return this.filtersSubject.value;
  }

  /**
   * Get a saved filter by ID
   */
  getSavedFilter(id: string): SavedFilter | undefined {
    return this.filtersSubject.value.find(f => f.id === id);
  }

  /**
   * Save a new filter
   */
  saveFilter(name: string, filters: TraceFilters, description?: string): SavedFilter {
    const savedFilter: SavedFilter = {
      id: this.generateId(),
      name,
      description,
      filters: this.sanitizeFilters(filters),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const filters = [...this.filtersSubject.value, savedFilter];
    this.filtersSubject.next(filters);
    this.saveToStorage(filters);

    return savedFilter;
  }

  /**
   * Update an existing saved filter
   */
  updateFilter(id: string, updates: Partial<SavedFilter>): SavedFilter | null {
    const filters = this.filtersSubject.value;
    const index = filters.findIndex(f => f.id === id);
    
    if (index === -1) {
      return null;
    }

    const updatedFilter: SavedFilter = {
      ...filters[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.filters) {
      updatedFilter.filters = this.sanitizeFilters(updates.filters);
    }

    filters[index] = updatedFilter;
    this.filtersSubject.next(filters);
    this.saveToStorage(filters);

    return updatedFilter;
  }

  /**
   * Delete a saved filter
   */
  deleteFilter(id: string): boolean {
    const filters = this.filtersSubject.value.filter(f => f.id !== id);
    
    if (filters.length === this.filtersSubject.value.length) {
      return false; // Filter not found
    }

    this.filtersSubject.next(filters);
    this.saveToStorage(filters);
    return true;
  }

  /**
   * Apply a saved filter (returns the filter configuration)
   */
  applyFilter(id: string): TraceFilters | null {
    const savedFilter = this.getSavedFilter(id);
    return savedFilter ? { ...savedFilter.filters } : null;
  }

  /**
   * Sanitize filters to remove undefined/null values and convert dates
   */
  private sanitizeFilters(filters: TraceFilters): TraceFilters {
    const sanitized: TraceFilters = {};
    
    if (filters.userId) sanitized.userId = filters.userId;
    if (filters.sessionId) sanitized.sessionId = filters.sessionId;
    if (filters.name) sanitized.name = filters.name;
    if (filters.tags && filters.tags.length > 0) sanitized.tags = [...filters.tags];
    if (filters.fromTimestamp) sanitized.fromTimestamp = new Date(filters.fromTimestamp);
    if (filters.toTimestamp) sanitized.toTimestamp = new Date(filters.toTimestamp);
    if (filters.workflowId) sanitized.workflowId = filters.workflowId;
    if (filters.toolId) sanitized.toolId = filters.toolId;
    if (filters.status) sanitized.status = filters.status;
    if (filters.limit) sanitized.limit = filters.limit;
    if (filters.page) sanitized.page = filters.page;

    return sanitized;
  }

  /**
   * Load saved filters from localStorage
   */
  private loadFromStorage(): SavedFilter[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const filters = JSON.parse(stored);
        // Convert date strings back to Date objects
        return filters.map((f: any) => ({
          ...f,
          filters: {
            ...f.filters,
            fromTimestamp: f.filters.fromTimestamp ? new Date(f.filters.fromTimestamp) : undefined,
            toTimestamp: f.filters.toTimestamp ? new Date(f.filters.toTimestamp) : undefined
          }
        }));
      }
    } catch (e) {
      console.error('Failed to load saved filters from storage:', e);
    }
    return [];
  }

  /**
   * Save filters to localStorage
   */
  private saveToStorage(filters: SavedFilter[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
      console.error('Failed to save filters to storage:', e);
    }
  }

  /**
   * Generate a unique ID for a saved filter
   */
  private generateId(): string {
    return `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

