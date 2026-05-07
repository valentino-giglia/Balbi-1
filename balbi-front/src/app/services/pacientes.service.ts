import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from '../shared/interfaces/pagination.interface';

export interface Paciente {
  id: number;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  dni?: string | null;
  kapso_phone_number_id?: string;
  kapso_conversation_id?: string;
  kapso_agent_status?: 'ON' | 'OFF';
   sn_derivado?: boolean;
  estado: 'ACTIVO' | 'INACTIVO' | 'BAJA';
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PacientesService {
  private apiUrl = `${environment.apiUrl}/pacientes`;

  constructor(private http: HttpClient) {}

  listar(filtros?: {
    estado?: string;
    nombre?: string;
    dni?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResponse<Paciente>> {
    let params = new HttpParams();
    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.nombre) params = params.set('nombre', filtros.nombre);
    if (filtros?.dni) params = params.set('dni', filtros.dni);
    if (filtros?.page) params = params.set('page', filtros.page.toString());
    if (filtros?.pageSize) params = params.set('pageSize', filtros.pageSize.toString());
    return this.http.get<PaginatedResponse<Paciente>>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.apiUrl}/${id}`);
  }

  crear(data: Partial<Paciente>): Observable<Paciente> {
    return this.http.post<Paciente>(this.apiUrl, data);
  }

  actualizar(id: number, data: Partial<Paciente>): Observable<Paciente> {
    return this.http.put<Paciente>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  obtenerHistorial(id: number): Observable<HistorialPaciente> {
    return this.http.get<HistorialPaciente>(`${this.apiUrl}/${id}/historial`);
  }

  /** Resumen para generar PDF de historial clínico */
  getResumenHistorialClinico(pacienteID: number): Observable<ResumenHistorialClinico> {
    return this.http.get<ResumenHistorialClinico>(`${this.apiUrl}/${pacienteID}/historial-clinico`);
  }
}

/** Consulta en respuestas de historial clínico (PDF / resúmenes) */
export interface HistorialClinicoConsultaResumen {
  id: number;
  nota: string | null;
  extra: Record<string, unknown> | null;
  createdAt?: string;
  motivoConsulta?: string | null;
  examenClinico?: string | null;
  diagnostico?: string | null;
  planTratamiento?: string | null;
  pesoKg?: number | string | null;
}

export interface HistorialClinicoFileItem {
  id: number;
  nombreArchivo: string | null;
  tipoArchivo: string | null;
  turnoID: number | null;
  mascotaID?: number | null;
  createdAt?: string;
}

export interface HistorialClinicoVacunaItem {
  id: number;
  nombre: string;
  fechaAplicacion: string;
  proximaDosis?: string | null;
  notas?: string | null;
}

export interface ResumenHistorialClinico {
  paciente: {
    id: number;
    nombre: string;
    dni?: string | null;
    telefono?: string | null;
    email?: string | null;
  };
  ficha: { id: number; notas: string | null; extra: Record<string, unknown> | null; createdAt?: string } | null;
  turnos: Array<{
    id: number;
    horaInicio: string;
    estado: string;
    duracionMinutos: number;
    notas?: string | null;
    tipo?: string;
    servicio?: { id: number; nombre: string };
    profesional?: { id: number; nombre: string };
    consulta?: HistorialClinicoConsultaResumen | null;
  }>;
  filesCount?: number;
  files?: HistorialClinicoFileItem[];
  vacunas?: HistorialClinicoVacunaItem[];
}

export interface HistorialPaciente {
  paciente: Paciente;
  turnos: Array<{
    id: number;
    turnoID: number;
    pacienteID: number;
    estado: 'PENDIENTE' | 'RESERVADO' | 'CANCELADO' | 'COMPLETADO';
    notas?: string;
    createdAt: string;
    updatedAt: string;
    turno: {
      id: number;
      servicioID: number;
      codigo: string;
      horaInicio: string;
      horaFin: string;
      duracionMinutos: number;
      estado: 'RESERVADO' | 'PENDIENTE' | 'CANCELADO' | 'COMPLETADO' | 'BAJA';
      notas?: string;
      createdAt: string;
      updatedAt: string;
      servicio: {
        id: number;
        profesionalID: number;
        nombre: string;
        codigo: string;
        duracionMinutos: number;
        maximoPacientes: number;
        color?: string;
        detalles?: string;
        disponibilidadSemanal?: any;
        linkPublico?: string;
        estado: 'ACTIVO' | 'INACTIVO' | 'BAJA';
        createdAt: string;
        updatedAt: string;
        profesional?: {
          id: number;
          nombre: string;
          especialidad?: string;
          telefono?: string;
          email?: string;
          color?: string;
          detalles?: string;
          estado: 'ACTIVO' | 'INACTIVO' | 'BAJA';
          createdAt: string;
          updatedAt: string;
        } | null;
      };
    };
  }>;
}

