import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Ficha {
  id: number;
  pacienteID: number;
  mascotaID?: number | null;
  notas: string | null;
  extra: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  paciente?: { id: number; nombre?: string; email?: string; telefono?: string };
  mascota?: { id: number; nombre?: string };
}

@Injectable({
  providedIn: 'root'
})
export class FichasService {
  private apiUrl = `${environment.apiUrl}/fichas`;

  constructor(private http: HttpClient) {}

  listar(filtros?: { pacienteID?: number; mascotaID?: number }): Observable<Ficha[]> {
    let params = new HttpParams();
    if (filtros?.pacienteID != null) params = params.set('pacienteID', filtros.pacienteID.toString());
    if (filtros?.mascotaID != null) params = params.set('mascotaID', filtros.mascotaID.toString());
    return this.http.get<Ficha[]>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<Ficha> {
    return this.http.get<Ficha>(`${this.apiUrl}/${id}`);
  }

  crear(data: { pacienteID?: number; mascotaID?: number; notas?: string | null; extra?: Record<string, unknown> | null }): Observable<Ficha> {
    return this.http.post<Ficha>(this.apiUrl, data);
  }

  actualizar(id: number, data: { notas?: string | null; extra?: Record<string, unknown> | null; pacienteID?: number; mascotaID?: number }): Observable<Ficha> {
    return this.http.put<Ficha>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
