import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RecommendationResult } from '../models/recommendation.model';

// Recommendations — /api/recommendations.
@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/recommendations`;

  /** GET /api/recommendations/project/{projectId}?topN=5 */
  forProject(projectId: string, topN = 5): Observable<RecommendationResult[]> {
    const params = new HttpParams().set('topN', topN);
    return this.http.get<RecommendationResult[]>(`${this.apiUrl}/project/${projectId}`, { params });
  }
}
