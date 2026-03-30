import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Shell } from './layout/shell/shell';
import { Dashboard } from './features/dashboard/dashboard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },

    ],
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
