import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const personasRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/persona-matrix/persona-matrix.component').then(m => m.PersonaMatrixComponent),
    canActivate: [authGuard]
  }
];

