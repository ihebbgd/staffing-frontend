import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UtilizationReportRow } from '../models/report.model';
import { CertificationReport } from '../models/certification.model';

// Reports — /api/reports (JSON aggregation reports).
@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reports`;

  /** GET /api/reports/utilization */
  utilization(): Observable<UtilizationReportRow[]> {
    return this.http.get<UtilizationReportRow[]>(`${this.apiUrl}/utilization`);
  }

  /** GET /api/reports/certifications */
  certifications(): Observable<CertificationReport> {
    return this.http.get<CertificationReport>(`${this.apiUrl}/certifications`);
  }
}
