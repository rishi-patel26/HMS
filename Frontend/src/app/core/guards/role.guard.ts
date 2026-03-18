import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../enums/role.enum';
import { filter, take, switchMap, of } from 'rxjs';

export function roleGuard(allowedRoles: Role[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Wait for initialization before checking role
    return authService.authReady$.pipe(
      filter(ready => ready),
      take(1),
      switchMap(() => {
        const userRole = authService.getUserRole();
        if (userRole && allowedRoles.includes(userRole)) {
          return of(true);
        }
        const redirectPath = getDashboardPath(userRole);
        router.navigate([redirectPath]);
        return of(false);
      })
    );
  };
}

function getDashboardPath(role: Role | null): string {
  if (!role) return '/login';
  switch (role) {
    case Role.ADMIN:       return '/dashboard';
    case Role.FRONTDESK:   return '/frontdesk-dashboard';
    case Role.DOCTOR:      return '/doctor-dashboard';
    case Role.NURSE:       return '/nurse-dashboard';
    case Role.BED_MANAGER: return '/patients';
    default:               return '/login';
  }
}
