import { Routes } from '@angular/router';

export const observabilityRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/observability-dashboard/observability-dashboard.component').then(m => m.ObservabilityDashboardComponent)
  },
  {
    path: 'traces',
    loadComponent: () => import('./components/trace-list/trace-list.component').then(m => m.TraceListComponent)
  },
  {
    path: 'traces/:id',
    loadComponent: () => import('./components/trace-detail/trace-detail.component').then(m => m.TraceDetailComponent)
  }
];
