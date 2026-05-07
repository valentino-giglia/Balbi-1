import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from '../shared/interfaces/pagination.interface';

export interface FileItem {
  id: number;
  pacienteID: number;
  mascotaID?: number | null;
  turnoID?: number | null;
  tipoArchivo?: string | null;
  url: string | null;
  nombreArchivo: string | null;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilesService {
  private apiUrl = `${environment.apiUrl}/files`;

  constructor(private http: HttpClient) {}

  listar(filtros: { pacienteID?: number; mascotaID?: number; turnoID?: number; page?: number; pageSize?: number }): Observable<PaginatedResponse<FileItem>> {
    const page = filtros.page ?? 1;
    const pageSize = filtros.pageSize ?? 12;
    let params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    if (filtros.pacienteID != null) params = params.set('pacienteID', filtros.pacienteID.toString());
    if (filtros.mascotaID != null) params = params.set('mascotaID', filtros.mascotaID.toString());
    if (filtros.turnoID != null) params = params.set('turnoID', filtros.turnoID.toString());
    return this.http.get<PaginatedResponse<FileItem>>(this.apiUrl, { params });
  }

  subir(data: { pacienteID: number; mascotaID?: number | null; turnoID?: number | null; file: File; tipoArchivo?: string | null }): Observable<FileItem> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('pacienteID', data.pacienteID.toString());
    if (data.mascotaID != null) formData.append('mascotaID', data.mascotaID.toString());
    if (data.turnoID != null) formData.append('turnoID', data.turnoID.toString());
    if (data.tipoArchivo != null && data.tipoArchivo !== '') formData.append('tipoArchivo', data.tipoArchivo);
    return this.http.post<FileItem>(this.apiUrl, formData);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
