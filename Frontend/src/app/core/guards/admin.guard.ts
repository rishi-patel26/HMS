import { CanActivateFn } from '@angular/router';
import { roleGuard } from './role.guard';
import { Role } from '../enums/role.enum';

export const adminGuard: CanActivateFn = roleGuard([Role.ADMIN]);
