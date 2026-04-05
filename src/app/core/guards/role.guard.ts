import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models/common.model';
import { SessionService } from '../services/session.service';

/**
 * The landing route for a role. Employees have no management Dashboard, so they land on
 * their personal workspace; everyone with management access lands on the Dashboard. Used
 * both for the index redirect and as the fallback when a role guard blocks a route — this
 * keeps a blocked user from being redirected to another page they also can't access.
 */
export function homePath(role: Role | null): string {
  if (role === null) return '/login';
  return role === 'EMPLOYEE' ? '/me' : '/dashboard';
}

/**
 * Factory guard that restricts a route to the given roles. This is a UX gate
 * only — the backend remains the real authority on every request.
 *
 *   { path: 'users', canActivate: [roleGuard('ADMIN')], component: Users }
 */
export function roleGuard(...allowed: Role[]): CanActivateFn {
  return () => {
    const session = inject(SessionService);
    const router = inject(Router);

    if (!session.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }
    return session.hasRole(...allowed) ? true : router.createUrlTree([homePath(session.role())]);
  };
}
