import { Injectable, computed, signal } from '@angular/core';
import { AuthResponse } from '../models/auth.model';
import { Role } from '../models/common.model';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USERNAME_KEY = 'username';
const ROLE_KEY = 'role';
const HAS_EMPLOYEE_PROFILE_KEY = 'hasEmployeeProfile';

export interface SessionUser {
  username: string;
  role: Role;
}

/**
 * Single owner of the authenticated session. Persists the JWT pair + identity
 * in localStorage (so a refresh survives reloads) and exposes reactive signals
 * the rest of the app reads instead of touching localStorage directly.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly _accessToken = signal<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY));
  private readonly _user = signal<SessionUser | null>(this.readUser());
  // Whether the logged-in user has a linked Employee record. Independent of role — an admin
  // may also be an employee. `null` = not yet determined (probe /api/me to resolve).
  private readonly _hasEmployeeProfile = signal<boolean | null>(this.readProfileFlag());

  readonly user = this._user.asReadonly();
  readonly role = computed(() => this._user()?.role ?? null);
  readonly isAuthenticated = computed(() => this._accessToken() !== null);
  readonly hasEmployeeProfile = this._hasEmployeeProfile.asReadonly();

  get accessToken(): string | null {
    return this._accessToken();
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /** Persist a fresh token pair + identity after login or refresh. */
  setSession(auth: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
    localStorage.setItem(USERNAME_KEY, auth.username);
    localStorage.setItem(ROLE_KEY, auth.role);
    this._accessToken.set(auth.accessToken);
    this._user.set({ username: auth.username, role: auth.role });
    // A fresh login says nothing about employee linkage yet — reset so it gets re-probed.
    this.setEmployeeProfilePresence(null);
  }

  /** Record whether the current user has a linked Employee record (probed from /api/me). */
  setEmployeeProfilePresence(present: boolean | null): void {
    if (present === null) {
      localStorage.removeItem(HAS_EMPLOYEE_PROFILE_KEY);
    } else {
      localStorage.setItem(HAS_EMPLOYEE_PROFILE_KEY, String(present));
    }
    this._hasEmployeeProfile.set(present);
  }

  /** Wipe the session (logout, or when a refresh ultimately fails). */
  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(HAS_EMPLOYEE_PROFILE_KEY);
    this._accessToken.set(null);
    this._user.set(null);
    this._hasEmployeeProfile.set(null);
  }

  hasRole(...roles: Role[]): boolean {
    const current = this.role();
    return current !== null && roles.includes(current);
  }

  private readUser(): SessionUser | null {
    const username = localStorage.getItem(USERNAME_KEY);
    const role = localStorage.getItem(ROLE_KEY) as Role | null;
    return username && role ? { username, role } : null;
  }

  private readProfileFlag(): boolean | null {
    const raw = localStorage.getItem(HAS_EMPLOYEE_PROFILE_KEY);
    return raw === null ? null : raw === 'true';
  }
}
