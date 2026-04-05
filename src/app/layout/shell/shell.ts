import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { MeService } from '../../core/services/me.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastContainer } from '../../shared/ui/toast-container/toast-container';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ToastContainer],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private session = inject(SessionService);
  private me = inject(MeService);
  private notifications = inject(NotificationService);

  readonly user = this.session.user;
  readonly role = this.session.role;
  readonly unreadCount = this.notifications.unread;

  // Nav visibility mirrors the roles the endpoints are documented for. The
  // backend remains the real gate — this only tidies the menu.
  // Dashboard is a management overview (ADMIN/MANAGER). The personal "My workspace"
  // is shown to anyone who actually HAS a linked employee record — regardless of role,
  // so an admin who is also an employee can reach their own profile.
  readonly canManage = computed(() => this.session.hasRole('ADMIN', 'MANAGER'));
  readonly isAdmin = computed(() => this.session.hasRole('ADMIN'));
  readonly hasWorkspace = computed(() => this.session.hasEmployeeProfile() === true);

  ngOnInit() {
    // Resolve once whether the current user has an employee profile (drives the workspace
    // menu item). A 404 simply means "no linked employee" — not an error worth surfacing.
    if (this.session.hasEmployeeProfile() === null) {
      this.me.profile().subscribe({
        next: () => this.session.setEmployeeProfilePresence(true),
        error: () => this.session.setEmployeeProfilePresence(false),
      });
    }
    this.notifications.refreshUnread();
  }

  readonly initials = computed(() => {
    const name = this.user()?.username ?? '';
    return name.slice(0, 2).toUpperCase() || '—';
  });

  logout() {
    // Clears the session locally even if the network call fails.
    this.auth.logout().subscribe({
      next: () => this.afterLogout(),
      error: () => this.afterLogout(),
    });
  }

  private afterLogout() {
    void this.router.navigate(['/login']);
  }
}
