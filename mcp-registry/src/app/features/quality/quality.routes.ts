import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const qualityRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/quality-dashboard/quality-dashboard.component').then(m => m.QualityDashboardComponent),
    canActivate: [authGuard]
  }
];

