import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const toolRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/tool-list/tool-list.component').then(m => m.ToolListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'new',
    loadComponent: () => import('./components/tool-form/tool-form.component').then(m => m.ToolFormComponent),
    canActivate: [authGuard]
  },
  {
    path: ':id',
    loadComponent: () => import('./components/tool-detail/tool-detail.component').then(m => m.ToolDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./components/tool-form/tool-form.component').then(m => m.ToolFormComponent),
    canActivate: [authGuard]
  }
];

