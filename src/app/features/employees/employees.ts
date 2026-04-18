import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeService } from '../../core/services/employee.service';
import { ToastService } from '../../core/services/toast.service';
import {
  Employee,
  EmployeeCreateRequest,
  EmployeeUpdateRequest,
} from '../../core/models/employee.model';
import { DEFAULT_PAGE_SIZE, ROLES, Role } from '../../core/models/common.model';
import { getApiErrorMessage } from '../../core/http/api-error';
import { Paginator } from '../../shared/ui/paginator/paginator';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-employees',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Paginator, ConfirmDialog],
  templateUrl: './employees.html',
  styleUrl: './employees.css',
})
export class Employees implements OnInit {
  private employeeService = inject(EmployeeService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly roles = ROLES;

  employees = signal<Employee[]>([]);
  loading = signal(true);
  error = signal(false);

  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);

  searchTerm = signal('');
  view = signal<'table' | 'grid'>('table');

  editing = signal<Employee | 'new' | null>(null);
  saving = signal(false);
  deleteTarget = signal<Employee | null>(null);
  deleting = signal(false);
  // Shown once after creating an employee (temp password provisioned server-side).
  newCredentials = signal<{ username: string; temporaryPassword: string } | null>(null);

  // Covers both create and update. firstName/lastName/email required; email
  // must be a valid address. Account fields only apply when creating.
  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    jobTitle: [''],
    department: [''],
    weeklyCapacityHours: [null as number | null, [Validators.min(0)]],
    yearsOfExperience: [null as number | null, [Validators.min(0)]],
    active: [true],
    username: [''],
    password: [''],
    role: ['EMPLOYEE' as Role],
  });

  private searchDebounce?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.loading.set(true);
    this.error.set(false);
    this.employeeService
      .list({
        page: this.currentPage(),
        size: DEFAULT_PAGE_SIZE,
        sort: ['lastName,asc'],
        search: this.searchTerm(),
      })
      .subscribe({
        next: (page) => {
          this.employees.set(page.content);
          this.totalPages.set(page.totalPages);
          this.totalElements.set(page.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  // Server-side search (debounced), so results span all pages — not just the current one.
  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.currentPage.set(0);
      this.loadEmployees();
    }, 300);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update((p) => p + 1);
      this.loadEmployees();
    }
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update((p) => p - 1);
      this.loadEmployees();
    }
  }

  initials(e: Employee): string {
    return ((e.firstName[0] ?? '') + (e.lastName[0] ?? '')).toUpperCase();
  }

  // Deterministic identity hue: same person always gets the same color.
  hue(e: Employee): string {
    const hues = ['hue-indigo', 'hue-teal', 'hue-amber', 'hue-rose', 'hue-violet'];
    return hues[(e.firstName.charCodeAt(0) + e.lastName.charCodeAt(0)) % hues.length];
  }

  capacityWidth(e: Employee): number {
    return Math.min(100, Math.round((e.weeklyCapacityHours / 40) * 100));
  }

  // --- Create / edit ---
  openCreate() {
    this.form.reset({
      firstName: '',
      lastName: '',
      email: '',
      jobTitle: '',
      department: '',
      weeklyCapacityHours: null,
      yearsOfExperience: null,
      active: true,
      username: '',
      password: '',
      role: 'EMPLOYEE',
    });
    this.editing.set('new');
  }

  openEdit(e: Employee) {
    this.form.reset({
      firstName: e.firstName,
      lastName: e.lastName,
      email: e.email,
      jobTitle: e.jobTitle ?? '',
      department: e.department ?? '',
      weeklyCapacityHours: e.weeklyCapacityHours ?? null,
      yearsOfExperience: e.yearsOfExperience ?? null,
      active: e.active,
      username: '',
      password: '',
      role: 'EMPLOYEE',
    });
    this.editing.set(e);
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
    this.saving.set(true);
    const target = this.editing();

    if (target && target !== 'new') {
      const body: EmployeeUpdateRequest = {
        firstName: raw.firstName.trim(),
        lastName: raw.lastName.trim(),
        email: raw.email.trim(),
        jobTitle: raw.jobTitle.trim() || undefined,
        department: raw.department.trim() || undefined,
        weeklyCapacityHours: raw.weeklyCapacityHours ?? undefined,
        yearsOfExperience: raw.yearsOfExperience ?? undefined,
        active: raw.active,
      };
      this.employeeService.update(target.id, body).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Employee updated.');
          this.closeForm();
          this.loadEmployees();
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.toast.error(getApiErrorMessage(err));
        },
      });
    } else {
      const body: EmployeeCreateRequest = {
        firstName: raw.firstName.trim(),
        lastName: raw.lastName.trim(),
        email: raw.email.trim(),
        jobTitle: raw.jobTitle.trim() || undefined,
        department: raw.department.trim() || undefined,
        weeklyCapacityHours: raw.weeklyCapacityHours ?? undefined,
        yearsOfExperience: raw.yearsOfExperience ?? undefined,
        active: raw.active,
        username: raw.username.trim() || undefined,
        password: raw.password.trim() || undefined,
        role: raw.role,
      };
      this.employeeService.create(body).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.closeForm();
          // Surface the one-time temporary password.
          this.newCredentials.set({
            username: res.username,
            temporaryPassword: res.temporaryPassword,
          });
          this.loadEmployees();
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.toast.error(getApiErrorMessage(err));
        },
      });
    }
  }

  dismissCredentials() {
    this.newCredentials.set(null);
  }

  // --- Delete ---
  confirmDelete(e: Employee) {
    this.deleteTarget.set(e);
  }

  cancelDelete() {
    this.deleteTarget.set(null);
  }

  doDelete() {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);
    this.employeeService.delete(target.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.toast.success('Employee deleted.');
        if (this.employees().length === 1 && this.currentPage() > 0) {
          this.currentPage.update((p) => p - 1);
        }
        this.loadEmployees();
      },
      error: (err: unknown) => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.toast.error(getApiErrorMessage(err));
      },
    });
  }

  protected isEditing(): boolean {
    return this.editing() !== null && this.editing() !== 'new';
  }
}
