import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Employee, Page } from '../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/employees`;

  getEmployees(page: number = 0, size: number = 10): Observable<Page<Employee>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<Employee>>(this.apiUrl, { params });
  }
}
