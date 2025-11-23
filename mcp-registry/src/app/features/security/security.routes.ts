import { Routes } from '@angular/router';

export const securityRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/security-dashboard/security-dashboard.component').then(m => m.SecurityDashboardComponent)
  },
  {
    path: 'scans',
    loadComponent: () => import('./components/security-scan-list/security-scan-list.component').then(m => m.SecurityScanListComponent)
  },
  {
    path: 'scan/:id',
    loadComponent: () => import('./components/security-scan/security-scan.component').then(m => m.SecurityScanComponent)
  },
  {
    path: 'rules',
    loadComponent: () => import('./components/security-rules/security-rules.component').then(m => m.SecurityRulesComponent)
  }
];

