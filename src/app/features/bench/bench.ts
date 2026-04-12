import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { BenchService } from '../../core/services/bench.service';
import { Employee } from '../../core/models/employee.model';

@Component({
  selector: 'app-bench',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-5">
      <h2 class="font-headline-lg text-[24px] font-semibold text-on-surface">Bench</h2>
      <p class="text-on-surface-variant font-body-md text-[13px] mt-1">
        Active employees with no current allocations — ready to be staffed.
      </p>
    </div>

    @if (loading()) {
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        @for (i of [1, 2, 3, 4, 5, 6]; track i) {
          <div class="h-[112px] rounded-2xl skeleton"></div>
        }
      </div>
    } @else if (error()) {
      <p class="font-body-md text-error">Couldn't load the bench. Is the backend running?</p>
    } @else {
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        @for (emp of employees(); track emp.id; let i = $index) {
          <div
            class="bg-white border border-border-subtle rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow row-in"
            [style.animation-delay.ms]="i * 40"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-11 h-11 rounded-full font-label-md text-[13px] font-medium flex items-center justify-center shrink-0"
                [class]="hue(emp)"
              >
                {{ initials(emp) }}
              </div>
              <div class="min-w-0">
                <div class="text-[14px] font-medium text-on-surface truncate">
                  {{ emp.firstName }} {{ emp.lastName }}
                </div>
                <div class="text-[12px] text-text-muted truncate">{{ emp.jobTitle || '—' }}</div>
              </div>
            </div>
            <div class="flex items-center justify-between mt-4">
              <span class="text-[11px] bg-surface-container-low text-on-surface-variant px-2.5 py-1 rounded-full">
                {{ emp.department || 'No department' }}
              </span>
              <span class="text-[11px] text-text-muted">{{ emp.yearsOfExperience }} yrs exp</span>
            </div>
          </div>
        } @empty {
          <div class="col-span-full py-16 text-center">
            <span class="material-symbols-outlined text-[38px] text-green-500">verified</span>
            <p class="text-[14px] text-on-surface mt-2 font-medium">Nobody's on the bench</p>
            <p class="text-[13px] text-on-surface-variant mt-1">Every active employee is allocated.</p>
          </div>
        }
      </div>
    }
  `,
})
export class Bench implements OnInit {
  private service = inject(BenchService);

  employees = signal<Employee[]>([]);
  loading = signal(true);
  error = signal(false);

  ngOnInit() {
    this.service.getBench().subscribe({
      next: (list) => {
        this.employees.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  initials(e: Employee): string {
    return ((e.firstName[0] ?? '') + (e.lastName[0] ?? '')).toUpperCase();
  }

  hue = (e: Employee): string => {
    const hues = ['hue-indigo', 'hue-teal', 'hue-amber', 'hue-rose', 'hue-violet'];
    const seed = (e.firstName.charCodeAt(0) || 0) + (e.lastName.charCodeAt(0) || 0);
    return hues[seed % hues.length];
  };
}
