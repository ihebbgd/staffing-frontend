import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Generic confirm modal used before destructive actions (delete, disable, …).
 * The host controls visibility by rendering it with `@if`.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-overlay" (click)="cancel.emit()">
      <div role="dialog" aria-modal="true" class="modal-card bg-white rounded-2xl p-6 w-full max-w-[380px]" (click)="$event.stopPropagation()">
        <div class="flex items-start gap-3">
          <div class="p-2 rounded-lg shrink-0" [class]="danger() ? 'bg-error-container text-error' : 'bg-primary/10 text-primary'">
            <span class="material-symbols-outlined text-[22px] block">{{ danger() ? 'warning' : 'help' }}</span>
          </div>
          <div>
            <h3 class="font-headline-md text-[17px] font-semibold text-on-surface">{{ title() }}</h3>
            <p class="text-[13px] text-on-surface-variant mt-1 leading-relaxed">{{ message() }}</p>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button
            (click)="cancel.emit()"
            class="px-4 py-2 rounded-xl text-[13px] font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            {{ cancelLabel() }}
          </button>
          <button
            (click)="confirm.emit()"
            [disabled]="busy()"
            class="px-4 py-2 rounded-xl text-[13px] font-medium text-white transition-all disabled:opacity-60"
            [class]="danger() ? 'bg-error hover:opacity-90' : 'bg-primary hover:opacity-90'"
          >
            {{ busy() ? 'Working…' : confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialog {
  title = input('Are you sure?');
  message = input('This action cannot be undone.');
  confirmLabel = input('Confirm');
  cancelLabel = input('Cancel');
  danger = input(true);
  busy = input(false);

  confirm = output<void>();
  cancel = output<void>();
}
