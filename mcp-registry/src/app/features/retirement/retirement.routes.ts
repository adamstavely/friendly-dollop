import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const retirementRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/retirement-console/retirement-console.component').then(m => m.RetirementConsoleComponent),
    canActivate: [authGuard]
  },
  {
    path: 'schedule/:id',
    loadComponent: () => import('./components/retirement-scheduler/retirement-scheduler.component').then(m => m.RetirementSchedulerComponent),
    canActivate: [authGuard]
  }
];

