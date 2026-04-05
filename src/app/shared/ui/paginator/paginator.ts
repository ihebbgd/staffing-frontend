import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * Presentational pager for the Spring `Page<T>` envelope. Page index is 0-based
 * to match the API; the display is 1-based.
 */
@Component({
  selector: 'app-paginator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPages() > 0) {
      <div class="flex items-center justify-between mt-4">
        <span class="text-[11px] text-text-muted">
          Page {{ page() + 1 }} of {{ totalPages() }} · {{ totalElements() }} total
        </span>
        <div class="flex gap-2">
          <button
            (click)="prev.emit()"
            [disabled]="isFirst()"
            aria-label="Previous page"
            class="p-1.5 bg-white border border-border-subtle rounded-lg hover:bg-surface-container-low disabled:opacity-40 transition-colors"
          >
            <span class="material-symbols-outlined text-[18px] text-on-surface-variant block">chevron_left</span>
          </button>
          <button
            (click)="next.emit()"
            [disabled]="isLast()"
            aria-label="Next page"
            class="p-1.5 bg-white border border-border-subtle rounded-lg hover:bg-surface-container-low disabled:opacity-40 transition-colors"
          >
            <span class="material-symbols-outlined text-[18px] text-on-surface-variant block">chevron_right</span>
          </button>
        </div>
      </div>
    }
  `,
})
export class Paginator {
  page = input.required<number>();
  totalPages = input.required<number>();
  totalElements = input.required<number>();

  prev = output<void>();
  next = output<void>();

  protected isFirst = computed(() => this.page() <= 0);
  protected isLast = computed(() => this.page() >= this.totalPages() - 1);
}
