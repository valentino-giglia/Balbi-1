import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from '../shared/interfaces/pagination.interface';

export type CustomFieldScope = 'consulta' | 'ficha';

export interface CustomField {
  id: number;
  key: string;
  label: string;
  type: string;
  scope: CustomFieldScope;
  orden: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Formato { key, label } para compatibilidad con formularios dinámicos */
export function customFieldsToOptions(fields: CustomField[]): { key: string; label: string }[] {
  return fields.map(f => ({ key: f.key, label: f.label }));
}

@Injectable({
  providedIn: 'root'
})
export class CustomFieldsService {
  private apiUrl = `${environment.apiUrl}/custom-fields`;

  constructor(private http: HttpClient) {}

  listar(filtros?: { scope?: string; page?: number; pageSize?: number }): Observable<PaginatedResponse<CustomField>> {
    let params = new HttpParams();
    if (filtros?.scope) params = params.set('scope', filtros.scope);
    if (filtros?.page) params = params.set('page', filtros.page.toString());
    if (filtros?.pageSize) params = params.set('pageSize', filtros.pageSize.toString());
    return this.http.get<PaginatedResponse<CustomField>>(this.apiUrl, { params });
  }

  /** Lista todos sin paginación (para formularios por scope) */
  listarTodos(scope?: CustomFieldScope): Observable<CustomField[]> {
    let params = new HttpParams();
    if (scope) params = params.set('scope', scope);
    return this.http.get<CustomField[]>(`${this.apiUrl}/todos`, { params });
  }

  obtener(id: number): Observable<CustomField> {
    return this.http.get<CustomField>(`${this.apiUrl}/${id}`);
  }

  crear(data: Partial<CustomField>): Observable<CustomField> {
    return this.http.post<CustomField>(this.apiUrl, data);
  }

  actualizar(id: number, data: Partial<CustomField>): Observable<CustomField> {
    return this.http.put<CustomField>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

