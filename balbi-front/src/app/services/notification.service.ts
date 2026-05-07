import { Injectable, inject, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TurnoPendientePayload {
  id: number;
  estado?: string;
  horaInicio?: string;
  paciente?: { nombre?: string };
  servicio?: { nombre?: string };
  profesional?: { nombre?: string };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  /** Emite el pacienteID cuando llega un mensaje nuevo en ese chat (vía webhook o envío). */
  readonly chatNuevoMensaje$ = new Subject<number>();

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    const wsUrl = environment.wsUrl;
    if (!wsUrl) return;
    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.onmessage = (event) => this.ngZone.run(() => this.handleMessage(event));
      this.ws.onclose = () => this.scheduleReconnect();
      this.ws.onerror = () => {};
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const msg = JSON.parse(event.data as string);
      if (msg.type === 'turno-pendiente' && msg.data) {
        this.showTurnoPendienteNotification(msg.data as TurnoPendientePayload);
      } else if (msg.type === 'chat-nuevo-mensaje' && msg.data?.pacienteID) {
        this.chatNuevoMensaje$.next(msg.data.pacienteID);
      }
    } catch {
      // ignorar mensajes que no sean JSON válido
    }
  }

  private showTurnoPendienteNotification(turno: TurnoPendientePayload): void {
    const tutorNombre = turno.paciente?.nombre ?? 'Sin tutor';
    const servicio = turno.servicio?.nombre ?? '';
    const text = servicio ? `Turno pendiente: ${tutorNombre} - ${servicio}` : `Turno pendiente: ${tutorNombre}`;
    const ref = this.snackBar.open(text, 'Ver', {
      duration: 8000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
    ref.onAction().subscribe(() => {
      this.router.navigate(['/turnos-pendientes']);
    });
  }

  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

