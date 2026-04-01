import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLog } from '../models/audit-log.model';
import { Page, PageQuery, toPageParams } from '../models/common.model';

// Audit Logs — /api/audit-logs (admin only, newest first, paged).
@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/audit-logs`;

  /** GET /api/audit-logs (paged) */
  list(query: PageQuery = {}): Observable<Page<AuditLog>> {
    return this.http.get<Page<AuditLog>>(this.apiUrl, { params: toPageParams(query) });
  }
}
