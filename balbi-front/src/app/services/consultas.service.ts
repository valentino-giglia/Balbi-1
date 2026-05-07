import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Consulta {
  id: number;
  nota: string | null;
  extra: Record<string, unknown> | null;
  motivoConsulta?: string | null;
  examenClinico?: string | null;
  diagnostico?: string | null;
  planTratamiento?: string | null;
  pesoKg?: number | string | null;
  createdAt?: string;
  updatedAt?: string;
  turno?: unknown;
}

export type ConsultaPayload = {
  nota?: string | null;
  extra?: Record<string, unknown> | null;
  motivoConsulta?: string | null;
  examenClinico?: string | null;
  diagnostico?: string | null;
  planTratamiento?: string | null;
  pesoKg?: number | null;
};

@Injectable({
  providedIn: 'root'
})
export class ConsultasService {
  private apiUrl = `${environment.apiUrl}/consultas`;

  constructor(private http: HttpClient) {}

  listar(filtros?: { turnoID?: number }): Observable<Consulta[]> {
    let params = new HttpParams();
    if (filtros?.turnoID != null) params = params.set('turnoID', filtros.turnoID.toString());
    return this.http.get<Consulta[]>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<Consulta> {
    return this.http.get<Consulta>(`${this.apiUrl}/${id}`);
  }

  crear(data: ConsultaPayload & { turnoID?: number }): Observable<Consulta> {
    return this.http.post<Consulta>(this.apiUrl, data);
  }

  actualizar(id: number, data: ConsultaPayload): Observable<Consulta> {
    return this.http.put<Consulta>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
