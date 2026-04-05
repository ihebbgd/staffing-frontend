import { Role } from './common.model';

// POST /api/auth/login
export interface LoginRequest {
  username: string;
  password: string;
}

// POST /api/auth/refresh
export interface RefreshRequest {
  refreshToken: string;
}

// Response body of both /api/auth/login and /api/auth/refresh
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  role: Role;
}
