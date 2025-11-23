import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const complianceRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/compliance-viewer/compliance-viewer.component').then(m => m.ComplianceViewerComponent),
    canActivate: [authGuard]
  }
];

