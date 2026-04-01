import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page, PageQuery, Role, toPageParams } from '../models/common.model';
import {
  CreateUserRequest,
  CreateUserResponse,
  LinkEmployeeRequest,
  PasswordResetResponse,
  RoleUpdateRequest,
  StatusUpdateRequest,
  User,
} from '../models/user.model';

/**
 * Users — /api/users. Admin management of login accounts: create, list, role/status
 * changes, password reset, employee linking and deletion.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  list(query: PageQuery = {}): Observable<Page<User>> {
    return this.http.get<Page<User>>(this.apiUrl, { params: toPageParams(query) });
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  /** POST /api/users — creates a login account and returns a one-time temporary password. */
  create(request: CreateUserRequest): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(this.apiUrl, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** PATCH /api/users/{id}/role */
  changeRole(id: string, role: Role): Observable<User> {
    const body: RoleUpdateRequest = { role };
    return this.http.patch<User>(`${this.apiUrl}/${id}/role`, body);
  }

  /** PATCH /api/users/{id}/status */
  setStatus(id: string, enabled: boolean): Observable<User> {
    const body: StatusUpdateRequest = { enabled };
    return this.http.patch<User>(`${this.apiUrl}/${id}/status`, body);
  }

  /**
   * POST /api/users/{id}/reset-password — sets the admin's chosen password (hashed server-side).
   * When no password is provided the server generates one and returns it once.
   */
  resetPassword(id: string, password?: string): Observable<PasswordResetResponse> {
    const body = password ? { password } : {};
    return this.http.post<PasswordResetResponse>(`${this.apiUrl}/${id}/reset-password`, body);
  }

  /** PUT /api/users/{id}/employee */
  linkEmployee(id: string, employeeId: string): Observable<User> {
    const body: LinkEmployeeRequest = { employeeId };
    return this.http.put<User>(`${this.apiUrl}/${id}/employee`, body);
  }

  /** DELETE /api/users/{id}/employee */
  unlinkEmployee(id: string): Observable<User> {
    return this.http.delete<User>(`${this.apiUrl}/${id}/employee`);
  }
}
