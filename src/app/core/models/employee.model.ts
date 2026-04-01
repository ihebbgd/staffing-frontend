import { Role } from './common.model';

// EmployeeResponse
export interface Employee {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  weeklyCapacityHours: number;
  yearsOfExperience: number;
  active: boolean;
  createdAt?: string;
}

// POST /api/employees — EmployeeCreateRequest.
// firstName/lastName/email are required (email must be an email); the rest are
// optional. username/password/role provision the linked login account.
export interface EmployeeCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  department?: string;
  weeklyCapacityHours?: number;
  yearsOfExperience?: number;
  active?: boolean;
  username?: string;
  password?: string;
  role?: Role;
}

// PUT /api/employees/{id} — EmployeeUpdateRequest (HR fields only).
export interface EmployeeUpdateRequest {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  department?: string;
  weeklyCapacityHours?: number;
  yearsOfExperience?: number;
  active?: boolean;
}

// Returned once when creating an employee — surfaces the temporary password.
export interface EmployeeCreationResponse {
  employee: Employee;
  username: string;
  temporaryPassword: string;
}

// Re-export Page so existing imports from this module keep working.
export type { Page } from './common.model';
