import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReportService } from '../../core/services/report.service';
import { UtilizationReportRow } from '../../core/models/report.model';
import { CertificationReport } from '../../core/models/certification.model';
import { UtilizationStatus } from '../../core/models/common.model';

type Tab = 'utilization' | 'certifications';

@Component({
  selector: 'app-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  templateUrl: './reports.html',
})
export class Reports implements OnInit {
  private service = inject(ReportService);

  tab = signal<Tab>('utilization');

  utilization = signal<UtilizationReportRow[]>([]);
  certReport = signal<CertificationReport | null>(null);
  loading = signal(true);
  error = signal(false);

  ngOnInit() {
    // Both reports load up front; the tabs just switch the view.
    this.service.utilization().subscribe({
      next: (rows) => {
        this.utilization.set(rows);
        this.settleLoading();
      },
      error: () => {
        this.error.set(true);
        this.settleLoading();
      },
    });
    this.service.certifications().subscribe({
      next: (report) => {
        this.certReport.set(report);
        this.settleLoading();
      },
      error: () => {
        this.error.set(true);
        this.settleLoading();
      },
    });
  }

  private pending = 2;
  private settleLoading() {
    this.pending -= 1;
    if (this.pending <= 0) this.loading.set(false);
  }

  setTab(tab: Tab) {
    this.tab.set(tab);
  }

  utilizationClass(status: UtilizationStatus): string {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-blue-100 text-blue-800';
      case 'PARTIALLY_ALLOCATED':
        return 'bg-teal-100 text-teal-800';
      case 'FULLY_ALLOCATED':
        return 'bg-green-100 text-green-800';
      case 'OVERALLOCATED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-surface-container-low text-on-surface-variant';
    }
  }

  barWidth(pct: number): number {
    return Math.max(0, Math.min(100, pct));
  }
}
