import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BloqueoAgenda {
  id: number;
  profesionalID: number;
  horaInicio: string;
  horaFin: string;
  profesional?: { id: number; nombre: string; color?: string };
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BloqueosAgendaService {
  private apiUrl = `${environment.apiUrl}/bloqueos-agenda`;

  constructor(private http: HttpClient) {}

  listar(filtros?: {
    profesionalID?: number;
    fechaInicio?: string;
    fechaFin?: string;
  }): Observable<BloqueoAgenda[]> {
    let params = new HttpParams();
    if (filtros?.profesionalID) params = params.set('profesionalID', filtros.profesionalID.toString());
    if (filtros?.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    return this.http.get<BloqueoAgenda[]>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<BloqueoAgenda> {
    return this.http.get<BloqueoAgenda>(`${this.apiUrl}/${id}`);
  }

  crear(data: Partial<BloqueoAgenda>): Observable<BloqueoAgenda> {
    return this.http.post<BloqueoAgenda>(this.apiUrl, data);
  }

  actualizar(id: number, data: Partial<BloqueoAgenda>): Observable<BloqueoAgenda> {
    return this.http.put<BloqueoAgenda>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
