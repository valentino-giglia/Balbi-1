import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from '../shared/interfaces/pagination.interface';
import type {
  HistorialClinicoConsultaResumen,
  HistorialClinicoFileItem,
  HistorialClinicoVacunaItem
} from './pacientes.service';

export interface CoTutorResumen {
  id: number;
  nombre: string;
}

export interface Mascota {
  id: number;
  pacienteID: number;
  nombre: string;
  especie?: string | null;
  raza?: string | null;
  fechaNacimiento?: string | null;
  notas?: string | null;
  estado: 'ACTIVO' | 'INACTIVO' | 'BAJA';
  paciente?: { id: number; nombre: string };
  coTutores?: CoTutorResumen[];
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MascotasService {
  private apiUrl = `${environment.apiUrl}/mascotas`;

  constructor(private http: HttpClient) {}

  listar(filtros?: {
    pacienteID?: number;
    estado?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResponse<Mascota>> {
    let params = new HttpParams();
    if (filtros?.pacienteID) params = params.set('pacienteID', filtros.pacienteID.toString());
    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.page) params = params.set('page', filtros.page.toString());
    if (filtros?.pageSize) params = params.set('pageSize', filtros.pageSize.toString());
    return this.http.get<PaginatedResponse<Mascota>>(this.apiUrl, { params });
  }

  listarPorPaciente(pacienteID: number): Observable<PaginatedResponse<Mascota>> {
    return this.listar({ pacienteID, pageSize: 100 });
  }

  obtener(id: number): Observable<Mascota> {
    return this.http.get<Mascota>(`${this.apiUrl}/${id}`);
  }

  crear(data: Partial<Mascota>): Observable<Mascota> {
    return this.http.post<Mascota>(this.apiUrl, data);
  }

  actualizar(id: number, data: Partial<Mascota>): Observable<Mascota> {
    return this.http.put<Mascota>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  agregarCoTutor(mascotaId: number, pacienteID: number): Observable<Mascota> {
    return this.http.post<Mascota>(`${this.apiUrl}/${mascotaId}/co-tutores`, { pacienteID });
  }

  quitarCoTutor(mascotaId: number, pacienteID: number): Observable<Mascota> {
    return this.http.delete<Mascota>(`${this.apiUrl}/${mascotaId}/co-tutores/${pacienteID}`);
  }

  getHistorialClinico(mascotaID: number): Observable<{
    mascota: Mascota;
    ficha: { id: number; notas: string | null; extra: Record<string, unknown> | null; createdAt: string } | null;
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
    filesCount: number;
    vacunas: HistorialClinicoVacunaItem[];
    files: HistorialClinicoFileItem[];
  }> {
    return this.http.get(`${this.apiUrl}/${mascotaID}/historial-clinico`) as Observable<{
      mascota: Mascota;
      ficha: { id: number; notas: string | null; extra: Record<string, unknown> | null; createdAt: string } | null;
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
      filesCount: number;
      vacunas: HistorialClinicoVacunaItem[];
      files: HistorialClinicoFileItem[];
    }>;
  }
}
