import { Routes } from '@angular/router';
import { toolRoutes } from './features/tools/tool.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes)
  },
  {
    path: 'tools',
    children: toolRoutes
  },
  {
    path: 'lifecycle',
    loadChildren: () => import('./features/lifecycle/lifecycle.routes').then(m => m.lifecycleRoutes)
  },
  {
    path: 'dependencies',
    loadChildren: () => import('./features/dependencies/dependencies.routes').then(m => m.dependenciesRoutes)
  },
  {
    path: 'quality',
    loadChildren: () => import('./features/quality/quality.routes').then(m => m.qualityRoutes)
  },
  {
    path: 'bundles',
    loadChildren: () => import('./features/bundles/bundles.routes').then(m => m.bundlesRoutes)
  },
  {
    path: 'policies',
    loadChildren: () => import('./features/policies/policies.routes').then(m => m.policiesRoutes)
  },
  {
    path: 'gitops',
    loadChildren: () => import('./features/gitops/gitops.routes').then(m => m.gitopsRoutes)
  },
  {
    path: 'retirement',
    loadChildren: () => import('./features/retirement/retirement.routes').then(m => m.retirementRoutes)
  },
  {
    path: 'personas',
    loadChildren: () => import('./features/personas/personas.routes').then(m => m.personasRoutes)
  },
  {
    path: 'compliance',
    loadChildren: () => import('./features/compliance/compliance.routes').then(m => m.complianceRoutes)
  },
  {
    path: 'schema',
    loadChildren: () => import('./features/schema/schema.routes').then(m => m.schemaRoutes)
  },
  {
    path: 'inspector',
    loadChildren: () => import('./features/inspector/inspector.routes').then(m => m.inspectorRoutes)
  }
];
