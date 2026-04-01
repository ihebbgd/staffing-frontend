import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';
import { Page, PageQuery, toPageParams } from '../models/common.model';

/**
 * Notifications — /api/notifications. Exposes the authenticated user's own notifications
 * (the API resolves the recipient from the JWT, so no id is passed from the client) plus a
 * shared unread-count signal that the shell badge and the notifications page both read.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notifications`;

  /** Unread count for the current user, kept in sync via refreshUnread(). */
  readonly unread = signal(0);

  /** GET /api/notifications/me — own notifications, newest first (paged). */
  mine(query: PageQuery = {}): Observable<Page<Notification>> {
    return this.http.get<Page<Notification>>(`${this.apiUrl}/me`, { params: toPageParams(query) });
  }

  /** GET /api/notifications/me/unread-count — refreshes the shared unread signal. */
  refreshUnread(): void {
    this.http.get<{ count: number }>(`${this.apiUrl}/me/unread-count`).subscribe({
      next: (res) => this.unread.set(res.count ?? 0),
      error: () => {
        /* non-critical; leave the last known value */
      },
    });
  }

  /** PUT /api/notifications/{id}/read — marks one as read and refreshes the unread count. */
  markAsRead(id: string): Observable<Notification> {
    return this.http
      .put<Notification>(`${this.apiUrl}/${id}/read`, {})
      .pipe(tap(() => this.refreshUnread()));
  }
}
