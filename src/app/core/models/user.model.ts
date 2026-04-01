import { Role } from './common.model';

// UserResponse
export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  enabled: boolean;
  employeeId?: string;
  createdAt?: string;
}

// POST /api/users — CreateUserRequest (mirrors the backend Bean Validation rules)
export interface CreateUserRequest {
  username: string;
  email: string;
  role: Role;
  // Admin-chosen initial password. Optional on the wire; when omitted the backend generates one.
  password?: string;
}

// POST /api/users — CreateUserResponse (the new account + its one-time temporary password)
export interface CreateUserResponse {
  user: User;
  temporaryPassword: string;
}

// PUT /api/users/{id}/employee — LinkEmployeeRequest
export interface LinkEmployeeRequest {
  employeeId: string;
}

// PATCH /api/users/{id}/status — StatusUpdateRequest
export interface StatusUpdateRequest {
  enabled: boolean;
}

// PATCH /api/users/{id}/role — RoleUpdateRequest
export interface RoleUpdateRequest {
  role: Role;
}

// POST /api/users/{id}/reset-password — PasswordResetResponse
// temporaryPassword is only present when the server generated the password (admin left it blank).
export interface PasswordResetResponse {
  temporaryPassword?: string | null;
}
