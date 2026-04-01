import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Employee } from '../models/employee.model';
import { Allocation, Workload } from '../models/allocation.model';
import { Project } from '../models/project.model';
import { EmployeeSkill } from '../models/employee-skill.model';
import { Certification } from '../models/certification.model';

// Me — /api/me. Personal dashboard for the authenticated employee (own data).
@Injectable({ providedIn: 'root' })
export class MeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/me`;

  /** GET /api/me */
  profile(): Observable<Employee> {
    return this.http.get<Employee>(this.apiUrl);
  }

  /** GET /api/me/workload */
  workload(): Observable<Workload> {
    return this.http.get<Workload>(`${this.apiUrl}/workload`);
  }

  /** GET /api/me/allocations */
  allocations(): Observable<Allocation[]> {
    return this.http.get<Allocation[]>(`${this.apiUrl}/allocations`);
  }

  /** GET /api/me/projects */
  projects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/projects`);
  }

  /** GET /api/me/skills */
  skills(): Observable<EmployeeSkill[]> {
    return this.http.get<EmployeeSkill[]>(`${this.apiUrl}/skills`);
  }

  /** GET /api/me/certifications */
  certifications(): Observable<Certification[]> {
    return this.http.get<Certification[]>(`${this.apiUrl}/certifications`);
  }

  /** GET /api/me/teammates */
  teammates(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/teammates`);
  }
}
