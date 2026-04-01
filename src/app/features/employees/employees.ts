import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { EmployeeService } from '../../core/services/employee.service';
import { Employee } from '../../core/models/employee.model';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [],
  templateUrl: './employees.html',
  styleUrl: './employees.css',
})
export class Employees implements OnInit {
  private employeeService = inject(EmployeeService);

  employees = signal<Employee[]>([]);
  loading = signal(true);
  error = signal(false);

  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);

  searchTerm = signal('');
  view = signal<'table' | 'grid'>('table');

  // derived list: recomputes automatically whenever employees or searchTerm change
  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.employees();
    if (!term) return list;
    return list.filter(
      (e) =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(term) ||
        e.department.toLowerCase().includes(term) ||
        e.jobTitle.toLowerCase().includes(term),
    );
  });

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.loading.set(true);
    this.employeeService.getEmployees(this.currentPage(), 10).subscribe({
      next: (page) => {
        this.employees.set(page.content);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(true);
        this.loading.set(false);
        console.error('Failed to load employees:', err);
      },
    });
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadEmployees();
    }
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadEmployees();
    }
  }

  initials(e: Employee): string {
    return (e.firstName.charAt(0) + e.lastName.charAt(0)).toUpperCase();
  }

  // deterministic identity hue: same person always gets the same color
  hue(e: Employee): string {
    const hues = ['hue-indigo', 'hue-teal', 'hue-amber', 'hue-rose', 'hue-violet'];
    return hues[(e.firstName.charCodeAt(0) + e.lastName.charCodeAt(0)) % hues.length];
  }

  capacityWidth(e: Employee): number {
    return Math.min(100, Math.round((e.weeklyCapacityHours / 40) * 100));
  }
}
