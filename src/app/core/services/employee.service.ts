import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page, PageQuery, toPageParams } from '../models/common.model';
import {
  Employee,
  EmployeeCreateRequest,
  EmployeeCreationResponse,
  EmployeeUpdateRequest,
} from '../models/employee.model';

/**
 * Employees — /api/employees.
 * Written explicitly (not via CrudService) because create returns an
 * EmployeeCreationResponse (with the one-time temp password) and update takes
 * a different request DTO than create.
 */
@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/employees`;

  /** GET /api/employees (paged). Kept page/size args for the existing caller. */
  getEmployees(page = 0, size = 10, sort?: string[]): Observable<Page<Employee>> {
    return this.list({ page, size, sort });
  }

  list(query: PageQuery = {}): Observable<Page<Employee>> {
    return this.http.get<Page<Employee>>(this.apiUrl, { params: toPageParams(query) });
  }

  getById(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  /** POST /api/employees — provisions the login; returns the temp password once. */
  create(body: EmployeeCreateRequest): Observable<EmployeeCreationResponse> {
    return this.http.post<EmployeeCreationResponse>(this.apiUrl, body);
  }

  /** PUT /api/employees/{id} — HR fields only. */
  update(id: string, body: EmployeeUpdateRequest): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
