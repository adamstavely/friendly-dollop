import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const dependenciesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/dependency-graph/dependency-graph.component').then(m => m.DependencyGraphComponent),
    canActivate: [authGuard]
  }
];

