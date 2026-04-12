import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { EmployeeService } from '../../core/services/employee.service';
import { ToastService } from '../../core/services/toast.service';
import { SessionService } from '../../core/services/session.service';
import { CreateUserRequest, User } from '../../core/models/user.model';
import { Employee } from '../../core/models/employee.model';
import { DEFAULT_PAGE_SIZE, ROLES, Role } from '../../core/models/common.model';
import { getApiErrorMessage } from '../../core/http/api-error';
import { Paginator } from '../../shared/ui/paginator/paginator';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Paginator, ConfirmDialog],
  templateUrl: './users.html',
})
export class Users implements OnInit {
  private service = inject(UserService);
  private employeeService = inject(EmployeeService);
  private toast = inject(ToastService);
  private session = inject(SessionService);

  readonly roles = ROLES;

  // The logged-in admin cannot edit their own account (also enforced by the API);
  // rows matching this username are shown read-only. Usernames are unique.
  readonly currentUsername = computed(() => this.session.user()?.username ?? null);

  users = signal<User[]>([]);
  employees = signal<Employee[]>([]);
  loading = signal(true);
  error = signal(false);

  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  searchTerm = signal('');

  busyId = signal<string | null>(null);
  deleteTarget = signal<User | null>(null);
  deleting = signal(false);
  resetTarget = signal<User | null>(null);
  resetting = signal(false);
  resetNewPassword = signal('');
  resetConfirmPassword = signal('');
  resetError = signal<string | null>(null);
  tempPassword = signal<string | null>(null);

  // Link-employee modal
  linkTarget = signal<User | null>(null);
  linkEmployeeId = signal('');
  linking = signal(false);

  // Create-user modal
  createOpen = signal(false);
  createUsername = signal('');
  createEmail = signal('');
  createRole = signal<Role>('EMPLOYEE');
  createPassword = signal('');
  createConfirmPassword = signal('');
  creating = signal(false);
  createError = signal<string | null>(null);

  // App-wide minimum for a login password (matches the backend MIN_LOGIN_PASSWORD_LENGTH).
  readonly minPasswordLength = 8;

  private searchDebounce?: ReturnType<typeof setTimeout>;

  private employeeName = computed(() => {
    const map = new Map<string, string>();
    for (const e of this.employees()) map.set(e.id, `${e.firstName} ${e.lastName}`);
    return map;
  });

