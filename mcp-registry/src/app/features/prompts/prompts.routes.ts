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
    path: 'playground',
    loadComponent: () => import('./components/prompt-playground/prompt-playground.component').then(m => m.PromptPlaygroundComponent)
  },
  {
    path: ':id/versions',
    loadComponent: () => import('./components/prompt-version-history/prompt-version-history.component').then(m => m.PromptVersionHistoryComponent)
  }
];
