import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const joinGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);

  const status = auth.currentMember()?.registrationStatus;

  if (status === 'rejected') return router.createUrlTree(['/login']);
  if (status === 'pending' || status === 'approved') {
    return router.createUrlTree(['/dashboard']);
  }

  // status === null or undefined (never submitted) — allow through
  return true;
};
