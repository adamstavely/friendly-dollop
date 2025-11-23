import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const lifecycleRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/lifecycle-dashboard/lifecycle-dashboard.component').then(m => m.LifecycleDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'approvals',
    loadComponent: () => import('./components/approval-interface/approval-interface.component').then(m => m.ApprovalInterfaceComponent),
    canActivate: [authGuard]
  },
  {
    path: 'promote/:id',
    loadComponent: () => import('./components/promotion-workflow/promotion-workflow.component').then(m => m.PromotionWorkflowComponent),
    canActivate: [authGuard]
  }
];

