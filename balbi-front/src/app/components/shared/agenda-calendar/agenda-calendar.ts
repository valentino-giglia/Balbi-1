import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, computed, input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

export type AgendaCalendarEventStatus = 'RESERVADO' | 'PENDIENTE' | 'CANCELADO' | 'COMPLETADO';

/** Tipo de ítem en el calendario: turno, evento de agenda (traslado/cadetería/etc.), o bloqueo */
export type AgendaCalendarEventTipo = 'turno' | 'evento' | 'bloqueo';

export interface AgendaCalendarEvent {
  id: string | number;
  title: string;
  start: string | Date;
  end: string | Date;
  status?: AgendaCalendarEventStatus;
  /** 'turno' | 'evento' | 'bloqueo' */
  tipo?: AgendaCalendarEventTipo;
  /** ID numérico del evento de agenda (cuando tipo === 'evento') para abrir modal editar */
  eventoAgendaId?: number;
  /** ID numérico del bloqueo (cuando tipo === 'bloqueo') para abrir modal editar */
  bloqueoAgendaId?: number;
  /** Optional service color (e.g. "#1976d2") used to tint "agendado" events */
  color?: string;
  /** Tipo de evento agenda: TRASLADO, ENVIO_MUESTRAS, CADETERIA */
  eventoAgendaTipo?: string;
  /** Cantidad de pacientes reservados */
  pacientesReservados?: number;
  /** Máximo de pacientes permitidos */
  maximoPacientes?: number;
  /** Información adicional para el tooltip */
  paciente?: { nombre: string; dni?: string; telefono?: string; email?: string };
  profesional?: { nombre: string; telefono?: string; email?: string };
  servicio?: { nombre: string; codigo?: string };
  taller?: { nombre: string; codigo?: string };
  linkMeet?: string;
  precio?: number;
  notas?: string;
}

type PositionedEvent = AgendaCalendarEvent & {
  _topPx: number;
  _heightPx: number;
  _timeLabel: string;
  _tooltip?: string;
  _bg?: string;
  _border?: string;
  _text?: string;
  _accent?: string;
};

@Component({
  selector: 'app-agenda-calendar',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './agenda-calendar.html',
  styleUrl: './agenda-calendar.scss'
})
export class AgendaCalendarComponent {
  /** Center date used to derive the displayed week */
  viewDate = input<Date>(new Date());

  /** Events to render */
  events = input<AgendaCalendarEvent[]>([]);

  /** Emits when user clicks an event block */
  @Output() eventClick = new EventEmitter<AgendaCalendarEvent>();

  /** Emits when user clicks an empty cell (day, hour, minute) */
  @Output() cellClick = new EventEmitter<{ day: Date; hour: number; minute: number }>();

  /** Week starts on: 0=Sunday, 1=Monday */
  weekStartsOn = input<number>(1);

  /** Visible hours in the grid */
  startHour = input<number>(7);
  endHour = input<number>(21);

  /** Visual tuning */
  hourHeight = input<number>(56);

  /**
   * Optional: availability ranges per day (key = yyyy-mm-dd) for highlighting professional schedule.
   * Ranges in minutes from midnight (0–1440).
   */
  availabilityRangesByDay = input<Record<string, Array<{ startMin: number; endMin: number }>>>({});

  /** Optional label for availability tooltip (e.g. professional name). */
  availabilityTooltipLabel = input<string | null>(null);

  private minutesPerDay = 24 * 60;

  private readonly weekdayFmt = new Intl.DateTimeFormat('es-AR', { weekday: 'short' });
  private readonly monthFmt = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' });
  private readonly timeFmt = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' });
  private readonly dayNumberFmt = new Intl.DateTimeFormat('es-AR', { day: 'numeric' });

  pxPerMinute = computed(() => this.hourHeight() / 60);
  gridHeightPx = computed(() => Math.max(1, (this.endHour() - this.startHour()) * this.hourHeight()));
  
