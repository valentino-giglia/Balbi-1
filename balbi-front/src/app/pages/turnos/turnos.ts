import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LoadingSpinnerComponent } from '../../components/shared/loading-spinner/loading-spinner';
import {
  AgendaCalendarComponent,
  type AgendaCalendarEvent
} from '../../components/shared/agenda-calendar/agenda-calendar';
import { TurnosService, Turno } from '../../services/turnos.service';
import { ServiciosService, type Servicio } from '../../services/servicios.service';
import { ProfesionalesService, type Profesional } from '../../services/profesionales.service';
import { TurnoCrearModalComponent } from '../../components/shared/turno-crear-modal/turno-crear-modal';
import { TurnoEditarModalComponent } from '../../components/shared/turno-editar-modal/turno-editar-modal';
import { firstValueFrom } from 'rxjs';
import { AgendaTipoSelectorDialogComponent, type AgendaTipoSeleccion } from '../../components/shared/agenda-tipo-selector-dialog/agenda-tipo-selector-dialog';
import { EventoAgendaCrearModalComponent } from '../../components/shared/evento-agenda-crear-modal/evento-agenda-crear-modal';
import { EventoAgendaEditarModalComponent } from '../../components/shared/evento-agenda-editar-modal/evento-agenda-editar-modal';
import { BloqueoAgendaCrearModalComponent } from '../../components/shared/bloqueo-agenda-crear-modal/bloqueo-agenda-crear-modal';
import { BloqueoAgendaEditarModalComponent } from '../../components/shared/bloqueo-agenda-editar-modal/bloqueo-agenda-editar-modal';
import { BloqueosAgendaService, type BloqueoAgenda } from '../../services/bloqueos-agenda.service';
import { EventosAgendaService, type EventoAgenda } from '../../services/eventos-agenda.service';
import { TurnosCalendarExpandModalComponent } from '../../components/shared/turnos-calendar-expand-modal/turnos-calendar-expand-modal';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { HorariosService, type Horario } from '../../services/horarios.service';

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatTooltipModule,
    MatMenuModule,
    LoadingSpinnerComponent,
    AgendaCalendarComponent
  ],
  templateUrl: './turnos.html',
  styleUrl: './turnos.scss'
})
export class TurnosComponent implements OnInit {
  private turnosOriginales = signal<Turno[]>([]);
  private bloqueosOriginales = signal<BloqueoAgenda[]>([]);
  private eventosOriginales = signal<EventoAgenda[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  private fetchSub: Subscription | null = null;

  // Filtros
  servicios = signal<Servicio[]>([]);
  profesionales = signal<Profesional[]>([]);
  
  loadingFiltros = signal(false);
  
  // Selecciones de filtros
  selectedServicioIds = signal<Set<number>>(new Set());
  selectedProfesionalIds = signal<Set<number>>(new Set());
  
  // Estado de expansión de los dropdowns (servicios desplegado por defecto)
  serviciosExpanded = signal<boolean>(true);
  profesionalesExpanded = signal<boolean>(false);
  
  // Estado de visibilidad del panel de filtros (oculto por defecto)
  filtersVisible = signal<boolean>(false);

  /** Profesional seleccionado para ver horarios en el calendario (null = ninguno) */
  horariosProfesionalSelected = signal<number | null>(null);
  /** Horarios del profesional seleccionado (lista desde API) */
  horariosDelProfesional = signal<Horario[]>([]);
  /** Cargando horarios del profesional seleccionado */
  horariosLoading = signal<boolean>(false);

  private horariosService = inject(HorariosService);

  /** Vista actual del calendario (navegable por semanas) */
  calendarViewDate = signal<Date>(new Date());

  calendarWeekLabel = computed(() => {
    const start = this.startOfWeek(this.calendarViewDate(), 1);
    const end = this.addDays(start, 6);

    const dayFmt = new Intl.DateTimeFormat('es-AR', { day: 'numeric' });
    const monthFmt = new Intl.DateTimeFormat('es-AR', { month: 'short' });
    const yearFmt = new Intl.DateTimeFormat('es-AR', { year: 'numeric' });

    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    const sameYear = start.getFullYear() === end.getFullYear();

    const startPart = `${dayFmt.format(start)} ${this.capitalize(monthFmt.format(start))}`;
    const endPart = `${dayFmt.format(end)} ${this.capitalize(monthFmt.format(end))}`;

    if (sameMonth) return `${dayFmt.format(start)}–${dayFmt.format(end)} ${this.capitalize(monthFmt.format(start))} ${yearFmt.format(start)}`;
    if (sameYear) return `${startPart} – ${endPart} ${yearFmt.format(start)}`;
    return `${startPart} ${yearFmt.format(start)} – ${endPart} ${yearFmt.format(end)}`;
  });

  /** Rangos de disponibilidad por día (yyyy-mm-dd) para la semana visible, desde horarios del profesional. */
  availabilityRangesByDay = computed<Record<string, Array<{ startMin: number; endMin: number }>>>(() => {
    const horarios = this.horariosDelProfesional();
    if (!horarios.length) return {};
    const start = this.startOfWeek(this.calendarViewDate(), 1);
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const result: Record<string, Array<{ startMin: number; endMin: number }>> = {};
    for (let i = 0; i < 7; i++) {
      const day = this.addDays(start, i);
      const key = this.dayKey(day);
      const diaNombre = diasSemana[day.getDay()];
      const ranges = horarios
        .filter((h) => h.diaSemana === diaNombre)
        .map((h) => ({
          startMin: this.horaToMinutes(h.horaInicio),
          endMin: this.horaToMinutes(h.horaFin)
        }));
      if (ranges.length) result[key] = ranges;
    }
    return result;
  });

  /** Nombre del profesional seleccionado para tooltip en celdas disponibles (o null). */
  availabilityTooltipLabel = computed<string | null>(() => {
    const id = this.horariosProfesionalSelected();
    if (id == null) return null;
    const p = this.profesionales().find((x) => x.id === id);
    return p?.nombre ?? null;
  });

  /** Líneas de horarios del profesional (un día por línea) para mostrar en UI. */
  horariosLineas = computed<string[]>(() => {
    const horarios = this.horariosDelProfesional();
    if (!horarios.length) return [];
    const byDay = new Map<string, Array<{ start: string; end: string }>>();
    const order = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    for (const h of horarios) {
      if (!byDay.has(h.diaSemana)) byDay.set(h.diaSemana, []);
      byDay.get(h.diaSemana)!.push({
        start: this.formatHoraShort(h.horaInicio),
        end: this.formatHoraShort(h.horaFin)
      });
    }
    return order
      .filter((d) => byDay.has(d))
      .map((d) => `${d} ${byDay.get(d)!.map((r) => `${r.start}-${r.end}`).join(', ')}`);
  });

  calendarEvents = computed<AgendaCalendarEvent[]>(() => {
    const turnos = this.turnosOriginales();
    const bloqueos = this.bloqueosOriginales();
    const eventos = this.eventosOriginales();
    const selectedServicios = this.selectedServicioIds();
    const selectedProfesionales = this.selectedProfesionalIds();
    
    const selected: AgendaCalendarEvent[] = [];
    
    // Turnos (aplicar filtros)
    const turnosFiltered = turnos.filter(t => {
      if (t.estado === 'BAJA') return false;
      if (selectedServicios.size > 0 && !selectedServicios.has(t.servicioID)) return false;
      if (selectedProfesionales.size > 0 && !selectedProfesionales.has(t.profesionalID)) return false;
      return true;
    });
    
    for (const t of turnosFiltered) {
      const start = new Date(t.horaInicio.replace('Z', ''));
      start.setHours(start.getHours() - 3);
      const end = new Date(t.horaFin.replace('Z', ''));
      end.setHours(end.getHours() - 3);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

      const servicioLabel = t.servicio?.nombre ?? 'Servicio';
      const profesionalLabel = t.profesional?.nombre ? ` · ${t.profesional.nombre}` : '';
      const paciente = t.paciente;
      let pacienteLabel = '';
      if (t.estado === 'RESERVADO' || t.estado === 'COMPLETADO') {
        pacienteLabel = paciente?.nombre ?? 'Reservado';
      } else if (t.estado === 'PENDIENTE') pacienteLabel = 'Pendiente';
      else if (t.estado === 'CANCELADO') pacienteLabel = 'Cancelado';
      else pacienteLabel = 'Reservado';

      let status: AgendaCalendarEvent['status'] = 'RESERVADO';
      if (t.estado === 'PENDIENTE') status = 'PENDIENTE';
      else if (t.estado === 'CANCELADO') status = 'CANCELADO';

      selected.push({
        id: t.id,
        tipo: 'turno',
        title: `${servicioLabel}${profesionalLabel} — ${pacienteLabel}`,
        start,
        end,
        status,
        color: t.servicio?.color || '#1976d2',
        paciente: t.paciente ? { nombre: t.paciente.nombre, dni: t.paciente.dni, telefono: t.paciente.telefono, email: t.paciente.email } : undefined,
        profesional: t.profesional ? { nombre: t.profesional.nombre, telefono: t.profesional.telefono, email: t.profesional.email } : undefined,
        servicio: t.servicio ? { nombre: t.servicio.nombre, codigo: t.servicio.codigo } : undefined,
        precio: t.precio,
        notas: t.notas ?? undefined
      });
    }

    // Bloqueos (aplicar filtro profesional)
    for (const b of bloqueos) {
      if (selectedProfesionales.size > 0 && !selectedProfesionales.has(b.profesionalID)) continue;
      const start = new Date(b.horaInicio.replace('Z', ''));
      start.setHours(start.getHours() - 3);
      const end = new Date(b.horaFin.replace('Z', ''));
      end.setHours(end.getHours() - 3);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;
      const profLabel = b.profesional?.nombre ? ` · ${b.profesional.nombre}` : '';
      selected.push({
        id: `bloqueo-${b.id}`,
        tipo: 'bloqueo',
        bloqueoAgendaId: b.id,
        title: `Bloqueo${profLabel}`,
        start,
        end,
        profesional: b.profesional ? { nombre: b.profesional.nombre } : undefined
      });
    }

    // Eventos de agenda (aplicar filtro profesional)
    const eventoLabels: Record<string, string> = {
      TRASLADO: 'Traslado',
      ENVIO_MUESTRAS: 'Envío de muestras',
      CADETERIA: 'Cadetería'
    };
    const eventoColors: Record<string, string> = {
      TRASLADO: '#2563eb',
      ENVIO_MUESTRAS: '#059669',
      CADETERIA: '#7c3aed'
    };
    for (const e of eventos) {
      if (selectedProfesionales.size > 0 && !selectedProfesionales.has(e.profesionalID)) continue;
      const start = new Date(e.horaInicio.replace('Z', ''));
      start.setHours(start.getHours() - 3);
      const end = new Date(e.horaFin.replace('Z', ''));
      end.setHours(end.getHours() - 3);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;
      const profLabel = e.profesional?.nombre ? ` · ${e.profesional.nombre}` : '';
      selected.push({
        id: `eventoAgenda-${e.id}`,
        tipo: 'evento',
        eventoAgendaId: e.id,
        eventoAgendaTipo: e.tipo,
        title: `${eventoLabels[e.tipo] || e.tipo}${profLabel}`,
        start,
        end,
        color: eventoColors[e.tipo] || '#2563eb',
        profesional: e.profesional ? { nombre: e.profesional.nombre } : undefined,
        notas: e.notas ?? undefined
      });
    }
    
    return selected;
  });

  constructor(
    private turnosService: TurnosService,
    private serviciosService: ServiciosService,
    private profesionalesService: ProfesionalesService,
    private bloqueosAgendaService: BloqueosAgendaService,
    private eventosAgendaService: EventosAgendaService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadFiltros();
    this.loadTurnosForCurrentWeek();
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

  toggleFilters(): void {
    this.filtersVisible.set(!this.filtersVisible());
  }

  openCalendarModal(): void {
    this.dialog.open(TurnosCalendarExpandModalComponent, {
      width: '95vw',
      maxWidth: '1400px',
      height: '90vh',
      panelClass: 'turnos-calendar-expand-panel',
      data: { turnosRef: this }
    });
  }

  onServicioToggle(servicioId: number, checked: boolean): void {
    const current = new Set(this.selectedServicioIds());
    if (checked) {
      current.add(servicioId);
    } else {
      current.delete(servicioId);
    }
    this.selectedServicioIds.set(current);
    // Los filtros se aplican reactivamente en el computed calendarEvents
  }

  onServiciosTodosToggle(checked: boolean): void {
    if (checked) {
      const allIds = new Set(this.servicios().map(s => s.id));
      this.selectedServicioIds.set(allIds);
    } else {
      this.selectedServicioIds.set(new Set());
    }
    // Los filtros se aplican en el computed calendarEvents, no necesitamos recargar
  }

  isServicioSelected(servicioId: number): boolean {
    return this.selectedServicioIds().has(servicioId);
  }

  isTodosServiciosSelected(): boolean {
    const selected = this.selectedServicioIds();
    const allIds = this.servicios().map(s => s.id);
    return allIds.length > 0 && selected.size > 0 && allIds.every(id => selected.has(id));
  }

  isServiciosIndeterminado(): boolean {
    const selected = this.selectedServicioIds();
    const allIds = this.servicios().map(s => s.id);
    return selected.size > 0 && selected.size < allIds.length;
  }

  onProfesionalToggle(profesionalId: number, checked: boolean): void {
    const current = new Set(this.selectedProfesionalIds());
    if (checked) {
      current.add(profesionalId);
    } else {
      current.delete(profesionalId);
    }
    this.selectedProfesionalIds.set(current);
    // Los filtros se aplican en el computed calendarEvents, no necesitamos recargar
  }

  onProfesionalesTodosToggle(checked: boolean): void {
    if (checked) {
      const allIds = new Set(this.profesionales().map(p => p.id));
      this.selectedProfesionalIds.set(allIds);
    } else {
      this.selectedProfesionalIds.set(new Set());
    }
    // Los filtros se aplican en el computed calendarEvents, no necesitamos recargar
  }

  isProfesionalSelected(profesionalId: number): boolean {
    return this.selectedProfesionalIds().has(profesionalId);
  }

  isTodosProfesionalesSelected(): boolean {
    const selected = this.selectedProfesionalIds();
    const allIds = this.profesionales().map(p => p.id);
    return allIds.length > 0 && selected.size > 0 && allIds.every(id => selected.has(id));
  }

  isProfesionalesIndeterminado(): boolean {
    const selected = this.selectedProfesionalIds();
    const allIds = this.profesionales().map(p => p.id);
    return selected.size > 0 && selected.size < allIds.length;
  }

  async onCalendarEventClick(ev: AgendaCalendarEvent): Promise<void> {
    if (ev.tipo === 'evento' && ev.eventoAgendaId != null) {
      try {
        const evento = await firstValueFrom(this.eventosAgendaService.obtener(ev.eventoAgendaId));
        const dialogRef = this.dialog.open(EventoAgendaEditarModalComponent, {
          width: '600px',
          maxWidth: '90vw',
          data: { evento }
        });
        dialogRef.afterClosed().subscribe((result) => {
          if (result) this.loadTurnosForCurrentWeek();
        });
      } catch (err) {
        console.error('Error obteniendo evento:', err);
        this.error.set('Error al cargar el evento');
      }
      return;
    }
    if (ev.tipo === 'bloqueo' && ev.bloqueoAgendaId != null) {
      try {
        const bloqueo = await firstValueFrom(this.bloqueosAgendaService.obtener(ev.bloqueoAgendaId));
        const dialogRef = this.dialog.open(BloqueoAgendaEditarModalComponent, {
          width: '500px',
          maxWidth: '90vw',
          data: { bloqueo }
        });
        dialogRef.afterClosed().subscribe((result) => {
          if (result) this.loadTurnosForCurrentWeek();
        });
      } catch (err) {
        console.error('Error obteniendo bloqueo:', err);
        this.error.set('Error al cargar el bloqueo');
      }
      return;
    }

    // Turno
    const numericId = typeof ev.id === 'number' ? ev.id : Number(ev.id);
    if (Number.isNaN(numericId)) return;
    try {
      const turno = await firstValueFrom(this.turnosService.obtener(numericId));
      if (turno) {
        const dialogRef = this.dialog.open(TurnoEditarModalComponent, {
          width: '800px',
          maxWidth: '90vw',
          data: { turno }
        });
        dialogRef.afterClosed().subscribe((result) => {
          if (result) this.loadTurnosForCurrentWeek();
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

    const dialogRef = this.dialog.open(AgendaTipoSelectorDialogComponent, {
      width: '400px',
      data: {}
    });

    dialogRef.afterClosed().subscribe((tipo: AgendaTipoSeleccion | null) => {
      if (!tipo) return;
      if (tipo === 'turno') {
        const ref = this.dialog.open(TurnoCrearModalComponent, {
          width: '800px',
          maxWidth: '90vw',
          data: { fechaHoraInicial: fechaHora }
        });
        ref.afterClosed().subscribe((result) => { if (result) this.loadTurnosForCurrentWeek(); });
      } else if (tipo === 'evento') {
        const ref = this.dialog.open(EventoAgendaCrearModalComponent, {
          width: '600px',
          maxWidth: '90vw',
          data: { fechaHoraInicial: fechaHora }
        });
        ref.afterClosed().subscribe((result) => { if (result) this.loadTurnosForCurrentWeek(); });
      } else if (tipo === 'bloqueo') {
        const ref = this.dialog.open(BloqueoAgendaCrearModalComponent, {
          width: '500px',
          maxWidth: '90vw',
          data: { fechaHoraInicial: fechaHora }
        });
        ref.afterClosed().subscribe((result) => { if (result) this.loadTurnosForCurrentWeek(); });
      }
    });
  }

  private getWeekRangeQuery(viewDate: Date): { fechaInicio: string; fechaFin: string } {
    const start = this.startOfWeek(viewDate, 1);
    start.setHours(0, 0, 0, 0);
    const end = this.addDays(start, 6);
    end.setHours(23, 59, 59, 999);
    return { fechaInicio: start.toISOString(), fechaFin: end.toISOString() };
  }

  private loadTurnosForCurrentWeek(): void {
    const { fechaInicio, fechaFin } = this.getWeekRangeQuery(this.calendarViewDate());
    this.loading.set(true);
    this.error.set(null);

    this.fetchSub?.unsubscribe();
    
    this.fetchSub = this.turnosService.listar({ fechaInicio, fechaFin }).subscribe({
      next: (turnos) => {
        this.turnosOriginales.set(turnos);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.error || err?.message || 'Error al cargar calendario';
        this.error.set(msg);
        this.loading.set(false);
      }
    });

    this.bloqueosAgendaService.listar({ fechaInicio, fechaFin }).subscribe({
      next: (bloqueos) => this.bloqueosOriginales.set(bloqueos),
      error: () => this.bloqueosOriginales.set([])
    });

    this.eventosAgendaService.listar({ fechaInicio, fechaFin }).subscribe({
      next: (eventos) => this.eventosOriginales.set(eventos),
      error: () => this.eventosOriginales.set([])
    });
  }

  private loadFiltros(): void {
    this.loadingFiltros.set(true);
    
    Promise.all([
      firstValueFrom(this.serviciosService.listar({ estado: 'ACTIVO', page: 1, pageSize: 1000 })),
      firstValueFrom(this.profesionalesService.listar({ estado: 'ACTIVO', page: 1, pageSize: 1000 }))
    ]).then(([serviciosResponse, profesionalesResponse]) => {
      this.servicios.set(serviciosResponse.data);
      this.profesionales.set(profesionalesResponse.data);
      this.loadingFiltros.set(false);
    }).catch((error) => {
      console.error('Error cargando filtros:', error);
      this.loadingFiltros.set(false);
    });
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

  /** yyyy-mm-dd for a date (used for availability ranges key). */
  private dayKey(day: Date): string {
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, '0');
    const d = String(day.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /** Parse "HH:MM:SS" or "HH:MM" to minutes from midnight. */
  private horaToMinutes(hora: string): number {
    const parts = hora.split(':').map(Number);
    const h = parts[0] ?? 0;
    const m = parts[1] ?? 0;
    return h * 60 + m;
  }

  /** Format time string to "HH:MM" for display. */
  private formatHoraShort(hora: string): string {
    const parts = hora.split(':');
    const h = parts[0] ?? '00';
    const m = (parts[1] ?? '00').slice(0, 2);
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  }

  async selectHorariosProfesional(profesionalId: number | null): Promise<void> {
    this.horariosProfesionalSelected.set(profesionalId);
    if (profesionalId == null) {
      this.horariosDelProfesional.set([]);
      this.horariosLoading.set(false);
      return;
    }
    this.horariosLoading.set(true);
    try {
      const list = await firstValueFrom(this.horariosService.listar(profesionalId));
      this.horariosDelProfesional.set(list);
    } catch (e) {
      console.error('Error cargando horarios del profesional:', e);
      this.horariosDelProfesional.set([]);
    } finally {
      this.horariosLoading.set(false);
    }
  }
}
