import { HttpParams } from '@angular/common/http';

/**
 * Shared primitives mirrored directly from openapi.json.
 * These are the single source of truth for enums and the Spring Data
 * pagination envelope used across every list endpoint.
 */

// ---- Enums (exact values from the OpenAPI schema) ----
export type Role = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
export const ROLES: Role[] = ['EMPLOYEE', 'MANAGER', 'ADMIN'];

export type ProjectStatus = 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export const PROJECT_STATUSES: ProjectStatus[] = [
  'PLANNED',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
];

export type AllocationStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export const ALLOCATION_STATUSES: AllocationStatus[] = ['ACTIVE', 'COMPLETED', 'CANCELLED'];

export type CertificationStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
export const CERTIFICATION_STATUSES: CertificationStatus[] = [
  'ACTIVE',
  'EXPIRING_SOON',
  'EXPIRED',
];

export type UtilizationStatus =
  | 'AVAILABLE'
  | 'PARTIALLY_ALLOCATED'
  | 'FULLY_ALLOCATED'
  | 'OVERALLOCATED';

/**
 * Spring Data's `Page<T>` response envelope (see Page*Response schemas).
 * Only the fields the UI consumes are typed; the rest are optional.
 */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // 0-based current page index
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  empty?: boolean;
}

/**
 * Client-side representation of the `Pageable` query parameter.
 * `page` >= 0 and `size` >= 1 per the schema constraints.
 * `sort` is an array of "property,direction" strings (Spring convention).
 */
export interface PageQuery {
  page?: number;
  size?: number;
  sort?: string[];
  // Optional free-text filter. Endpoints that support it filter server-side; others ignore it.
  search?: string;
}

export const DEFAULT_PAGE_SIZE = 10;

/**
 * Serialize a PageQuery into the query params Spring binds to `Pageable`.
 * Kept in one place so every list service paginates identically.
 */
export function toPageParams(query: PageQuery = {}): HttpParams {
  let params = new HttpParams();
  if (query.page != null) {
    params = params.set('page', Math.max(0, query.page));
  }
  if (query.size != null) {
    params = params.set('size', Math.max(1, query.size));
  }
  for (const sort of query.sort ?? []) {
    params = params.append('sort', sort);
  }
  if (query.search != null && query.search.trim() !== '') {
    params = params.set('search', query.search.trim());
  }
  return params;
}
