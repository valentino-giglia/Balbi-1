import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Horario {
  id?: number;
  profesionalID: number;
  diaSemana: string;
  horaInicio: string; // TIME format: "HH:MM:SS" or "HH:MM"
  horaFin: string; // TIME format: "HH:MM:SS" or "HH:MM"
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HorariosService {
  private apiUrl = `${environment.apiUrl}/horarios`;

  constructor(private http: HttpClient) {}

  listar(profesionalID?: number): Observable<Horario[]> {
    let params = new HttpParams();
    if (profesionalID) {
      params = params.set('profesionalID', profesionalID.toString());
    }
    return this.http.get<Horario[]>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<Horario> {
    return this.http.get<Horario>(`${this.apiUrl}/${id}`);
  }

  crear(data: Horario): Observable<Horario> {
    return this.http.post<Horario>(this.apiUrl, data);
  }

  crearMasivo(profesionalID: number, horarios: Omit<Horario, 'id' | 'profesionalID' | 'createdAt' | 'updatedAt'>[]): Observable<Horario[]> {
    return this.http.post<Horario[]>(`${this.apiUrl}/masivo`, {
      profesionalID,
      horarios
    });
  }

  actualizar(id: number, data: Partial<Horario>): Observable<Horario> {
    return this.http.put<Horario>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  eliminarPorProfesional(profesionalID: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/profesional/${profesionalID}`);
  }
}