  ngOnInit() {
    this.employeeService.list({ page: 0, size: 500, sort: ['lastName,asc'] }).subscribe({
      next: (p) => this.employees.set(p.content),
      error: () => this.employees.set([]),
    });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.service
      .list({
        page: this.page(),
        size: DEFAULT_PAGE_SIZE,
        sort: ['username,asc'],
        search: this.searchTerm(),
      })
      .subscribe({
        next: (p) => {
          this.users.set(p.content);
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

  // Server-side search (debounced), so results span all pages — not just the current one.
  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.page.set(0);
      this.load();
    }, 300);
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

  employeeLabel(id?: string): string {
    return id ? this.employeeName().get(id) ?? id : '';
  }

  /** True for the currently logged-in admin's own row — such rows are shown read-only. */
  isSelf(user: User): boolean {
    return user.username === this.currentUsername();
  }

  private patch(user: User, updated: User) {
    this.users.update((list) => list.map((u) => (u.id === user.id ? updated : u)));
  }

  changeRole(user: User, role: Role) {
    if (role === user.role) return;
    this.busyId.set(user.id);
    this.service.changeRole(user.id, role).subscribe({
      next: (u) => {
        this.busyId.set(null);
        this.patch(user, u);
        this.toast.success(`${user.username} is now ${role}.`);
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.toast.error(getApiErrorMessage(err));
      },
    });
  }

  toggleStatus(user: User) {
    this.busyId.set(user.id);
    this.service.setStatus(user.id, !user.enabled).subscribe({
      next: (u) => {
        this.busyId.set(null);
        this.patch(user, u);
        this.toast.success(`${user.username} ${u.enabled ? 'enabled' : 'disabled'}.`);
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.toast.error(getApiErrorMessage(err));
      },
    });
  }

  // --- Reset password ---
  askReset(user: User) {
    this.resetNewPassword.set('');
    this.resetConfirmPassword.set('');
    this.resetError.set(null);
    this.resetTarget.set(user);
  }

  cancelReset() {
    this.resetTarget.set(null);
  }

  /** Fills both reset fields with a strong random password; the admin can still edit it. */
  generateResetPassword() {
    const password = this.randomPassword();
    this.resetNewPassword.set(password);
    this.resetConfirmPassword.set(password);
    this.resetError.set(null);
  }

  doReset() {
    const user = this.resetTarget();
    if (!user) return;
    const password = this.resetNewPassword();
    const confirm = this.resetConfirmPassword();
    const validationError = this.validatePasswordPair(password, confirm);
    if (validationError) {
      this.resetError.set(validationError);
      return;
    }
    this.resetting.set(true);
    this.resetError.set(null);
    this.service.resetPassword(user.id, password).subscribe({
      next: (res) => {
        this.resetting.set(false);
        this.resetTarget.set(null);
        this.toast.success(`Password reset for ${user.username}.`);
        // The admin chose the password, so nothing to reveal; only show if the server generated one.
        if (res.temporaryPassword) {
          this.tempPassword.set(res.temporaryPassword);
        }
      },
      error: (err: unknown) => {
        this.resetting.set(false);
        this.resetError.set(getApiErrorMessage(err));
      },
    });
  }

  dismissTempPassword() {
    this.tempPassword.set(null);
  }

  // --- Link / unlink employee ---
  openLink(user: User) {
    this.linkEmployeeId.set(user.employeeId ?? '');
    this.linkTarget.set(user);
  }

  closeLink() {
    this.linkTarget.set(null);
  }

  setLinkEmployee(event: Event) {
    this.linkEmployeeId.set((event.target as HTMLSelectElement).value);
  }

  doLink() {
    const user = this.linkTarget();
    const employeeId = this.linkEmployeeId();
    if (!user || !employeeId) return;
    this.linking.set(true);
    this.service.linkEmployee(user.id, employeeId).subscribe({
      next: (u) => {
        this.linking.set(false);
        this.linkTarget.set(null);
        this.patch(user, u);
        this.toast.success('Employee linked.');
      },
      error: (err: unknown) => {
        this.linking.set(false);
        this.toast.error(getApiErrorMessage(err));
      },
    });
  }

  unlink(user: User) {
    this.busyId.set(user.id);
    this.service.unlinkEmployee(user.id).subscribe({
      next: (u) => {
        this.busyId.set(null);
        this.patch(user, u);
        this.toast.success('Employee unlinked.');
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.toast.error(getApiErrorMessage(err));
      },
    });
  }

  // --- Delete ---
  confirmDelete(user: User) {
    this.deleteTarget.set(user);
  }

  cancelDelete() {
    this.deleteTarget.set(null);
  }

  doDelete() {
    const user = this.deleteTarget();
    if (!user) return;
    this.deleting.set(true);
    this.service.delete(user.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.toast.success('User deleted.');
        if (this.users().length === 1 && this.page() > 0) {
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

  // --- Create user ---
  openCreate() {
    this.createUsername.set('');
    this.createEmail.set('');
    this.createRole.set('EMPLOYEE');
    this.createPassword.set('');
    this.createConfirmPassword.set('');
    this.createError.set(null);
    this.createOpen.set(true);
  }

  closeCreate() {
    this.createOpen.set(false);
  }

  setCreateRole(event: Event) {
    this.createRole.set((event.target as HTMLSelectElement).value as Role);
  }

  /** Crypto-strong random password, shared by the Create User and Reset Password flows. */
  private randomPassword(): string {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    const length = 16;
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[values[i] % charset.length];
    }
    return password;
  }

  /**
   * Single password rule shared by Create User and Reset Password: required, at least the
   * minimum length, and matching its confirmation. Mirrors the backend MIN_LOGIN_PASSWORD_LENGTH.
   */
  private validatePasswordPair(password: string, confirm: string): string | null {
    if (!password) return 'Password is required.';
    if (password.length < this.minPasswordLength) {
      return `Password must be at least ${this.minPasswordLength} characters.`;
    }
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  }

  /** Generates a strong random password and fills both create fields; the admin can still edit it. */
  generatePassword() {
    const password = this.randomPassword();
    this.createPassword.set(password);
    this.createConfirmPassword.set(password);
    this.createError.set(null);
  }

  /** Username + email checks, then the shared password-pair rule. */
  private validateCreate(username: string, email: string, password: string, confirm: string): string | null {
    if (!username) return 'Username is required.';
    if (!email) return 'Email is required.';
    // Same intent as @Email — a pragmatic well-formedness check.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    return this.validatePasswordPair(password, confirm);
  }

  doCreate() {
    const username = this.createUsername().trim();
    const email = this.createEmail().trim();
    const password = this.createPassword();
    const confirm = this.createConfirmPassword();
    const validationError = this.validateCreate(username, email, password, confirm);
    if (validationError) {
      this.createError.set(validationError);
      return;
    }

    const request: CreateUserRequest = { username, email, role: this.createRole(), password };
    this.creating.set(true);
    this.createError.set(null);
    this.service.create(request).subscribe({
      next: (res) => {
        this.creating.set(false);
        this.createOpen.set(false);
        this.toast.success(`User ${res.user.username} created.`);
        // The admin chose the password, so nothing to reveal; only show the modal if the
        // server generated one (defensive — the form always sends a password here).
        if (res.temporaryPassword) {
          this.tempPassword.set(res.temporaryPassword);
        }
        this.load(); // refresh the list so the new account appears
      },
      error: (err: unknown) => {
        this.creating.set(false);
        this.createError.set(getApiErrorMessage(err));
      },
    });
  }

  roleClass(role: Role): string {
    switch (role) {
      case 'ADMIN':
        return 'bg-primary/10 text-primary';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-surface-container-low text-on-surface-variant';
    }
  }
}
