import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const bundlesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/bundle-list/bundle-list.component').then(m => m.BundleListComponent),
    canActivate: [authGuard]
  }
];

