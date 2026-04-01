import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from './crud.service';
import { EmployeeSkill, EmployeeSkillRequest } from '../models/employee-skill.model';

// Employee Skills — /api/employee-skills (full CRUD, paged list) + by-employee.
@Injectable({ providedIn: 'root' })
export class EmployeeSkillService extends CrudService<EmployeeSkill, EmployeeSkillRequest> {
  constructor() {
    super('employee-skills');
  }

  /** GET /api/employee-skills/employee/{employeeId} */
  listByEmployee(employeeId: string): Observable<EmployeeSkill[]> {
    return this.http.get<EmployeeSkill[]>(`${this.baseUrl}/employee/${employeeId}`);
  }
}
