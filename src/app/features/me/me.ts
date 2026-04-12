import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MeService } from '../../core/services/me.service';
import { Employee } from '../../core/models/employee.model';
import { Allocation, Workload } from '../../core/models/allocation.model';
import { Project } from '../../core/models/project.model';
import { EmployeeSkill } from '../../core/models/employee-skill.model';
import { Certification } from '../../core/models/certification.model';
import { CertificationStatus } from '../../core/models/common.model';

@Component({
  selector: 'app-me',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  templateUrl: './me.html',
})
export class Me implements OnInit {
  private service = inject(MeService);

  profile = signal<Employee | null>(null);
  workload = signal<Workload | null>(null);
  projects = signal<Project[]>([]);
  allocations = signal<Allocation[]>([]);
  skills = signal<EmployeeSkill[]>([]);
  certifications = signal<Certification[]>([]);
  teammates = signal<Employee[]>([]);

  loading = signal(true);
  error = signal(false);

  utilization = computed(() => this.workload()?.utilizationPercent ?? 0);
  utilizationWidth = computed(() => Math.max(0, Math.min(100, this.utilization())));

  ngOnInit() {
    // Profile is the anchor; the rest fill in the panels independently.
    this.service.profile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
    this.service.workload().subscribe({ next: (w) => this.workload.set(w), error: () => {} });
    this.service.projects().subscribe({ next: (p) => this.projects.set(p), error: () => {} });
    this.service.allocations().subscribe({ next: (a) => this.allocations.set(a), error: () => {} });
    this.service.skills().subscribe({ next: (s) => this.skills.set(s), error: () => {} });
    this.service.certifications().subscribe({ next: (c) => this.certifications.set(c), error: () => {} });
    this.service.teammates().subscribe({ next: (t) => this.teammates.set(t), error: () => {} });
  }

  initials(first?: string, last?: string): string {
    return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase() || '—';
  }

  stars(level?: number): number[] {
    return Array.from({ length: Math.max(0, Math.min(5, level ?? 0)) });
  }

  certClass(status?: CertificationStatus): string {
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
}
