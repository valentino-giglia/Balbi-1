import { Component, OnInit, OnDestroy, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule, MatChipListboxChange } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { LoadingSpinnerComponent } from '../../../components/shared/loading-spinner/loading-spinner';
import { ChatMessagesComponent } from '../../../components/shared/chat-messages/chat-messages';
import { ChatService } from '../../../services/chat.service';
import { PacientesService } from '../../../services/pacientes.service';
import { Paciente } from '../../../services/pacientes.service';
import { TurnosService, Turno } from '../../../services/turnos.service';
import { ConfirmDialogComponent } from '../../../components/shared/confirm-dialog/confirm-dialog';
import { TurnoAgendaModalComponent, TurnoAgendaModalData } from '../../../components/shared/turno-agenda-modal/turno-agenda-modal';
import { NotificationService } from '../../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-detalle',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule,
    LoadingSpinnerComponent,
    ChatMessagesComponent
  ],
  templateUrl: './chat-detalle.html',
  styleUrl: './chat-detalle.scss'
})
export class ChatDetalleComponent implements OnInit, OnDestroy {
  @ViewChild(ChatMessagesComponent) chatMessagesRef?: ChatMessagesComponent;
  // Tutor del chat actual
  tutor = signal<Paciente | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  turnosPendientes = signal<Turno[]>([]);
  loadingTurnos = signal(false);
  loadingDerivacion = signal(false);
  menuAbierto = signal(false);

  // Tutores con chat (sidebar)
  tutores = signal<Paciente[]>([]);
  loadingTutores = signal(false);
  errorTutores = signal<string | null>(null);

  filtroDerivados = signal<'todos' | 'derivados'>('todos');

  private chatNuevoMensajeSub?: Subscription;

  constructor(
    private chatService: ChatService,
    private pacientesService: PacientesService,
    private turnosService: TurnosService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadTutoresConChat();

    const routeTutorId = this.route.snapshot.params['id'];
    if (routeTutorId) {
      this.loadTutorById(Number(routeTutorId));
    } else {
      this.error.set('ID del tutor no proporcionado');
    }

    // Suscribirse a nuevos mensajes vía WebSocket para refrescar el chat actual
    this.chatNuevoMensajeSub = this.notificationService.chatNuevoMensaje$.subscribe((tutorChatId) => {
      if (this.tutor()?.id === tutorChatId) {
        setTimeout(() => this.chatMessagesRef?.refreshMensajes(true), 0);
      }
    });
  }

  ngOnDestroy(): void {
    this.chatNuevoMensajeSub?.unsubscribe();
  }

