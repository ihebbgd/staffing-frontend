import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

const AUTO_DISMISS_MS = 5000;

/**
 * Tiny signal-based toast queue. Rendered once in the app shell and used for
 * global feedback (save confirmations, unexpected server errors, etc.).
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  readonly toasts = signal<Toast[]>([]);

  success(text: string): void {
    this.push('success', text);
  }

  error(text: string): void {
    this.push('error', text);
  }

  info(text: string): void {
    this.push('info', text);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: ToastKind, text: string): void {
    // De-duplicate: if an identical toast is already on screen, don't stack a copy. This prevents
    // the same error being shown twice when both the global error interceptor and a feature's own
    // error handler report it (e.g. a 403 or 5xx).
    if (this.toasts().some((t) => t.kind === kind && t.text === text)) {
      return;
    }
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, kind, text }]);
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
  }
}