  // Altura de cada bloque de 30 minutos
  slotHeight = computed(() => this.hourHeight() / 2);

  weekStart = computed(() => this.startOfWeek(this.viewDate(), this.weekStartsOn()));
  days = computed(() => {
    const start = this.weekStart();
    return Array.from({ length: 7 }, (_, i) => this.addDays(start, i));
  });

  hours = computed(() => {
    const start = this.startHour();
    const end = this.endHour();
    const count = Math.max(0, end - start);
    return Array.from({ length: count }, (_, i) => start + i);
  });

  // Slots de 30 minutos para mostrar en el calendario
  timeSlots = computed(() => {
    const start = this.startHour();
    const end = this.endHour();
    const slots: Array<{ hour: number; minute: number; label: string }> = [];
    
    for (let h = start; h < end; h++) {
      // Agregar slot a las :00
      slots.push({
        hour: h,
        minute: 0,
        label: `${String(h).padStart(2, '0')}:00`
      });
      // Agregar slot a las :30
      slots.push({
        hour: h,
        minute: 30,
        label: `${String(h).padStart(2, '0')}:30`
      });
    }
    
    return slots;
  });

  monthLabel = computed(() => this.capitalize(this.monthFmt.format(this.viewDate())));

  isWeekContainingToday = computed(() => {
    const now = new Date();
    const start = this.weekStart();
    const end = this.addDays(start, 7);
    return now >= start && now < end;
  });

  nowTopPx = computed(() => {
    if (!this.isWeekContainingToday()) return null;
    const now = new Date();
    const startMinutes = this.startHour() * 60;
    const minutes = this.minutesSinceMidnight(now) - startMinutes;
    return Math.round(minutes * this.pxPerMinute());
  });

  eventsByDay = computed(() => {
    const startMinutes = this.startHour() * 60;
    const endMinutes = this.endHour() * 60;
    const pxPerMin = this.pxPerMinute();
    const map = new Map<string, PositionedEvent[]>();

    for (const day of this.days()) {
      map.set(this.dayKey(day), []);
    }

    for (const ev of this.events()) {
      const start = this.toDate(ev.start);
      const end = this.toDate(ev.end);
      if (!start || !end) continue;

      const day = new Date(start);
      day.setHours(0, 0, 0, 0);
      const key = this.dayKey(day);
      if (!map.has(key)) continue;

      const startMin = this.clamp(this.minutesSinceMidnight(start), 0, this.minutesPerDay);
      const endMin = this.clamp(this.minutesSinceMidnight(end), 0, this.minutesPerDay);
      if (endMin <= startMin) continue;

      // Skip events completely outside the visible range
      if (endMin <= startMinutes || startMin >= endMinutes) continue;

      const visibleStartMin = this.clamp(startMin, startMinutes, endMinutes);
      const visibleEndMin = this.clamp(endMin, startMinutes, endMinutes);

      const topPx = (visibleStartMin - startMinutes) * pxPerMin;
      const heightPx = Math.max(18, (visibleEndMin - visibleStartMin) * pxPerMin);

      const timeLabel = `${this.timeFmt.format(start)} – ${this.timeFmt.format(end)}`;
      const tooltip = this.generateTooltip(ev, start, end);

      const style = this.eventStyle(ev);

      map.get(key)!.push({
        ...ev,
        _topPx: Math.round(topPx),
        _heightPx: Math.round(heightPx),
        _timeLabel: timeLabel,
        _tooltip: tooltip,
        ...style
      });
    }

    // Simple ordering: top-to-bottom
    for (const [key, list] of map.entries()) {
      list.sort((a, b) => a._topPx - b._topPx);
      map.set(key, list);
    }

    return map;
  });

