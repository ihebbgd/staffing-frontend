import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AllocationService } from '../../core/services/allocation.service';
import { EmployeeService } from '../../core/services/employee.service';
import { ProjectService } from '../../core/services/project.service';
import { ToastService } from '../../core/services/toast.service';
import { Allocation, AllocationRequest } from '../../core/models/allocation.model';
import { Employee } from '../../core/models/employee.model';
import { Project } from '../../core/models/project.model';
import { ALLOCATION_STATUSES, AllocationStatus, DEFAULT_PAGE_SIZE } from '../../core/models/common.model';
import { getApiErrorMessage } from '../../core/http/api-error';
import { Paginator } from '../../shared/ui/paginator/paginator';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-allocations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Paginator, ConfirmDialog],
  templateUrl: './allocations.html',
})
export class Allocations implements OnInit {
  private service = inject(AllocationService);
  private employeeService = inject(EmployeeService);
  private projectService = inject(ProjectService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly statuses = ALLOCATION_STATUSES;

  allocations = signal<Allocation[]>([]);
  employees = signal<Employee[]>([]);
  projects = signal<Project[]>([]);
  loading = signal(true);
  error = signal(false);

  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  searchTerm = signal('');

  editing = signal<Allocation | 'new' | null>(null);
  saving = signal(false);
  deleteTarget = signal<Allocation | null>(null);
  deleting = signal(false);

  // AllocationRequest: employeeId + projectId required.
  form = this.fb.nonNullable.group({
    employeeId: ['', Validators.required],
    projectId: ['', Validators.required],
    allocatedHoursPerWeek: [null as number | null, [Validators.min(0)]],
    startDate: [''],
    endDate: [''],
    status: ['' as AllocationStatus | ''],
    roleOnProject: [''],
  });

  private employeeName = computed(() => {
    const map = new Map<string, string>();
    for (const e of this.employees()) map.set(e.id, `${e.firstName} ${e.lastName}`);
    return map;
  });

  private projectName = computed(() => {
    const map = new Map<string, string>();
    for (const p of this.projects()) map.set(p.id, p.name);
    return map;
  });

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.allocations();
    if (!term) return list;
    return list.filter(
      (a) =>
        this.employeeLabel(a.employeeId).toLowerCase().includes(term) ||
        this.projectLabel(a.projectId).toLowerCase().includes(term) ||
        (a.roleOnProject ?? '').toLowerCase().includes(term),
    );
  });

  ngOnInit() {
    this.employeeService.list({ page: 0, size: 500, sort: ['lastName,asc'] }).subscribe({
      next: (p) => this.employees.set(p.content),
      error: () => this.employees.set([]),
    });
    this.projectService.list({ page: 0, size: 500, sort: ['name,asc'] }).subscribe({
      next: (p) => this.projects.set(p.content),
      error: () => this.projects.set([]),
    });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.service.list({ page: this.page(), size: DEFAULT_PAGE_SIZE }).subscribe({
      next: (p) => {
        this.allocations.set(p.content);
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

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
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

  employeeLabel(id: string): string {
    return this.employeeName().get(id) ?? id;
  }

  projectLabel(id: string): string {
    return this.projectName().get(id) ?? id;
  }

  openCreate() {
    this.form.reset({
      employeeId: '',
      projectId: '',
      allocatedHoursPerWeek: null,
      startDate: '',
      endDate: '',
      status: '',
      roleOnProject: '',
    });
    this.editing.set('new');
  }

  openEdit(a: Allocation) {
    this.form.reset({
      employeeId: a.employeeId,
      projectId: a.projectId,
      allocatedHoursPerWeek: a.allocatedHoursPerWeek ?? null,
      startDate: a.startDate ?? '',
      endDate: a.endDate ?? '',
      status: a.status ?? '',
      roleOnProject: a.roleOnProject ?? '',
    });
    this.editing.set(a);
  }

  closeForm() {
    this.editing.set(null);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body: AllocationRequest = {
      employeeId: raw.employeeId,
      projectId: raw.projectId,
      allocatedHoursPerWeek: raw.allocatedHoursPerWeek ?? undefined,
      startDate: raw.startDate || undefined,
      endDate: raw.endDate || undefined,
      status: raw.status || undefined,
      roleOnProject: raw.roleOnProject.trim() || undefined,
    };

    this.saving.set(true);
    const target = this.editing();
    const request =
      target && target !== 'new'
        ? this.service.update(target.id, body)
        : this.service.create(body);

    request.subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.overAllocationWarning) {
          this.toast.error(
            `Saved, but ${this.employeeLabel(res.employeeId)} is now over-allocated (${res.employeeUtilizationPercent}%).`,
          );
        } else {
          this.toast.success(target === 'new' ? 'Allocation created.' : 'Allocation updated.');
        }
        this.closeForm();
        this.load();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toast.error(getApiErrorMessage(err));
      },
    });
  }

  confirmDelete(a: Allocation) {
    this.deleteTarget.set(a);
  }

  cancelDelete() {
    this.deleteTarget.set(null);
  }

  doDelete() {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);
    this.service.delete(target.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.toast.success('Allocation deleted.');
        if (this.allocations().length === 1 && this.page() > 0) {
          this.page.update((p) => p - 1);
        }
        this.load();
      },
      error: (err: unknown) => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.toast.error(getApiErrorMessage(err));
      },
    });
  }

  statusClass(status?: AllocationStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-surface-container-high text-on-surface-variant';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-surface-container-low text-on-surface-variant';
    }
  }

  protected isEditing(): boolean {
    return this.editing() !== null && this.editing() !== 'new';
  }
}
