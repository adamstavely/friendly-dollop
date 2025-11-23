import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const bundlesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/bundle-list/bundle-list.component').then(m => m.BundleListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'new',
    loadComponent: () => import('./components/bundle-form/bundle-form.component').then(m => m.BundleFormComponent),
    canActivate: [authGuard]
  },
  {
    path: ':id',
    loadComponent: () => import('./components/bundle-detail/bundle-detail.component').then(m => m.BundleDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./components/bundle-form/bundle-form.component').then(m => m.BundleFormComponent),
    canActivate: [authGuard]
  }
];

