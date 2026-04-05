import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RefreshRequest } from '../models/auth.model';
import { SessionService } from './session.service';

/**
 * Talks to the three /api/auth endpoints defined in openapi.json and keeps the
 * SessionService in sync. No other service writes tokens.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private session = inject(SessionService);
  private apiUrl = `${environment.apiUrl}/auth`;

  /** POST /api/auth/login */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(tap((res) => this.session.setSession(res)));
  }

  /** POST /api/auth/refresh — exchange the refresh token for a new pair. */
  refresh(): Observable<AuthResponse> {
    const body: RefreshRequest = { refreshToken: this.session.refreshToken ?? '' };
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, body)
      .pipe(tap((res) => this.session.setSession(res)));
  }

  /**
   * POST /api/auth/logout — best-effort server revoke, then always clear the
   * local session regardless of the server's response.
   */
  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/logout`, {})
      .pipe(tap({ next: () => this.session.clear(), error: () => this.session.clear() }));
  }
}