  private eventStyle(ev: AgendaCalendarEvent): Pick<PositionedEvent, '_bg' | '_border' | '_text' | '_accent'> {
    const status = ev.status;
    const svcColor = typeof ev.color === 'string' ? ev.color : null;
    const tipo = ev.tipo;

    // Bloqueo de agenda -> gris neutro
    if (tipo === 'bloqueo') {
      const bg = this.rgbaFromHex('#6b7280', 0.15);
      const border = this.rgbaFromHex('#6b7280', 0.4);
      return {
        _bg: bg ?? undefined,
        _border: border ?? undefined,
        _accent: '#6b7280',
        _text: '#374151'
      };
    }

    // Evento de agenda (traslado, cadetería, etc.) -> color según tipo o azul
    if (tipo === 'evento') {
      const hex = ev.color || '#2563eb';
      const bg = this.rgbaFromHex(hex, 0.15);
      const border = this.rgbaFromHex(hex, 0.4);
      return {
        _bg: bg ?? undefined,
        _border: border ?? undefined,
        _accent: hex,
        _text: '#111827'
      };
    }

    // "Turno pendiente" -> color amarillo
    if (status === 'PENDIENTE') {
      const bg = this.rgbaFromHex('#FFC107', 0.12);
      const border = this.rgbaFromHex('#FFC107', 0.35);
      const accent = this.rgbaFromHex('#FFC107', 1);
      return {
        _bg: bg ?? undefined,
        _border: border ?? undefined,
        _accent: accent ?? undefined,
        _text: '#111827'
      };
    }

    // "Turno agendado" -> tint with service color
    const isAgendado = status === 'RESERVADO' || status === 'COMPLETADO';
    if (isAgendado && svcColor) {
      const bg = this.rgbaFromHex(svcColor, 0.12);
      const border = this.rgbaFromHex(svcColor, 0.35);
      const accent = this.rgbaFromHex(svcColor, 1);
      return {
        _bg: bg ?? undefined,
        _border: border ?? undefined,
        _accent: accent ?? undefined,
        _text: '#111827'
      };
    }

    return {};
  }

  dayHeaderDow(day: Date): string {
    // e.g. "lun"
    return this.capitalize(this.weekdayFmt.format(day).replace('.', ''));
  }

  dayHeaderDom(day: Date): string {
    return this.dayNumberFmt.format(day);
  }

  isToday(day: Date): boolean {
    const now = new Date();
    return (
      day.getFullYear() === now.getFullYear() &&
      day.getMonth() === now.getMonth() &&
      day.getDate() === now.getDate()
    );
  }

