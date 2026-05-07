import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type TipoEventoAgenda = 'TRASLADO' | 'ENVIO_MUESTRAS' | 'CADETERIA';

export interface EventoAgenda {
  id: number;
  tipo: TipoEventoAgenda;
  profesionalID: number;
  horaInicio: string;
  horaFin: string;
  notas?: string | null;
  profesional?: { id: number; nombre: string; color?: string };
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventosAgendaService {
  private apiUrl = `${environment.apiUrl}/eventos-agenda`;

  constructor(private http: HttpClient) {}

  listar(filtros?: {
    profesionalID?: number;
    fechaInicio?: string;
    fechaFin?: string;
  }): Observable<EventoAgenda[]> {
    let params = new HttpParams();
    if (filtros?.profesionalID) params = params.set('profesionalID', filtros.profesionalID.toString());
    if (filtros?.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    return this.http.get<EventoAgenda[]>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<EventoAgenda> {
    return this.http.get<EventoAgenda>(`${this.apiUrl}/${id}`);
  }

  crear(data: Partial<EventoAgenda>): Observable<EventoAgenda> {
    return this.http.post<EventoAgenda>(this.apiUrl, data);
  }

  actualizar(id: number, data: Partial<EventoAgenda>): Observable<EventoAgenda> {
    return this.http.put<EventoAgenda>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
