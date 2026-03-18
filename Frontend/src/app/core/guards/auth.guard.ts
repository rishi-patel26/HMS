import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, take, switchMap, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait until the initial /me session-restore call has completed,
  // then check whether the user is authenticated.
  return authService.authReady$.pipe(
    filter(ready => ready),   // block until initialization is done
    take(1),
    switchMap(() => {
      if (authService.isLoggedIn()) {
        return of(true);
      }
      router.navigate(['/login']);
      return of(false);
    })
  );
};
