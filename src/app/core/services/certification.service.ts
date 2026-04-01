import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from './crud.service';
import { Certification, CertificationRequest } from '../models/certification.model';

// Certifications — /api/certifications (full CRUD, paged list) + by-employee.
@Injectable({ providedIn: 'root' })
export class CertificationService extends CrudService<Certification, CertificationRequest> {
  constructor() {
    super('certifications');
  }

  /** GET /api/certifications/employee/{employeeId} */
  listByEmployee(employeeId: string): Observable<Certification[]> {
    return this.http.get<Certification[]>(`${this.baseUrl}/employee/${employeeId}`);
  }
}
