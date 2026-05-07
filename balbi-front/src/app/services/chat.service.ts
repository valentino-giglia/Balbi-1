import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Paciente } from './pacientes.service';

export type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT';

export interface Mensaje {
  id: string;
  type: MessageType;
  timestamp?: string;
  direction: 'inbound' | 'outbound' | 'unknown';
  status?: string;
  text?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
  documentUrl?: string | null;
  transcript?: string | null;
  from?: string;
  to?: string;
}

export interface PacientesConChatResponse {
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  data: Paciente[];
}

export interface MensajesResponse {
  data: Mensaje[];
  paging: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chat`;

  constructor(private http: HttpClient) {}

  listarPacientesConChat(
    page: number = 1,
    pageSize: number = 10,
    filtros?: { snDerivado?: boolean }
  ): Observable<PacientesConChatResponse> {
    let params = new HttpParams();
    params = params.set('page', page.toString());
    params = params.set('limit', pageSize.toString());

    if (filtros?.snDerivado !== undefined) {
      params = params.set('sn_derivado', filtros.snDerivado ? 'true' : 'false');
    }

    return this.http.get<PacientesConChatResponse>(`${this.apiUrl}/pacientes`, { params });
  }

  listarMensajes(phoneNumberId: string, conversationId: string, after?: string, limit: number = 20): Observable<MensajesResponse> {
    let params = new HttpParams();
    params = params.set('phone_number_id', phoneNumberId);
    params = params.set('conversation_id', conversationId);
    params = params.set('limit', limit.toString());
    if (after) {
      params = params.set('after', after);
    }
    return this.http.get<MensajesResponse>(`${this.apiUrl}/mensajes`, { params });
  }

  enviarMensaje(phoneNumberId: string, to: string, text: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/mensajes`, {
      phone_number_id: phoneNumberId,
      to: to,
      text: text
    });
  }
}
