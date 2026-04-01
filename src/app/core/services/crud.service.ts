import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page, PageQuery, toPageParams } from '../models/common.model';

/**
 * Generic CRUD base for the resource endpoints that all share the same shape:
 *   GET    /api/{resource}         (paged)      -> Page<TResponse>
 *   POST   /api/{resource}                      -> TResponse
 *   GET    /api/{resource}/{id}                 -> TResponse
 *   PUT    /api/{resource}/{id}                 -> TResponse
 *   DELETE /api/{resource}/{id}
 *
 * Concrete services extend this with a resource path and add any endpoint that
 * is unique to them. Nothing here invents routes — each maps 1:1 to openapi.json.
 */
export abstract class CrudService<TResponse, TRequest> {
  protected http = inject(HttpClient);
  protected readonly baseUrl: string;

  protected constructor(resource: string) {
    this.baseUrl = `${environment.apiUrl}/${resource}`;
  }

  list(query: PageQuery = {}): Observable<Page<TResponse>> {
    return this.http.get<Page<TResponse>>(this.baseUrl, { params: toPageParams(query) });
  }

  getById(id: string): Observable<TResponse> {
    return this.http.get<TResponse>(`${this.baseUrl}/${id}`);
  }

  create(body: TRequest): Observable<TResponse> {
    return this.http.post<TResponse>(this.baseUrl, body);
  }

  update(id: string, body: TRequest): Observable<TResponse> {
    return this.http.put<TResponse>(`${this.baseUrl}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
