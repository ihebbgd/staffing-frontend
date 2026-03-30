import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('accessToken');

  // if a token exists, allow access
  if (token) {
    return true;
  }

  // otherwise, redirect to login and block the route
  return router.createUrlTree(['/login']);
};
