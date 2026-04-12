import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RecommendationService } from '../../core/services/recommendation.service';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';
import { RecommendationResult } from '../../core/models/recommendation.model';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  templateUrl: './recommendations.html',
})
export class Recommendations implements OnInit {
  private service = inject(RecommendationService);
  private projectService = inject(ProjectService);

  projects = signal<Project[]>([]);
  selectedProjectId = signal('');
  topN = signal(5);

  results = signal<RecommendationResult[]>([]);
  loading = signal(false);
  error = signal(false);
  hasSearched = signal(false);

  ngOnInit() {
    this.projectService.list({ page: 0, size: 500, sort: ['name,asc'] }).subscribe({
      next: (p) => this.projects.set(p.content),
      error: () => this.projects.set([]),
    });
  }

  onProjectChange(event: Event) {
    this.selectedProjectId.set((event.target as HTMLSelectElement).value);
    this.results.set([]);
    this.hasSearched.set(false);
  }

  onTopNChange(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    this.topN.set(Number.isFinite(value) && value > 0 ? value : 5);
  }

  run() {
    const projectId = this.selectedProjectId();
    if (!projectId) return;
    this.loading.set(true);
    this.error.set(false);
    this.hasSearched.set(true);
    this.service.forProject(projectId, this.topN()).subscribe({
      next: (res) => {
        this.results.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  scorePercent(score: number): number {
    // totalScore is expected on a 0..1 or 0..100 scale; normalize for the bar.
    return Math.max(0, Math.min(100, score <= 1 ? Math.round(score * 100) : Math.round(score)));
  }

  medalClass(index: number): string {
    return index === 0
      ? 'bg-primary text-white'
      : index === 1
        ? 'bg-blue-100 text-blue-800'
        : index === 2
          ? 'bg-amber-100 text-amber-800'
          : 'bg-surface-container-low text-on-surface-variant';
  }
}
