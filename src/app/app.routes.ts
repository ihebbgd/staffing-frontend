import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Shell } from './layout/shell/shell';
import { authGuard } from './core/guards/auth.guard';
import { homePath, roleGuard } from './core/guards/role.guard';
import { SessionService } from './core/services/session.service';

// Roles reflect what each endpoint group documents. The backend is the real
// authority; these guards just keep users out of pages they can't use.
const MANAGE = roleGuard('ADMIN', 'MANAGER');
const ADMIN = roleGuard('ADMIN');

// Feature pages are lazy-loaded so they are not part of the initial bundle; only the
// login screen and the shell layout load eagerly.
export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      // Dashboard is a management overview (ADMIN/MANAGER). The personal workspace is open to
      // any authenticated user; the Me page shows a friendly notice when no employee profile exists.
      {
        path: 'dashboard',
        canActivate: [MANAGE],
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      { path: 'me', loadComponent: () => import('./features/me/me').then((m) => m.Me) },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications').then((m) => m.Notifications),
      },

      // ADMIN / MANAGER management surfaces.
      {
        path: 'employees',
        canActivate: [MANAGE],
        loadComponent: () => import('./features/employees/employees').then((m) => m.Employees),
      },
      {
        path: 'projects',
        canActivate: [MANAGE],
        loadComponent: () => import('./features/projects/projects').then((m) => m.Projects),
      },
      {
        path: 'allocations',
        canActivate: [MANAGE],
        loadComponent: () => import('./features/allocations/allocations').then((m) => m.Allocations),
      },
      {
        path: 'skills',
        canActivate: [MANAGE],
        loadComponent: () => import('./features/skills/skills').then((m) => m.Skills),
      },
      {
        path: 'certifications',
        canActivate: [MANAGE],
        loadComponent: () => import('./features/certifications/certifications').then((m) => m.Certifications),
      },
      {
        path: 'bench',
        canActivate: [MANAGE],
        loadComponent: () => import('./features/bench/bench').then((m) => m.Bench),
      },
      {
        path: 'recommendations',
        canActivate: [MANAGE],
        loadComponent: () => import('./features/recommendations/recommendations').then((m) => m.Recommendations),
      },
      {
        path: 'reports',
        canActivate: [MANAGE],
        loadComponent: () => import('./features/reports/reports').then((m) => m.Reports),
      },

      // ADMIN-only.
      {
        path: 'users',
        canActivate: [ADMIN],
        loadComponent: () => import('./features/users/users').then((m) => m.Users),
      },
      {
        path: 'audit-logs',
        canActivate: [ADMIN],
        loadComponent: () => import('./features/audit-logs/audit-logs').then((m) => m.AuditLogs),
      },

      // Role-aware landing: managers/admins → dashboard, employees → personal workspace.
      {
        path: '',
        pathMatch: 'full',
        redirectTo: () => inject(Router).parseUrl(homePath(inject(SessionService).role())),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
