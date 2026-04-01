import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStats } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private dashboardService = inject(DashboardService);

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  error = signal(false);
  today = new Date();

  // gauge geometry: circumference of an r=52 circle = 2πr ≈ 326.7
  private readonly circumference = 2 * Math.PI * 52;

  // dash offset that renders the utilization arc (clamped to 100%)
  gaugeOffset = computed(() => {
    const s = this.stats();
    const pct = s ? Math.min(100, s.averageUtilizationPercent) : 0;
    return this.circumference * (1 - pct / 100);
  });
  gaugeCircumference = this.circumference;

  ngOnInit() {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(true);
        this.loading.set(false);
        console.error('Failed to load dashboard:', err);
      },
    });
  }

  percent(part: number, whole: number): number {
    return whole > 0 ? Math.round((part / whole) * 100) : 0;
  }
}
