import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from '../shared/interfaces/pagination.interface';

export interface Servicio {
  id: number;
  nombre: string;
  codigo: string;
  duracionMinutos: number;
  color?: string;
  /** Precio del servicio */
  precio?: number;
  estado: 'ACTIVO' | 'INACTIVO' | 'BAJA';
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {
  private apiUrl = `${environment.apiUrl}/servicios`;

  constructor(private http: HttpClient) {}

  listar(filtros?: {
    estado?: string;
    nombre?: string;
    codigo?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResponse<Servicio>> {
    let params = new HttpParams();
    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.nombre) params = params.set('nombre', filtros.nombre);
    if (filtros?.codigo) params = params.set('codigo', filtros.codigo);
    if (filtros?.page) params = params.set('page', filtros.page.toString());
    if (filtros?.pageSize) params = params.set('pageSize', filtros.pageSize.toString());
    return this.http.get<PaginatedResponse<Servicio>>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<Servicio> {
    return this.http.get<Servicio>(`${this.apiUrl}/${id}`);
  }

  crear(data: Partial<Servicio>): Observable<Servicio> {
    return this.http.post<Servicio>(this.apiUrl, data);
  }

  actualizar(id: number, data: Partial<Servicio>): Observable<Servicio> {
    return this.http.put<Servicio>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
