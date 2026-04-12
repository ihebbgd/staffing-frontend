import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CertificationService } from '../../core/services/certification.service';
import { EmployeeService } from '../../core/services/employee.service';
import { SkillService } from '../../core/services/skill.service';
import { ToastService } from '../../core/services/toast.service';
import { Certification, CertificationRequest } from '../../core/models/certification.model';
import { Employee } from '../../core/models/employee.model';
import { Skill } from '../../core/models/skill.model';
import { CertificationStatus, DEFAULT_PAGE_SIZE } from '../../core/models/common.model';
import { getApiErrorMessage } from '../../core/http/api-error';
import { Paginator } from '../../shared/ui/paginator/paginator';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-certifications',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Paginator, ConfirmDialog],
  templateUrl: './certifications.html',
})
export class Certifications implements OnInit {
  private service = inject(CertificationService);
  private employeeService = inject(EmployeeService);
  private skillService = inject(SkillService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  certs = signal<Certification[]>([]);
  employees = signal<Employee[]>([]);
  skills = signal<Skill[]>([]);
  loading = signal(true);
  error = signal(false);

  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  searchTerm = signal('');

  editing = signal<Certification | 'new' | null>(null);
  saving = signal(false);
  deleteTarget = signal<Certification | null>(null);
  deleting = signal(false);

  // CertificationRequest: employeeId + name required.
  form = this.fb.nonNullable.group({
    employeeId: ['', Validators.required],
    name: ['', Validators.required],
    issuingOrganization: [''],
    skillId: [''],
    issueDate: [''],
    expiryDate: [''],
    credentialId: [''],
  });

  private employeeName = computed(() => {
    const map = new Map<string, string>();
    for (const e of this.employees()) map.set(e.id, `${e.firstName} ${e.lastName}`);
    return map;
  });

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.certs();
    if (!term) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.issuingOrganization ?? '').toLowerCase().includes(term) ||
        this.employeeLabel(c.employeeId).toLowerCase().includes(term),
    );
  });

  ngOnInit() {
    this.employeeService.list({ page: 0, size: 500, sort: ['lastName,asc'] }).subscribe({
      next: (p) => this.employees.set(p.content),
      error: () => this.employees.set([]),
    });
    this.skillService.list({ page: 0, size: 200, sort: ['name,asc'] }).subscribe({
      next: (p) => this.skills.set(p.content),
      error: () => this.skills.set([]),
    });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.service.list({ page: this.page(), size: DEFAULT_PAGE_SIZE }).subscribe({
      next: (p) => {
        this.certs.set(p.content);
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

  openCreate() {
    this.form.reset({
      employeeId: '',
      name: '',
      issuingOrganization: '',
      skillId: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
    });
    this.editing.set('new');
  }

  openEdit(cert: Certification) {
    this.form.reset({
      employeeId: cert.employeeId,
      name: cert.name,
      issuingOrganization: cert.issuingOrganization ?? '',
      skillId: cert.skillId ?? '',
      issueDate: cert.issueDate ?? '',
      expiryDate: cert.expiryDate ?? '',
      credentialId: cert.credentialId ?? '',
    });
    this.editing.set(cert);
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
    const body: CertificationRequest = {
      employeeId: raw.employeeId,
      name: raw.name.trim(),
      issuingOrganization: raw.issuingOrganization.trim() || undefined,
      skillId: raw.skillId || undefined,
      issueDate: raw.issueDate || undefined,
      expiryDate: raw.expiryDate || undefined,
      credentialId: raw.credentialId.trim() || undefined,
    };

    this.saving.set(true);
    const target = this.editing();
    const request =
      target && target !== 'new'
        ? this.service.update(target.id, body)
        : this.service.create(body);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(target === 'new' ? 'Certification added.' : 'Certification updated.');
        this.closeForm();
        this.load();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toast.error(getApiErrorMessage(err));
      },
    });
  }

  confirmDelete(cert: Certification) {
    this.deleteTarget.set(cert);
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
        this.toast.success('Certification deleted.');
        if (this.certs().length === 1 && this.page() > 0) {
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

  statusClass(status?: CertificationStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'EXPIRING_SOON':
        return 'bg-amber-100 text-amber-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-surface-container-low text-on-surface-variant';
    }
  }

  protected isEditing(): boolean {
    return this.editing() !== null && this.editing() !== 'new';
  }
}
