import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const token  = auth.authToken();

  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // If the server rejects a request that carried a token, the token is
      // invalid or expired — clear the local session and send the user to login.
      if (error.status === 401 && token) {
        auth.invalidateSession();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
