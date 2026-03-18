import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthRequest } from '../models/auth.model';
import { Role } from '../enums/role.enum';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode';

interface AuthLoginResponse {
  username: string;
  role: string;
}

interface TokenPayload {
  sub: string;
  role: string;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;

  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private readonly initSubject = new BehaviorSubject<boolean>(false);
  readonly authReady$ = this.initSubject.asObservable();

  private currentUsername = '';
  private currentRole: Role | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {
    this.restoreSession();
  }

  private restoreSession(): void {
    const token = this.readCookie('accessToken');
    if (token) {
      try {
        const payload = jwtDecode<TokenPayload>(token);
        if (payload.exp * 1000 > Date.now()) {
          this.currentUsername = payload.sub;
          this.currentRole = (payload.role || '').replace('ROLE_', '') as Role;
          this.isAuthenticatedSubject.next(true);
        }
      } catch { /* malformed token */ }
    }
    this.initSubject.next(true);
  }

  private readCookie(name: string): string | null {
    const prefix = `${name}=`;
    for (let cookie of document.cookie.split(';')) {
      cookie = cookie.trim();
      if (cookie.startsWith(prefix)) return cookie.substring(prefix.length);
    }
    return null;
  }

  login(request: AuthRequest): Observable<AuthLoginResponse> {
    return this.http.post<AuthLoginResponse>(
      `${this.API_URL}/login`, request, { withCredentials: true }
    ).pipe(
      tap(response => {
        this.currentUsername = response.username;
        this.currentRole = (response.role || '').replace('ROLE_', '') as Role;
        this.isAuthenticatedSubject.next(true);
        this.initSubject.next(true);
      })
    );
  }

  logout(): void {
    this.http.post(`${this.API_URL}/logout`, {}, { withCredentials: true })
      .subscribe({ complete: () => this.clearSession(), error: () => this.clearSession() });
  }

  private clearSession(): void {
    this.currentUsername = '';
    this.currentRole = null;
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean { return !!this.currentUsername; }
  getUserRole(): Role | null { return this.currentRole; }
  getUsername(): string { return this.currentUsername; }
  hasAnyRole(roles: Role[]): boolean { return this.currentRole ? roles.includes(this.currentRole) : false; }

  getDashboardRoute(): string {
    switch (this.currentRole) {
      case Role.ADMIN:       return '/dashboard';
      case Role.DOCTOR:      return '/doctor-dashboard';
      case Role.FRONTDESK:   return '/frontdesk-dashboard';
      case Role.NURSE:       return '/nurse-dashboard';
      case Role.BED_MANAGER: return '/bed-manager-dashboard';
      default:               return '/patients';
    }
  }
}
