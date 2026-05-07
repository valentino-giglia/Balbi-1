import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const shouldSkip = req.url.includes('/auth/login');

  const authReq = !token || shouldSkip
    ? req
    : req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        authService.handleUnauthorized();
      }
      return throwError(() => error);
    })
  );
};

