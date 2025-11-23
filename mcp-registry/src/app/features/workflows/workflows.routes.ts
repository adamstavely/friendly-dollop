import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const workflowRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/workflow-list/workflow-list.component').then(m => m.WorkflowListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'new',
    loadComponent: () => import('./components/workflow-builder/workflow-builder.component').then(m => m.WorkflowBuilderComponent),
    canActivate: [authGuard]
  },
  {
    path: 'templates',
    loadComponent: () => import('./components/workflow-templates/workflow-templates.component').then(m => m.WorkflowTemplatesComponent),
    canActivate: [authGuard]
  },
  {
    path: ':id',
    loadComponent: () => import('./components/workflow-detail/workflow-detail.component').then(m => m.WorkflowDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./components/workflow-builder/workflow-builder.component').then(m => m.WorkflowBuilderComponent),
    canActivate: [authGuard]
  }
];

