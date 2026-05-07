import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner';
import {
  AgendaCalendarComponent,
  type AgendaCalendarEvent
} from '../agenda-calendar/agenda-calendar';
import { TurnosService, type Turno } from '../../../services/turnos.service';
import { ServiciosService, type Servicio } from '../../../services/servicios.service';
import { ProfesionalesService, type Profesional } from '../../../services/profesionales.service';
import { TurnoCrearModalComponent } from '../turno-crear-modal/turno-crear-modal';
import { TurnoEditarModalComponent } from '../turno-editar-modal/turno-editar-modal';
import { firstValueFrom } from 'rxjs';

export interface TurnoAgendaModalData {
  /**
   * Solo muestra turnos de este tutor (p. ej. chat). Si no se envía, se ven todos los turnos de la semana.
   */
  filtrarPorTutorId?: number;
  /** Precarga tutor al crear desde una celda (ficha del tutor). */
  tutorID?: number;
  /** Precarga mascota al crear desde una celda. */
  mascotaID?: number | null;
}

@Component({
  selector: 'app-turno-agenda-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    LoadingSpinnerComponent,
    AgendaCalendarComponent
  ],
  templateUrl: './turno-agenda-modal.html',
  styleUrl: './turno-agenda-modal.scss'
})
export class TurnoAgendaModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<TurnoAgendaModalComponent>);
  private data = inject<TurnoAgendaModalData>(MAT_DIALOG_DATA);
  private turnosService = inject(TurnosService);
  private serviciosService = inject(ServiciosService);
  private profesionalesService = inject(ProfesionalesService);
  private dialog = inject(MatDialog);

  // Estado
  loading = signal(false);
  error = signal<string | null>(null);

  // Datos base
  private turnosOriginales = signal<Turno[]>([]);
  servicios = signal<Servicio[]>([]);
  profesionales = signal<Profesional[]>([]);

  // Vista de calendario
  calendarViewDate = signal<Date>(new Date());

  calendarWeekLabel = computed(() => {
    const start = this.startOfWeek(this.calendarViewDate(), 1);
    const end = this.addDays(start, 6);

    const dayFmt = new Intl.DateTimeFormat('es-AR', { day: 'numeric' });
    const monthFmt = new Intl.DateTimeFormat('es-AR', { month: 'short' });
    const yearFmt = new Intl.DateTimeFormat('es-AR', { year: 'numeric' });

    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

    const startPart = `${dayFmt.format(start)} ${this.capitalize(monthFmt.format(start))}`;
    const endPart = `${dayFmt.format(end)} ${this.capitalize(monthFmt.format(end))}`;

    if (sameMonth) {
      return `${dayFmt.format(start)}–${dayFmt.format(end)} ${this.capitalize(monthFmt.format(start))} ${yearFmt.format(start)}`;
    }

    return `${startPart} – ${endPart} ${yearFmt.format(start)}`;
  });

  calendarEvents = computed<AgendaCalendarEvent[]>(() => {
    const all = this.turnosOriginales();
    const soloTutor = this.data.filtrarPorTutorId;

    const filtered = all.filter(t => {
      if (t.estado === 'BAJA') return false;
      if (soloTutor != null && t.pacienteID !== soloTutor) return false;
      return true;
    });

    return filtered
      .map<AgendaCalendarEvent | null>((t) => {
        const start = new Date(t.horaInicio.replace('Z', ''));
        start.setHours(start.getHours() - 3);
        const end = new Date(t.horaFin.replace('Z', ''));
        end.setHours(end.getHours() - 3);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

        const servicioLabel = t.servicio?.nombre ?? 'Servicio';
        const profesionalLabel = t.profesional?.nombre ? ` · ${t.profesional.nombre}` : '';

        const paciente = t.paciente;
        let pacienteLabel = '';
        if (t.estado === 'RESERVADO' || t.estado === 'COMPLETADO') {
          if (paciente) {
            pacienteLabel = paciente.nombre;
          } else {
            pacienteLabel = 'Reservado';
          }
        } else if (t.estado === 'PENDIENTE') {
          pacienteLabel = 'Pendiente';
        } else if (t.estado === 'CANCELADO') {
          pacienteLabel = 'Cancelado';
        } else {
          pacienteLabel = 'Reservado';
        }

        let status: AgendaCalendarEvent['status'] = 'RESERVADO';
        if (t.estado === 'RESERVADO' || t.estado === 'COMPLETADO') {
          status = 'RESERVADO';
        } else if (t.estado === 'PENDIENTE') {
          status = 'PENDIENTE';
        } else if (t.estado === 'CANCELADO') {
          status = 'CANCELADO';
        }

        return {
          id: t.id,
          title: `${servicioLabel}${profesionalLabel} — ${pacienteLabel}`,
          start,
          end,
          status,
          color: t.servicio?.color || '#1976d2',
          paciente: t.paciente ? {
            nombre: t.paciente.nombre,
            dni: t.paciente.dni,
            telefono: t.paciente.telefono,
            email: t.paciente.email
          } : undefined,
          profesional: t.profesional ? {
            nombre: t.profesional.nombre,
            telefono: t.profesional.telefono,
            email: t.profesional.email
          } : undefined,
          servicio: t.servicio ? {
            nombre: t.servicio.nombre,
            codigo: t.servicio.codigo
          } : undefined,
          precio: t.precio,
          notas: t.notas
        };
      })
      .filter((x): x is AgendaCalendarEvent => x !== null);
  });

  async ngOnInit(): Promise<void> {
    await this.loadFiltros();
    await this.loadTurnosForCurrentWeek();
  }

  close(): void {
    this.dialogRef.close();
  }

  prevWeek(): void {
    this.calendarViewDate.set(this.addDays(this.calendarViewDate(), -7));
    this.loadTurnosForCurrentWeek();
  }

  nextWeek(): void {
    this.calendarViewDate.set(this.addDays(this.calendarViewDate(), 7));
    this.loadTurnosForCurrentWeek();
  }

  today(): void {
    this.calendarViewDate.set(new Date());
    this.loadTurnosForCurrentWeek();
  }

  async onCalendarEventClick(ev: AgendaCalendarEvent): Promise<void> {
    const id = typeof ev.id === 'string' ? Number(ev.id) : ev.id;

    try {
      const turno = await firstValueFrom(this.turnosService.obtener(id));
      if (turno) {
        const dialogRef = this.dialog.open(TurnoEditarModalComponent, {
          width: '900px',
          maxWidth: '95vw',
          data: { turno }
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.loadTurnosForCurrentWeek();
          }
        });
      }
    } catch (error) {
      console.error('Error obteniendo turno:', error);
      this.error.set('Error al cargar el turno para editar');
    }
  }

  onCalendarCellClick(day: Date, hour: number, minute: number): void {
    const fechaHora = new Date(day);
    fechaHora.setHours(hour, minute, 0, 0);

    const preTutor = this.data.tutorID ?? this.data.filtrarPorTutorId;
    const crearData: {
      fechaHoraInicial: Date;
      pacienteID?: number;
      mascotaID?: number | null;
    } = { fechaHoraInicial: fechaHora };
    if (preTutor != null) crearData.pacienteID = preTutor;
    if (this.data.mascotaID !== undefined) crearData.mascotaID = this.data.mascotaID;

    const dialogRef = this.dialog.open(TurnoCrearModalComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: crearData
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadTurnosForCurrentWeek();
      }
    });
  }

  private async loadTurnosForCurrentWeek(): Promise<void> {
    const { fechaInicio, fechaFin } = this.getWeekRangeQuery(this.calendarViewDate());
    this.loading.set(true);
    this.error.set(null);

    const filtros: any = {
      fechaInicio,
      fechaFin
    };

    try {
      const data = await firstValueFrom(this.turnosService.listar(filtros));
      this.turnosOriginales.set(data);
    } catch (err: any) {
      const msg = err?.error?.error || err?.message || 'Error al listar turnos';
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadFiltros(): Promise<void> {
    try {
      const [serviciosResponse, profesionalesResponse] = await Promise.all([
        firstValueFrom(this.serviciosService.listar({ estado: 'ACTIVO', page: 1, pageSize: 1000 })),
        firstValueFrom(this.profesionalesService.listar({ estado: 'ACTIVO', page: 1, pageSize: 1000 }))
      ]);

      this.servicios.set(serviciosResponse.data);
      this.profesionales.set(profesionalesResponse.data);
    } catch (error) {
      console.error('Error cargando filtros para la agenda:', error);
    }
  }

  private getWeekRangeQuery(viewDate: Date): { fechaInicio: string; fechaFin: string } {
    const start = this.startOfWeek(viewDate, 1);
    start.setHours(0, 0, 0, 0);
    const end = this.addDays(start, 6);
    end.setHours(23, 59, 59, 999);
    return { fechaInicio: start.toISOString(), fechaFin: end.toISOString() };
  }

  private startOfWeek(date: Date, weekStartsOn: number): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = (day - weekStartsOn + 7) % 7;
    d.setDate(d.getDate() - diff);
    return d;
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  private capitalize(s: string): string {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

