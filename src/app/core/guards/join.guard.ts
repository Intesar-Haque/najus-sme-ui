import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const joinGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);

  const status = auth.currentMember()?.registrationStatus;

  if (status === 'pending' || status === 'approved') {
    return router.createUrlTree(['/dashboard']);
  }

  // status === 'rejected' or null/undefined (never submitted) — allow
  // through. A rejected applicant needs a way to fix the issue and
  // resubmit; the backend (RegistrationController::store()) never blocked
  // this, only this guard did — permanently locking rejected applicants
  // out with no path forward.
  return true;
};
