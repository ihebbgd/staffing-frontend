import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/notification.model';
import { DEFAULT_PAGE_SIZE } from '../../core/models/common.model';
import { Paginator } from '../../shared/ui/paginator/paginator';

@Component({
  selector: 'app-notifications',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, Paginator],
  template: `
    <div class="mb-5">
      <h2 class="font-headline-lg text-[24px] font-semibold text-on-surface">Notifications</h2>
      <p class="text-on-surface-variant font-body-md text-[13px] mt-1">
        Your alerts, newest first.
      </p>
    </div>

    @if (loading()) {
      <div class="bg-white border border-border-subtle rounded-2xl overflow-hidden">
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="flex items-center gap-4 px-5 py-4" [class.border-t]="i > 1" [class.border-border-subtle]="i > 1">
            <div class="flex-1 space-y-2">
              <div class="h-3 w-1/3 rounded skeleton"></div>
              <div class="h-2.5 w-2/3 rounded skeleton"></div>
            </div>
          </div>
        }
      </div>
    } @else if (error()) {
      <p class="font-body-md text-error">Couldn't load notifications. Is the backend running?</p>
    } @else {
      <div class="bg-white border border-border-subtle rounded-2xl overflow-hidden">
        @for (n of notifications(); track n.id; let i = $index) {
          <div
            class="flex items-start gap-3 px-5 py-4 border-t border-border-subtle first:border-t-0 hover:bg-surface-container-low transition-colors row-in"
            [class.opacity-70]="n.read"
            [style.animation-delay.ms]="i * 20"
          >
            <span class="mt-1 w-2 h-2 rounded-full shrink-0" [class]="n.read ? 'bg-transparent' : 'bg-primary'"></span>
            <div class="min-w-0 flex-1">
              <div class="text-[13px] font-medium text-on-surface">{{ n.title }}</div>
              @if (n.message) {
                <div class="text-[12px] text-on-surface-variant mt-0.5">{{ n.message }}</div>
              }
              <div class="text-[11px] text-text-muted mt-1">
                {{ n.createdAt ? (n.createdAt | date: 'MMM d, HH:mm') : '' }}
              </div>
            </div>
            @if (!n.read) {
              <button (click)="markRead(n)" [disabled]="busyId() === n.id"
                      class="text-[11px] text-primary hover:underline shrink-0 disabled:opacity-60">
                Mark read
              </button>
            }
          </div>
        } @empty {
          <div class="px-5 py-12 text-center">
            <span class="material-symbols-outlined text-[34px] text-outline-variant">notifications_off</span>
            <p class="text-[13px] text-on-surface-variant mt-2">You have no notifications.</p>
          </div>
        }
      </div>

      <app-paginator
        [page]="page()"
        [totalPages]="totalPages()"
        [totalElements]="totalElements()"
        (prev)="prev()"
        (next)="next()"
      />
    }
  `,
})
export class Notifications implements OnInit {
  private service = inject(NotificationService);

  notifications = signal<Notification[]>([]);
  loading = signal(true);
  error = signal(false);
  busyId = signal<string | null>(null);

  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);

  ngOnInit() {
    this.service.refreshUnread();
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.service.mine({ page: this.page(), size: DEFAULT_PAGE_SIZE }).subscribe({
      next: (p) => {
        this.notifications.set(p.content);
        this.totalPages.set(p.totalPages);
        this.totalElements.set(p.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  markRead(n: Notification) {
    if (n.read) return;
    this.busyId.set(n.id);
    this.service.markAsRead(n.id).subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.notifications.update((list) => list.map((x) => (x.id === n.id ? updated : x)));
      },
      error: () => this.busyId.set(null),
    });
  }

  prev() {
    if (this.page() > 0) {
      this.page.update((p) => p - 1);
      this.load();
    }
  }

  next() {
    if (this.page() < this.totalPages() - 1) {
      this.page.update((p) => p + 1);
      this.load();
    }
  }
}
