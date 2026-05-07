import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from '../shared/interfaces/pagination.interface';

export interface ConsultaEnTurno {
  id: number;
  nota: string | null;
  extra: Record<string, unknown> | null;
  motivoConsulta?: string | null;
  examenClinico?: string | null;
  diagnostico?: string | null;
  planTratamiento?: string | null;
  pesoKg?: number | string | null;
  createdAt?: string;
}

export interface Turno {
  id: number;
  pacienteID?: number | null;
  mascotaID?: number | null;
  profesionalID: number;
  servicioID: number;
  precio?: number;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  estado: 'RESERVADO' | 'PENDIENTE' | 'CANCELADO' | 'COMPLETADO' | 'BAJA';
  notas?: string;
  consultaID?: number | null;
  tipo?: 'CONSULTORIO' | 'DOMICILIO' | 'INTERNACION';
  // Relaciones
  consulta?: ConsultaEnTurno | null;
  paciente?: {
    id: number;
    nombre: string;
    dni: string;
    telefono?: string;
    email?: string;
  };
  mascota?: {
    id: number;
    nombre: string;
    especie?: string;
    raza?: string;
  };
  profesional?: {
    id: number;
    nombre: string;
    telefono?: string;
    email?: string;
  };
  servicio?: {
    id: number;
    nombre: string;
    codigo: string;
    color?: string;
    default_extra_consulta?: Record<string, unknown> | null;
    default_extra_ficha?: Record<string, unknown> | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TurnosService {
  private apiUrl = `${environment.apiUrl}/turnos`;

  constructor(private http: HttpClient) {}

  listar(filtros?: {
    estado?: string;
    pacienteID?: number;
    mascotaID?: number;
    profesionalID?: number;
    servicioID?: number;
    fechaInicio?: string;
    fechaFin?: string;
  }): Observable<Turno[]> {
    let params = new HttpParams();
    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.pacienteID) params = params.set('pacienteID', filtros.pacienteID.toString());
    if (filtros?.mascotaID) params = params.set('mascotaID', filtros.mascotaID.toString());
    if (filtros?.profesionalID) params = params.set('profesionalID', filtros.profesionalID.toString());
    if (filtros?.servicioID) params = params.set('servicioID', filtros.servicioID.toString());
    if (filtros?.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    return this.http.get<Turno[]>(this.apiUrl, { params });
  }

  /** Todos los turnos de la mascota (sin paginar; backend solo filtra mascotaID). */
  listarTodosPorMascota(mascotaId: number): Observable<Turno[]> {
    return this.http.get<Turno[]>(`${this.apiUrl}/por-mascota/${mascotaId}`);
  }

  obtener(id: number): Observable<Turno> {
    return this.http.get<Turno>(`${this.apiUrl}/${id}`);
  }

  crear(data: Partial<Turno>): Observable<Turno> {
    return this.http.post<Turno>(this.apiUrl, data);
  }

  actualizar(id: number, data: Partial<Turno>): Observable<Turno> {
    return this.http.put<Turno>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  cancelar(id: number): Observable<Turno> {
    return this.http.put<Turno>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  actualizarNotas(id: number, notas: string): Observable<Turno> {
    return this.http.patch<Turno>(`${this.apiUrl}/${id}/notas`, { notas });
  }

  listarProximos(filtros?: {
    pacienteID?: number;
    mascotaID?: number;
    profesionalID?: number;
    servicioID?: number;
    estado?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResponse<Turno>> {
    let params = new HttpParams();
    if (filtros?.pacienteID) params = params.set('pacienteID', filtros.pacienteID.toString());
    if (filtros?.mascotaID) params = params.set('mascotaID', filtros.mascotaID.toString());
    if (filtros?.profesionalID) params = params.set('profesionalID', filtros.profesionalID.toString());
    if (filtros?.servicioID) params = params.set('servicioID', filtros.servicioID.toString());
    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.page) params = params.set('page', filtros.page.toString());
    if (filtros?.pageSize) params = params.set('pageSize', filtros.pageSize.toString());
    return this.http.get<PaginatedResponse<Turno>>(`${this.apiUrl}/proximos`, { params });
  }

  listarAntiguos(filtros?: {
    pacienteID?: number;
    mascotaID?: number;
    profesionalID?: number;
    servicioID?: number;
    estado?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResponse<Turno>> {
    let params = new HttpParams();
    if (filtros?.pacienteID) params = params.set('pacienteID', filtros.pacienteID.toString());
    if (filtros?.mascotaID) params = params.set('mascotaID', filtros.mascotaID.toString());
    if (filtros?.profesionalID) params = params.set('profesionalID', filtros.profesionalID.toString());
    if (filtros?.servicioID) params = params.set('servicioID', filtros.servicioID.toString());
    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.page) params = params.set('page', filtros.page.toString());
    if (filtros?.pageSize) params = params.set('pageSize', filtros.pageSize.toString());
    return this.http.get<PaginatedResponse<Turno>>(`${this.apiUrl}/antiguos`, { params });
  }
}
