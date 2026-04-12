import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SkillService } from '../../core/services/skill.service';
import { ToastService } from '../../core/services/toast.service';
import { Skill } from '../../core/models/skill.model';
import { DEFAULT_PAGE_SIZE } from '../../core/models/common.model';
import { getApiErrorMessage } from '../../core/http/api-error';
import { Paginator } from '../../shared/ui/paginator/paginator';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-skills',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Paginator, ConfirmDialog],
  templateUrl: './skills.html',
})
export class Skills implements OnInit {
  private service = inject(SkillService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  skills = signal<Skill[]>([]);
  loading = signal(true);
  error = signal(false);

  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);

  searchTerm = signal('');

  // Modal state: null = closed, Skill = editing, 'new' = creating
  editing = signal<Skill | 'new' | null>(null);
  saving = signal(false);
  deleteTarget = signal<Skill | null>(null);
  deleting = signal(false);

  // SkillRequest: name required (minLength 1); category/description optional.
  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    category: [''],
    description: [''],
  });

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.skills();
    if (!term) return list;
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.category ?? '').toLowerCase().includes(term) ||
        (s.description ?? '').toLowerCase().includes(term),
    );
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.service.list({ page: this.page(), size: DEFAULT_PAGE_SIZE, sort: ['name,asc'] }).subscribe({
      next: (p) => {
        this.skills.set(p.content);
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

  openCreate() {
    this.form.reset({ name: '', category: '', description: '' });
    this.editing.set('new');
  }

  openEdit(skill: Skill) {
    this.form.reset({
      name: skill.name,
      category: skill.category ?? '',
      description: skill.description ?? '',
    });
    this.editing.set(skill);
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
    // Only send optional fields when the user actually filled them.
    const body = {
      name: raw.name.trim(),
      category: raw.category.trim() || undefined,
      description: raw.description.trim() || undefined,
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
        this.toast.success(target === 'new' ? 'Skill created.' : 'Skill updated.');
        this.closeForm();
        this.load();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toast.error(getApiErrorMessage(err));
      },
    });
  }

  confirmDelete(skill: Skill) {
    this.deleteTarget.set(skill);
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
        this.toast.success('Skill deleted.');
        // Step back a page if we just removed the last row on it.
        if (this.skills().length === 1 && this.page() > 0) {
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

  protected isEditing(): boolean {
    return this.editing() !== null && this.editing() !== 'new';
  }
}
