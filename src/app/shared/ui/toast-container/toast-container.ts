import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

/** Renders the global toast queue. Mounted once in the app shell. */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-[320px] max-w-[calc(100vw-2rem)]">
      @for (t of toasts.toasts(); track t.id) {
        <div
          class="rise flex items-start gap-2.5 rounded-xl px-3.5 py-3 shadow-lg border text-[13px]"
          [class]="styles(t.kind)"
        >
          <span class="material-symbols-outlined text-[18px] shrink-0 mt-0.5">{{ icon(t.kind) }}</span>
          <span class="flex-1 leading-snug">{{ t.text }}</span>
          <button
            (click)="toasts.dismiss(t.id)"
            aria-label="Dismiss"
            class="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <span class="material-symbols-outlined text-[16px] block">close</span>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  protected toasts = inject(ToastService);

  protected icon(kind: string): string {
    return kind === 'success' ? 'check_circle' : kind === 'error' ? 'error' : 'info';
  }

  protected styles(kind: string): string {
    switch (kind) {
      case 'success':
        return 'bg-white border-green-200 text-green-800';
      case 'error':
        return 'bg-white border-red-200 text-red-800';
      default:
        return 'bg-white border-border-subtle text-on-surface';
    }
  }
}
