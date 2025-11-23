import { Routes } from '@angular/router';

export const promptsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/prompt-list/prompt-list.component').then(m => m.PromptListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./components/prompt-form/prompt-form.component').then(m => m.PromptFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/prompt-detail/prompt-detail.component').then(m => m.PromptDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./components/prompt-form/prompt-form.component').then(m => m.PromptFormComponent)
  },
  {
    path: ':id/playground',
    loadComponent: () => import('./components/prompt-playground/prompt-playground.component').then(m => m.PromptPlaygroundComponent)
  },
  {
    path: ':id/versions',
    loadComponent: () => import('./components/prompt-version-history/prompt-version-history.component').then(m => m.PromptVersionHistoryComponent)
  },
  {
    path: ':id/compare',
    loadComponent: () => import('./components/prompt-comparison/prompt-comparison.component').then(m => m.PromptComparisonComponent)
  },
  {
    path: ':id/dataset',
    loadComponent: () => import('./components/test-dataset/test-dataset.component').then(m => m.TestDatasetComponent)
  },
  {
    path: ':id/analytics',
    loadComponent: () => import('./components/prompt-analytics/prompt-analytics.component').then(m => m.PromptAnalyticsComponent)
  }
];
