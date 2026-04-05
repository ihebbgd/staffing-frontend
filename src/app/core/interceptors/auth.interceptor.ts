import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  filter,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';

// Endpoints that must never carry a bearer token or trigger a refresh loop.
const AUTH_PATHS = ['/auth/login', '/auth/refresh'];

// Shared across requests so a burst of 401s triggers exactly one refresh.
let isRefreshing = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

function isAuthEndpoint(url: string): boolean {
  return AUTH_PATHS.some((path) => url.includes(path));
}

function withBearer<T>(req: HttpRequest<T>, token: string): HttpRequest<T> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/**
 * Attaches the JWT to every request and, on a 401, transparently refreshes the
 * token pair once and retries the failed request. If the refresh itself fails,
 * the session is cleared and the user is sent to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = session.accessToken;
  const authReq = token && !isAuthEndpoint(req.url) ? withBearer(req, token) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      const is401 = error instanceof HttpErrorResponse && error.status === 401;

      // Don't try to refresh for the login/refresh calls themselves, or when
      // we have no refresh token to spend.
      if (!is401 || isAuthEndpoint(req.url) || !session.refreshToken) {
        return throwError(() => error);
      }

      return handle401(req, next, auth, session, router);
    }),
  );
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  session: SessionService,
  router: Router,
): Observable<HttpEvent<unknown>> {
  if (isRefreshing) {
    // A refresh is already in flight — wait for the new token, then retry.
    return refreshedToken$.pipe(
      filter((t): t is string => t !== null),
      take(1),
      switchMap((newToken) => next(withBearer(req, newToken))),
    );
  }

  isRefreshing = true;
  refreshedToken$.next(null);

  return auth.refresh().pipe(
    switchMap((res) => {
      isRefreshing = false;
      refreshedToken$.next(res.accessToken);
      return next(withBearer(req, res.accessToken));
    }),
    catchError((refreshError: unknown) => {
      isRefreshing = false;
      session.clear();
      void router.navigate(['/login']);
      return throwError(() => refreshError);
    }),
  );
}
