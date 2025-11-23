import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const policiesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/policy-viewer/policy-viewer.component').then(m => m.PolicyViewerComponent),
    canActivate: [authGuard]
  }
];

