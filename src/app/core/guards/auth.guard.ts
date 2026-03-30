import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);

  return auth.fetchMe().pipe(
    map(member => {
      if (member.registrationStatus === null) {
        return router.createUrlTree(['/join']);
      }
      if (member.registrationStatus === 'rejected') {
        auth.invalidateSession();
        return router.createUrlTree(['/login']);
      }
      // pending or approved — allow through
      return true;
    }),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