  loadTutorById(tutorId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.pacientesService.obtener(tutorId).subscribe({
      next: (t) => {
        this.tutor.set(t);
        this.loadTurnosPendientes(t.id);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al cargar tutor');
        this.loading.set(false);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Sidebar: tutores con chat (filtro derivados)
  // ---------------------------------------------------------------------------

  onFiltroDerivadosChange(event: MatChipListboxChange): void {
    const value = event.value as 'todos' | 'derivados';
    if (value === 'todos' || value === 'derivados') {
      this.filtroDerivados.set(value);
      this.loadTutoresConChat(1);
    }
  }

  loadTutoresConChat(page: number = 1): void {
    this.loadingTutores.set(true);
    this.errorTutores.set(null);

    const snDerivado = this.filtroDerivados() === 'derivados' ? true : undefined;

    this.chatService
      .listarPacientesConChat(page, 50, snDerivado !== undefined ? { snDerivado } : undefined)
      .subscribe({
        next: (response) => {
          this.tutores.set(response.data);
          this.loadingTutores.set(false);
        },
        error: (err) => {
          this.errorTutores.set(err.error?.error || 'Error al cargar conversaciones');
          this.loadingTutores.set(false);
        }
      });
  }

  abrirChatDesdeSidebar(row: Paciente): void {
    this.router.navigate(['/chat/detalle', row.id]);
  }

  loadTurnosPendientes(tutorId: number): void {
    this.loadingTurnos.set(true);
    this.turnosService.listar({ estado: 'PENDIENTE', pacienteID: tutorId }).subscribe({
      next: (turnos: Turno[]) => {
        const delTutor = turnos.filter(t => t.pacienteID === tutorId && t.paciente);
        this.turnosPendientes.set(delTutor);
        this.loadingTurnos.set(false);
      },
      error: () => {
        this.loadingTurnos.set(false);
        this.turnosPendientes.set([]);
      }
    });
  }

  formatFechaHora(fecha: string): string {
    const date = new Date(fecha);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  confirmarTurno(turno: Turno): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Turno',
        message: `¿Confirmar el turno para ${this.formatFechaHora(turno.horaInicio)}?`,
        confirmText: 'Confirmar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingTurnos.set(true);
        // Cambiar estado de PENDIENTE a RESERVADO
        this.turnosService.actualizar(turno.id, { estado: 'RESERVADO' }).subscribe({
          next: () => {
            if (this.tutor()) {
              this.loadTurnosPendientes(this.tutor()!.id);
            }
          },
          error: () => this.loadingTurnos.set(false)
        });
      }
    });
  }

  cancelarTurno(turno: Turno): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancelar Turno',
        message: `¿Cancelar el turno para ${this.formatFechaHora(turno.horaInicio)}?`,
        confirmText: 'Cancelar',
        cancelText: 'No'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadingTurnos.set(true);
        // Usar el método cancelar del servicio
        this.turnosService.cancelar(turno.id).subscribe({
          next: () => {
            if (this.tutor()) {
              this.loadTurnosPendientes(this.tutor()!.id);
            }
          },
          error: () => this.loadingTurnos.set(false)
        });
      }
    });
  }

  abrirAgendaTurnos(): void {
    const data: TurnoAgendaModalData = {};
    if (this.tutor()) {
      data.filtrarPorTutorId = this.tutor()!.id;
    }

    this.dialog.open(TurnoAgendaModalComponent, {
      width: '90vw',
      maxWidth: '90vw',
      height: '90vh',
      panelClass: 'full-screen-dialog',
      data
    });
  }

  volver(): void {
    this.router.navigate(['/chat']);
  }

  irATutorTurnos(): void {
    const id = this.tutor()?.id;
    if (id) {
      this.router.navigate(['/pacientes', id, 'turnos']);
    }
  }

  toggleDerivacion(): void {
    const p = this.tutor();
    if (!p?.id) return;

    const nuevoSnDerivado = !p.sn_derivado;
    this.loadingDerivacion.set(true);

    this.pacientesService.actualizar(p.id, { sn_derivado: nuevoSnDerivado }).subscribe({
      next: (actualizado) => {
        this.tutor.set(actualizado);
        this.loadTutoresConChat();
        this.loadingDerivacion.set(false);
      },
      error: () => {
        this.loadingDerivacion.set(false);
      }
    });
  }

  toggleKapsoAgentStatus(event: any): void {
    if (!this.tutor()) return;
    
    const nuevoStatus = this.tutor()!.kapso_agent_status === 'ON' ? 'OFF' : 'ON';
    this.pacientesService.actualizar(this.tutor()!.id, { kapso_agent_status: nuevoStatus }).subscribe({
      next: (actualizado) => {
        this.tutor.set(actualizado);
      },
      error: () => {
        if (this.tutor()) {
          this.loadTutorById(this.tutor()!.id);
        }
      }
    });
  }

  onMessageSent(): void {
    const p = this.tutor();
    if (p) {
      this.tutor.set({ ...p, kapso_agent_status: 'OFF' });
    }
  }

  getWhatsAppLink(telefono: string | null | undefined): string {
    if (!telefono) return '#';
    const digits = telefono.replace(/\D/g, '');
    return digits ? `https://wa.me/${digits}` : '#';
  }
}

