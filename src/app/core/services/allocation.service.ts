import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from './crud.service';
import { Allocation, AllocationRequest, Workload } from '../models/allocation.model';

// Allocations — /api/allocations (full CRUD, paged list) + workload views.
@Injectable({ providedIn: 'root' })
export class AllocationService extends CrudService<Allocation, AllocationRequest> {
  constructor() {
    super('allocations');
  }

  /** GET /api/allocations/employee/{employeeId} */
  listByEmployee(employeeId: string): Observable<Allocation[]> {
    return this.http.get<Allocation[]>(`${this.baseUrl}/employee/${employeeId}`);
  }

  /** GET /api/allocations/workload/{employeeId} */
  getWorkload(employeeId: string): Observable<Workload> {
    return this.http.get<Workload>(`${this.baseUrl}/workload/${employeeId}`);
  }

  /** GET /api/allocations/conflicts — everyone over 100% capacity */
  getConflicts(): Observable<Workload[]> {
    return this.http.get<Workload[]>(`${this.baseUrl}/conflicts`);
  }
}
