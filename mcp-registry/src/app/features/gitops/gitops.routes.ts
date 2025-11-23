import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const gitopsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/gitops-sync/gitops-sync.component').then(m => m.GitOpsSyncComponent),
    canActivate: [authGuard]
  }
];

