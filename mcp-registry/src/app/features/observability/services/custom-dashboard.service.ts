import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table';
  title: string;
  config?: {
    metric?: string;
    label?: string;
    chartType?: 'line' | 'bar' | 'pie';
    dataType?: string;
    columns?: string[];
    [key: string]: any;
  };
}

export interface CustomDashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  filters?: any;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomDashboardService {
  private readonly STORAGE_KEY = 'observability-custom-dashboards';
  private dashboardsSubject: BehaviorSubject<CustomDashboard[]>;
  public dashboards$: Observable<CustomDashboard[]>;

  constructor() {
    const savedDashboards = this.loadFromStorage();
    this.dashboardsSubject = new BehaviorSubject<CustomDashboard[]>(savedDashboards);
    this.dashboards$ = this.dashboardsSubject.asObservable();
  }

  /**
   * Get all dashboards
   */
  getDashboards(): CustomDashboard[] {
    return this.dashboardsSubject.value;
  }

  /**
   * Get a dashboard by ID
   */
  getDashboard(id: string): CustomDashboard | null {
    const dashboard = this.dashboardsSubject.value.find(d => d.id === id);
    return dashboard ? { ...dashboard } : null;
  }

  /**
   * Create a new dashboard
   */
  createDashboard(name: string, description?: string): CustomDashboard {
    const dashboard: CustomDashboard = {
      id: this.generateId(),
      name,
      description,
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const dashboards = [...this.dashboardsSubject.value, dashboard];
    this.dashboardsSubject.next(dashboards);
    this.saveToStorage(dashboards);

    return dashboard;
  }

  /**
   * Update a dashboard
   */
  updateDashboard(id: string, updates: Partial<CustomDashboard>): CustomDashboard | null {
    const dashboards = this.dashboardsSubject.value;
    const index = dashboards.findIndex(d => d.id === id);

    if (index === -1) {
      return null;
    }

    const updatedDashboard: CustomDashboard = {
      ...dashboards[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    dashboards[index] = updatedDashboard;
    this.dashboardsSubject.next(dashboards);
    this.saveToStorage(dashboards);

    return updatedDashboard;
  }

  /**
   * Delete a dashboard
   */
  deleteDashboard(id: string): boolean {
    const dashboards = this.dashboardsSubject.value.filter(d => d.id !== id);

    if (dashboards.length === this.dashboardsSubject.value.length) {
      return false; // Dashboard not found
    }

    this.dashboardsSubject.next(dashboards);
    this.saveToStorage(dashboards);
    return true;
  }

  /**
   * Duplicate a dashboard
   */
  duplicateDashboard(id: string, newName?: string): CustomDashboard {
    const original = this.getDashboard(id);
    if (!original) {
      throw new Error('Dashboard not found');
    }

    const duplicate: CustomDashboard = {
      ...original,
      id: this.generateId(),
      name: newName || `${original.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      widgets: original.widgets.map(w => ({
        ...w,
        id: this.generateId()
      }))
    };

    const dashboards = [...this.dashboardsSubject.value, duplicate];
    this.dashboardsSubject.next(dashboards);
    this.saveToStorage(dashboards);

    return duplicate;
  }

  /**
   * Load dashboards from localStorage
   */
  private loadFromStorage(): CustomDashboard[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load dashboards from storage:', e);
    }
    return [];
  }

  /**
   * Save dashboards to localStorage
   */
  private saveToStorage(dashboards: CustomDashboard[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dashboards));
    } catch (e) {
      console.error('Failed to save dashboards to storage:', e);
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `dashboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

