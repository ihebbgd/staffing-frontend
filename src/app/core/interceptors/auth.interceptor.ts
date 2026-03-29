import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // read the token we saved at login
  const token = localStorage.getItem('accessToken');

  // if there's a token, clone the request and add the Authorization header
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(authReq);
  }

  // no token (e.g. the login request itself) — send it through untouched
  return next(req);
};
