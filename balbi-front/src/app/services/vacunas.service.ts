import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Vacuna {
  id: number;
  mascotaID: number;
  nombre: string;
  fechaAplicacion: string;
  proximaDosis?: string | null;
  notas?: string | null;
  mascota?: { id: number; nombre: string };
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VacunasService {
  private apiUrl = `${environment.apiUrl}/vacunas`;

  constructor(private http: HttpClient) {}

  listarPorMascota(mascotaID: number): Observable<Vacuna[]> {
    return this.http.get<Vacuna[]>(this.apiUrl, {
      params: new HttpParams().set('mascotaID', mascotaID.toString())
    });
  }

  /** Listar todas las vacunas (opcionalmente filtradas por mascotaID) */
  listar(filtros?: { mascotaID?: number }): Observable<Vacuna[]> {
    let params = new HttpParams();
    if (filtros?.mascotaID != null) {
      params = params.set('mascotaID', filtros.mascotaID.toString());
    }
    return this.http.get<Vacuna[]>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<Vacuna> {
    return this.http.get<Vacuna>(`${this.apiUrl}/${id}`);
  }

  crear(data: Partial<Vacuna>): Observable<Vacuna> {
    return this.http.post<Vacuna>(this.apiUrl, data);
  }

  actualizar(id: number, data: Partial<Vacuna>): Observable<Vacuna> {
    return this.http.put<Vacuna>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
