import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const inspectorRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/inspector-standalone/inspector-standalone.component').then(m => m.InspectorStandaloneComponent),
    canActivate: [authGuard]
  }
];


