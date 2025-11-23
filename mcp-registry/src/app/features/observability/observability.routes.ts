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
  },
  {
    path: 'generations/:id',
    loadComponent: () => import('./components/generation-viewer/generation-viewer.component').then(m => m.GenerationViewerComponent)
  },
  {
    path: 'scores',
    loadComponent: () => import('./components/score-analytics/score-analytics.component').then(m => m.ScoreAnalyticsComponent)
  }
];
