import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const schemaRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/schema-viewer/schema-viewer.component').then(m => m.SchemaViewerComponent),
    canActivate: [authGuard]
  }
];