  dayKey(day: Date): string {
    // yyyy-mm-dd
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, '0');
    const d = String(day.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  statusClass(status?: AgendaCalendarEventStatus): string {
    switch (status) {
      case 'RESERVADO':
        return 'is-reservado';
      case 'PENDIENTE':
        return 'is-pendiente';
      case 'CANCELADO':
        return 'is-cancelado';
      case 'COMPLETADO':
        return 'is-completado';
      default:
        return 'is-reservado';
    }
  }

  onEventClick(ev: AgendaCalendarEvent, mouseEvent: MouseEvent): void {
    mouseEvent?.stopPropagation?.();
    this.eventClick.emit(ev);
  }

  onEventKeydown(ev: AgendaCalendarEvent, keyEvent: KeyboardEvent): void {
    const key = keyEvent.key;
    if (key === 'Enter' || key === ' ') {
      keyEvent.preventDefault();
      this.eventClick.emit(ev);
    }
  }

  onCellClick(day: Date, hour: number, minute: number, mouseEvent: MouseEvent): void {
    mouseEvent?.stopPropagation?.();
    this.cellClick.emit({ day, hour, minute });
  }

  /** Whether the given 30-min slot falls within any availability range for that day. */
  isSlotAvailable(day: Date, hour: number, minute: number): boolean {
    const rangesByDay = this.availabilityRangesByDay();
    const key = this.dayKey(day);
    const ranges = rangesByDay[key];
    if (!ranges?.length) return false;
    const slotStartMin = hour * 60 + minute;
    const slotEndMin = slotStartMin + 30;
    return ranges.some(
      (r) => slotStartMin < r.endMin && slotEndMin > r.startMin
    );
  }

  /** Tooltip for an available slot (horario de atención). */
  availabilitySlotTooltip(day: Date, hour: number, minute: number): string | null {
    if (!this.isSlotAvailable(day, hour, minute)) return null;
    const label = this.availabilityTooltipLabel();
    return label ? `Horario de atención: ${label}` : 'Horario de atención';
  }

  hourLabel(hour: number): string {
    // "07:00"
    return `${String(hour).padStart(2, '0')}:00`;
  }

  slotLabel(hour: number, minute: number): string {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  slotTopPx(hour: number, minute: number): number {
    const startHour = this.startHour();
    const totalMinutes = (hour - startHour) * 60 + minute;
    return totalMinutes * this.pxPerMinute();
  }

  private toDate(value: string | Date): Date | null {
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  private startOfWeek(date: Date, weekStartsOn: number): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0..6 (Sun..Sat)
    const diff = (day - weekStartsOn + 7) % 7;
    d.setDate(d.getDate() - diff);
    return d;
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  private minutesSinceMidnight(date: Date): number {
    return date.getHours() * 60 + date.getMinutes();
  }

  private clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
  }

  private rgbaFromHex(hex: string, alpha: number): string | null {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return null;
    const a = Math.max(0, Math.min(1, alpha));
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    if (!hex) return null;
    let h = hex.trim();
    if (h.startsWith('#')) h = h.slice(1);

    // support #RGB or #RRGGBB
    if (h.length === 3) {
      h = `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
    }
    if (h.length !== 6) return null;

    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }

  private generateTooltip(ev: AgendaCalendarEvent, start: Date, end: Date): string {
    const parts: string[] = [];
    
    // Hora
    parts.push(`⏰ ${this.timeFmt.format(start)} – ${this.timeFmt.format(end)}`);
    
    // Servicio (turno) o Taller (evento)
    if (ev.servicio?.nombre) {
      parts.push(`📋 Servicio: ${ev.servicio.nombre}`);
    }
    if (ev.taller?.nombre) {
      parts.push(`📋 Taller: ${ev.taller.nombre}`);
    }
    if (ev.linkMeet) {
      parts.push(`🔗 Meet: ${ev.linkMeet}`);
    }
    
    // Profesional
    if (ev.profesional?.nombre) {
      let profInfo = `👤 Profesional: ${ev.profesional.nombre}`;
      if (ev.profesional.telefono) {
        profInfo += `\n   📞 ${ev.profesional.telefono}`;
      }
      parts.push(profInfo);
    }
    
    // Tutor
    if (ev.paciente?.nombre) {
      let tutorInfo = `👨‍👩‍👧 Tutor: ${ev.paciente.nombre}`;
      if (ev.paciente.dni) {
        tutorInfo += ` (DNI: ${ev.paciente.dni})`;
      }
      if (ev.paciente.telefono) {
        tutorInfo += `\n   📞 ${ev.paciente.telefono}`;
      }
      if (ev.paciente.email) {
        tutorInfo += `\n   📧 ${ev.paciente.email}`;
      }
      parts.push(tutorInfo);
    }
    
    // Estado
    const estadoLabel = ev.status === 'RESERVADO' ? 'Reservado' : 
                       ev.status === 'PENDIENTE' ? 'Pendiente' :
                       ev.status === 'CANCELADO' ? 'Cancelado' :
                       ev.status === 'COMPLETADO' ? 'Completado' : 'Reservado';
    parts.push(`📌 Estado: ${estadoLabel}`);
    
    // Precio
    if (ev.precio !== undefined && ev.precio !== null) {
      parts.push(`💰 Precio: $${ev.precio.toLocaleString('es-AR')}`);
    }
    
    // Notas
    if (ev.notas) {
      parts.push(`📝 Notas: ${ev.notas}`);
    }
    
    return parts.join('\n');
  }

  private capitalize(s: string): string {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}


