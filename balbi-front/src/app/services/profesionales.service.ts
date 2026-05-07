import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from '../shared/interfaces/pagination.interface';

export interface Profesional {
  id: number;
  nombre: string;
  codigo?: string;
  telefono?: string;
  email?: string;
  color?: string;
  detalles?: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'BAJA';
  servicios?: Array<{
    id: number;
    nombre: string;
    codigo: string;
    duracionMinutos: number;
    color?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfesionalesService {
  private apiUrl = `${environment.apiUrl}/profesionales`;

  constructor(private http: HttpClient) {}

  listar(filtros?: {
    estado?: string;
    nombre?: string;
    codigo?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResponse<Profesional>> {
    let params = new HttpParams();
    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.nombre) params = params.set('nombre', filtros.nombre);
    if (filtros?.codigo) params = params.set('codigo', filtros.codigo);
    if (filtros?.page) params = params.set('page', filtros.page.toString());
    if (filtros?.pageSize) params = params.set('pageSize', filtros.pageSize.toString());
    return this.http.get<PaginatedResponse<Profesional>>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<Profesional> {
    return this.http.get<Profesional>(`${this.apiUrl}/${id}`);
  }

  crear(data: Partial<Profesional>): Observable<Profesional> {
    return this.http.post<Profesional>(this.apiUrl, data);
  }

  actualizar(id: number, data: Partial<Profesional>): Observable<Profesional> {
    return this.http.put<Profesional>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  actualizarServicios(id: number, servicios: number[]): Observable<Profesional> {
    return this.http.put<Profesional>(`${this.apiUrl}/${id}/servicios`, { servicios });
  }
}

