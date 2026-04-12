import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService } from '../../core/services/project.service';
import { SkillService } from '../../core/services/skill.service';
import { ToastService } from '../../core/services/toast.service';
import { Project, ProjectRequest } from '../../core/models/project.model';
import { Skill } from '../../core/models/skill.model';
import { DEFAULT_PAGE_SIZE, PROJECT_STATUSES, ProjectStatus } from '../../core/models/common.model';
import { getApiErrorMessage } from '../../core/http/api-error';
import { Paginator } from '../../shared/ui/paginator/paginator';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-projects',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Paginator, ConfirmDialog],
  templateUrl: './projects.html',
})
export class Projects implements OnInit {
  private service = inject(ProjectService);
  private skillService = inject(SkillService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly statuses = PROJECT_STATUSES;

  projects = signal<Project[]>([]);
  skills = signal<Skill[]>([]);
  loading = signal(true);
  error = signal(false);

  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  searchTerm = signal('');

  editing = signal<Project | 'new' | null>(null);
  saving = signal(false);
  selectedSkillIds = signal<Set<string>>(new Set());
  deleteTarget = signal<Project | null>(null);
  deleting = signal(false);

  // ProjectRequest: name required; everything else optional.
  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    description: [''],
    startDate: [''],
    endDate: [''],
    status: ['' as ProjectStatus | ''],
  });

  private skillName = computed(() => {
    const map = new Map<string, string>();
    for (const s of this.skills()) map.set(s.id, s.name);
    return map;
  });

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.projects();
    if (!term) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.status ?? '').toLowerCase().includes(term) ||
        (p.description ?? '').toLowerCase().includes(term),
    );
  });

  ngOnInit() {
    // Skills feed the "required skills" picker and label lookups.
    this.skillService.list({ page: 0, size: 200, sort: ['name,asc'] }).subscribe({
      next: (p) => this.skills.set(p.content),
      error: () => this.skills.set([]),
    });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.service.list({ page: this.page(), size: DEFAULT_PAGE_SIZE, sort: ['name,asc'] }).subscribe({
      next: (p) => {
        this.projects.set(p.content);
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

  skillLabel(id: string): string {
    return this.skillName().get(id) ?? id;
  }

  openCreate() {
    this.form.reset({ name: '', description: '', startDate: '', endDate: '', status: '' });
    this.selectedSkillIds.set(new Set());
    this.editing.set('new');
  }

  openEdit(project: Project) {
    this.form.reset({
      name: project.name,
      description: project.description ?? '',
      startDate: project.startDate ?? '',
      endDate: project.endDate ?? '',
      status: project.status ?? '',
    });
    this.selectedSkillIds.set(new Set(project.requiredSkillIds ?? []));
    this.editing.set(project);
  }

  closeForm() {
    this.editing.set(null);
  }

  toggleSkill(id: string) {
    this.selectedSkillIds.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body: ProjectRequest = {
      name: raw.name.trim(),
      description: raw.description.trim() || undefined,
      startDate: raw.startDate || undefined,
      endDate: raw.endDate || undefined,
      status: raw.status || undefined,
      requiredSkillIds: [...this.selectedSkillIds()],
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
        this.toast.success(target === 'new' ? 'Project created.' : 'Project updated.');
        this.closeForm();
        this.load();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toast.error(getApiErrorMessage(err));
      },
    });
  }

  confirmDelete(project: Project) {
    this.deleteTarget.set(project);
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
        this.toast.success('Project deleted.');
        if (this.projects().length === 1 && this.page() > 0) {
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

  statusClass(status?: ProjectStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PLANNED':
        return 'bg-blue-100 text-blue-800';
      case 'ON_HOLD':
        return 'bg-amber-100 text-amber-800';
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
