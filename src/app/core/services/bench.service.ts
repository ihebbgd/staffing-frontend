import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Employee } from '../models/employee.model';

// Bench — /api/bench (active employees with no active allocations).
@Injectable({ providedIn: 'root' })
export class BenchService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bench`;

  /** GET /api/bench */
  getBench(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl);
  }
}
