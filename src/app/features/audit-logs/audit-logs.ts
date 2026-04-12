import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuditLogService } from '../../core/services/audit-log.service';
import { AuditLog } from '../../core/models/audit-log.model';
import { DEFAULT_PAGE_SIZE } from '../../core/models/common.model';
import { Paginator } from '../../shared/ui/paginator/paginator';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, Paginator],
  template: `
    <div class="mb-5">
      <h2 class="font-headline-lg text-[24px] font-semibold text-on-surface">Audit logs</h2>
      <p class="text-on-surface-variant font-body-md text-[13px] mt-1">
        Security-relevant actions, newest first.
      </p>
    </div>

    @if (loading()) {
      <div class="bg-white border border-border-subtle rounded-2xl overflow-hidden">
        @for (i of [1, 2, 3, 4, 5, 6]; track i) {
          <div class="flex items-center gap-4 px-5 py-4" [class.border-t]="i > 1" [class.border-border-subtle]="i > 1">
            <div class="flex-1 space-y-2">
              <div class="h-3 w-1/4 rounded skeleton"></div>
              <div class="h-2.5 w-1/3 rounded skeleton"></div>
            </div>
          </div>
        }
      </div>
    } @else if (error()) {
      <p class="font-body-md text-error">Couldn't load audit logs. Is the backend running?</p>
    } @else {
      <div class="bg-white border border-border-subtle rounded-2xl overflow-hidden">
        <div class="grid grid-cols-[1.2fr_1.4fr_1.6fr_1.6fr] gap-4 px-5 py-3 text-[11px] font-label-md text-text-muted uppercase tracking-wide">
          <span>When</span><span>Actor</span><span>Action</span><span>Target</span>
        </div>
        @for (log of logs(); track log.id; let i = $index) {
          <div
            class="grid grid-cols-[1.2fr_1.4fr_1.6fr_1.6fr] gap-4 px-5 py-3.5 border-t border-border-subtle items-center hover:bg-surface-container-low transition-colors row-in"
            [style.animation-delay.ms]="i * 20"
          >
            <span class="text-[12px] text-on-surface-variant whitespace-nowrap">
              {{ log.timestamp ? (log.timestamp | date: 'MMM d, HH:mm') : '—' }}
            </span>
            <span class="text-[13px] font-medium text-on-surface truncate">{{ log.username || 'system' }}</span>
            <span class="text-[12px] text-on-surface-variant truncate">
              <span class="bg-surface-container-low px-2 py-0.5 rounded-md font-mono text-[11px]">{{ log.action || '—' }}</span>
            </span>
            <span class="text-[12px] text-on-surface-variant truncate">
              @if (log.targetType) {
                {{ log.targetType }}<span class="text-text-muted">{{ log.targetName ? ' · ' + log.targetName : '' }}</span>
              } @else {
                —
              }
            </span>
          </div>
        } @empty {
          <div class="px-5 py-12 text-center border-t border-border-subtle">
            <span class="material-symbols-outlined text-[34px] text-outline-variant">history_toggle_off</span>
            <p class="text-[13px] text-on-surface-variant mt-2">No audit entries yet.</p>
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
export class AuditLogs implements OnInit {
  private service = inject(AuditLogService);

  logs = signal<AuditLog[]>([]);
  loading = signal(true);
  error = signal(false);

  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.service.list({ page: this.page(), size: DEFAULT_PAGE_SIZE }).subscribe({
      next: (p) => {
        this.logs.set(p.content);
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
