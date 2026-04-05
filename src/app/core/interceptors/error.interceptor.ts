import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { getApiErrorMessage } from '../http/api-error';
import { ToastService } from '../services/toast.service';

/**
 * Global safety net for *unexpected* failures — network outages, 5xx, and 403s.
 * Expected client errors (400/404/409) are left to each feature to surface
 * inline next to the relevant form field. 401s are handled by authInterceptor.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const isUnexpected = error.status === 0 || error.status === 403 || error.status >= 500;
        if (isUnexpected) {
          toast.error(getApiErrorMessage(error));
        }
      }
      return throwError(() => error);
    }),
  );
};
