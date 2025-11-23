import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const retirementRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/retirement-console/retirement-console.component').then(m => m.RetirementConsoleComponent),
    canActivate: [authGuard]
  }
];

