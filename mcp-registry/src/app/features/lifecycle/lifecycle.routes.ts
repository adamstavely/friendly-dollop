import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const lifecycleRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/lifecycle-dashboard/lifecycle-dashboard.component').then(m => m.LifecycleDashboardComponent),
    canActivate: [authGuard]
  }
];

