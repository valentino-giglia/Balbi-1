import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import {
  PacientesService,
  Paciente,
  ResumenHistorialClinico,
  HistorialClinicoFileItem,
  HistorialClinicoVacunaItem
} from '../../../services/pacientes.service';
import { TurnosService, Turno } from '../../../services/turnos.service';
import { ConsultasService } from '../../../services/consultas.service';
import { FichasService, Ficha } from '../../../services/fichas.service';
import { MascotasService, Mascota } from '../../../services/mascotas.service';
import { VacunasService, Vacuna } from '../../../services/vacunas.service';
import { ServiciosService } from '../../../services/servicios.service';
import {
  CustomFieldsService,
  CustomField,
  customFieldsToOptions
} from '../../../services/custom-fields.service';
import { FilesService, FileItem } from '../../../services/files.service';
import { LoadingSpinnerComponent } from '../../../components/shared/loading-spinner/loading-spinner';
import { ConfirmDialogComponent } from '../../../components/shared/confirm-dialog/confirm-dialog';
import { TurnoDetalleModalComponent } from '../../../components/shared/turno-detalle-modal/turno-detalle-modal';
import {
  TurnoAgendaModalComponent,
  TurnoAgendaModalData
} from '../../../components/shared/turno-agenda-modal/turno-agenda-modal';

/** Un campo extra con clave, etiqueta y valor para mostrar en un input */
export interface CampoExtraItem {
  key: string;
  label: string;
  value: string | number | null;
}

// Interfaces para datos adicionales del paciente
export interface FichaPaciente {
  fechaNacimiento?: string;
  domicilio?: string;
  ocupacion?: string;
  sexo?: 'Masculino' | 'Femenino' | 'Otro';
  localidad?: string;
  estadoCivil?: string;
  obraSocial?: string;
  nroAfiliado?: string;
  nacionalidad?: string;
  religion?: string;
}

export interface ImagenPaciente {
  id: string;
  url: string;
  fecha: string;
  descripcion?: string;
}

export interface HistorialRegistro {
  id: string;
  fecha: string;
  hora: string;
  tipo: 'CONTROL' | 'Imagenes' | '1° Vez' | 'Importación de Datos' | 'Próximo';
  numeroConsulta?: string;
  profesional: string;
  descripcion?: string;
  /** True cuando el registro es un turno por venir (del endpoint de próximos) */
  esProximo?: boolean;
}

/** Un ítem del historial en el panel lateral (turno + datos para la vista). */
export interface HistorialTurnoSidebarItem {
  turno: Turno;
  fecha: string;
  hora: string;
  profesional: string;
  esProximo: boolean;
  esHoy: boolean;
  servicioNombre: string;
  mascotaLinea: string;
  motivoLinea: string | null;
  estado: Turno['estado'];
  estadoLabel: string;
}

/** Draft al editar consulta: nota, extra (JSON) y campos clínicos estructurados */
export interface ConsultaEdicionDraft {
  nota: string;
  extra: Record<string, unknown>;
  motivoConsulta: string;
  examenClinico: string;
  diagnostico: string;
  planTratamiento: string;
  pesoKg: string;
}

/** Merge: defaults del servicio + extra de consulta/ficha (prioridad a consulta/ficha). */
function mergeExtra(
  defaultExtra: Record<string, unknown> | null | undefined,
  actualExtra: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const defaults = defaultExtra && typeof defaultExtra === 'object' ? { ...defaultExtra } : {};
  const actual = actualExtra && typeof actualExtra === 'object' ? actualExtra : {};
  return { ...defaults, ...actual };
}

/** Dado un objeto extra y las opciones de custom_fields, devuelve lista de campos con key, label y value para inputs.
 *  Siempre devuelve TODOS los campos definidos en custom_fields, aunque en extra no haya valor todavía.
 */
function extraToCampos(
  extra: Record<string, unknown>,
  options: { key: string; label: string }[]
): CampoExtraItem[] {
  return options.map(opt => {
    const key = opt.key;
    const value = extra[key];
    return {
      key,
      label: opt.label ?? key,
      value: value == null ? '' : (typeof value === 'string' || typeof value === 'number' ? value : String(value))
    };
  });
}

@Component({
  selector: 'app-pacientes-detalle-turnos',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
  MatDatepickerModule,
  MatNativeDateModule,
  FormsModule,
  MatSelectModule,
  LoadingSpinnerComponent
  ],
  templateUrl: './pacientes.detalle-turnos.html',
  styleUrl: './pacientes.detalle-turnos.scss'
})
export class PacientesDetalleTurnosComponent implements OnInit {
  paciente = signal<Paciente | null>(null);
  loading = signal(false);
  
  // Turnos próximos
  turnosProximos = signal<Turno[]>([]);
  turnosProximosTotal = signal(0);
  turnosProximosPage = signal(0);
  turnosProximosPageSize = signal(10);
  loadingTurnosProximos = signal(false);
  
  // Turnos antiguos
  turnosAntiguos = signal<Turno[]>([]);
  turnosAntiguosTotal = signal(0);
  turnosAntiguosPage = signal(0);
  turnosAntiguosPageSize = signal(10);
  loadingTurnosAntiguos = signal(false);

  /** Turnos devueltos por GET /por-mascota/:id (sin perder filas). El sidebar lee esto primero. */
  turnosListaCompletaMascota = signal<Turno[]>([]);
  
  // Notas en edición
  notasEditando = signal<{ [key: number]: string }>({});
  /** ID del turno cuyas notas/consulta se están editando (null = no edición) */
  editandoNotasTurnoID = signal<number | null>(null);
  /** Draft de consulta en edición */
  consultaEditando = signal<ConsultaEdicionDraft | null>(null);
  /** Resumen historial ampliado (vacunas / archivos) para la mascota seleccionada */
  historialSidebarVacunas = signal<HistorialClinicoVacunaItem[]>([]);
  historialSidebarFiles = signal<HistorialClinicoFileItem[]>([]);
  loadingHistorialSidebar = signal(false);
  /** Draft de ficha.extra en edición (null = no editando ficha) */
  fichaExtraEditando = signal<Record<string, unknown> | null>(null);

  // Columnas de la tabla
  displayedColumns: string[] = ['fecha', 'servicio', 'profesional', 'duracion', 'estado', 'acciones'];

  // Datos adicionales del paciente (localStorage)
  fichaPaciente = signal<FichaPaciente | null>(null);
  imagenesPaciente = signal<ImagenPaciente[]>([]);
  historialRegistros = signal<HistorialRegistro[]>([]);
  /** Ficha del paciente desde API (una por paciente) */
  fichaPacienteApi = signal<Ficha | null>(null);
  loadingFicha = signal(false);
  /** Opciones de campos extra provenientes de customfields */
  consultaFieldOptions = signal<{ key: string; label: string }[]>([]);
  fichaFieldOptions = signal<{ key: string; label: string }[]>([]);

  /** Mascotas del paciente y selección */
  mascotas = signal<Mascota[]>([]);
  mascotaSeleccionadaId = signal<number | null>(null);
  loadingMascotas = signal(false);
  /** Vacunas de la mascota seleccionada */
  vacunasMascota = signal<Vacuna[]>([]);
  loadingVacunas = signal(false);
  /** Vacunas desplegables por mascota: id de mascota abierta y mapa mascotaID -> Vacuna[] */
  vacunasAbiertasParaMascotaId = signal<number | null>(null);
  vacunasPorMascotaId = signal<Record<number, Vacuna[]>>({});
  loadingVacunasMascotaId = signal<number | null>(null);

  /** Spinners: guardar / acciones sobre turno */
  savingFicha = signal(false);
  savingConsulta = signal(false);
  savingTurnoConfirmar = signal(false);
  savingTurnoCancelar = signal(false);
  loadingPdfHistorial = signal(false);

  /** Archivos de la consulta del turno actual */
  archivosTurnoActual = signal<FileItem[]>([]);
  loadingArchivosTurno = signal(false);

  // Turno actual seleccionado para mostrar detalles
  turnoActual = signal<Turno | null>(null);

  /** Mascota inicial a seleccionar, tomada del query param ?mascotaId= */
  private initialMascotaId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pacientesService: PacientesService,
    private turnosService: TurnosService,
    private consultasService: ConsultasService,
    private fichasService: FichasService,
    private mascotasService: MascotasService,
    private vacunasService: VacunasService,
    private serviciosService: ServiciosService,
    private customFieldsService: CustomFieldsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private filesService: FilesService
  ) {}

  ngOnInit(): void {
    const pacienteID = this.route.snapshot.paramMap.get('id');
    const mascotaIdParam = this.route.snapshot.queryParamMap.get('mascotaId');
    if (mascotaIdParam) {
      const parsed = parseInt(mascotaIdParam, 10);
      if (!Number.isNaN(parsed)) {
        this.initialMascotaId = parsed;
      }
    }
    if (pacienteID) {
      const id = parseInt(pacienteID);
      this.cargarPaciente(id);
      this.cargarMascotas(id);
      this.cargarDatosAdicionales(id);
      this.cargarCustomFields();
    }
  }

  cargarCustomFields(): void {
    this.customFieldsService.listarTodos('consulta').subscribe({
      next: (fields: CustomField[]) => {
        this.consultaFieldOptions.set(customFieldsToOptions(fields));
      }
    });
    this.customFieldsService.listarTodos('ficha').subscribe({
      next: (fields: CustomField[]) => {
        this.fichaFieldOptions.set(customFieldsToOptions(fields));
      }
    });
  }

  cargarFichaPaciente(pacienteID: number, mascotaID?: number | null): void {
    this.loadingFicha.set(true);
    const filtros = mascotaID != null ? { mascotaID } : { pacienteID };
    this.fichasService.listar(filtros).subscribe({
      next: (fichas) => {
        this.fichaPacienteApi.set(fichas.length > 0 ? fichas[0] : null);
        this.loadingFicha.set(false);
      },
      error: () => this.loadingFicha.set(false)
    });
  }

  cargarMascotas(pacienteID: number): void {
    this.loadingMascotas.set(true);
    this.mascotasService.listarPorPaciente(pacienteID).subscribe({
      next: (res) => {
        const data = res.data ?? [];
        this.mascotas.set(data);
        this.loadingMascotas.set(false);
        if (data.length > 0) {
          let mascotaInicialId: number | null = null;
          if (this.initialMascotaId && data.some(m => m.id === this.initialMascotaId)) {
            mascotaInicialId = this.initialMascotaId;
            this.initialMascotaId = null;
          } else {
            mascotaInicialId = data[0].id;
          }
          this.mascotaSeleccionadaId.set(mascotaInicialId);
          this.onMascotaSeleccionadaChange(pacienteID);
        }
      },
      error: () => this.loadingMascotas.set(false)
    });
  }

  /**
   * @param pacienteIDFromCaller Si se pasa (ej. desde cargarMascotas), se usa para cargar ficha/turnos
   *   sin depender de que this.paciente() ya esté cargado. Así funciona igual entrando por URL con
   *   mascotaId o desde tutores (modal → navegación con mascotaId).
   */
  onMascotaSeleccionadaChange(pacienteIDFromCaller?: number): void {
    const pacienteID = pacienteIDFromCaller ?? this.paciente()?.id;
    const mascotaID = this.mascotaSeleccionadaId();
    if (!pacienteID) return;
    // Reset turno y estado de edición al cambiar de mascota
    this.turnoActual.set(null);
    this.editandoNotasTurnoID.set(null);
    this.consultaEditando.set(null);
    this.archivosTurnoActual.set([]);
    this.cargarFichaPaciente(pacienteID, mascotaID ?? undefined);
    if (mascotaID != null) {
      this.cargarTurnosParaVistaActual(pacienteID, mascotaID);
    } else {
      this.turnosProximos.set([]);
      this.turnosAntiguos.set([]);
      this.turnosListaCompletaMascota.set([]);
      this.turnoActual.set(null);
    }
    this.vacunasAbiertasParaMascotaId.set(null);
    this.cargarHistorialSidebarMascota(mascotaID);
  }

  cargarVacunasMascota(mascotaID: number): void {
    this.loadingVacunas.set(true);
    this.vacunasService.listarPorMascota(mascotaID).subscribe({
      next: (vacunas) => {
        this.vacunasMascota.set(vacunas);
        this.loadingVacunas.set(false);
      },
      error: () => this.loadingVacunas.set(false)
    });
  }

  /** Alterna el panel de vacunas para una mascota; carga bajo demanda. */
  toggleVacunasMascota(mascotaID: number): void {
    const abierto = this.vacunasAbiertasParaMascotaId();
    if (abierto === mascotaID) {
      this.vacunasAbiertasParaMascotaId.set(null);
      return;
    }
    this.vacunasAbiertasParaMascotaId.set(mascotaID);
    const cache = this.vacunasPorMascotaId();
    if (cache[mascotaID]) return;
    this.loadingVacunasMascotaId.set(mascotaID);
    this.vacunasService.listarPorMascota(mascotaID).subscribe({
      next: (vacunas) => {
        this.vacunasPorMascotaId.set({ ...this.vacunasPorMascotaId(), [mascotaID]: vacunas });
        this.loadingVacunasMascotaId.set(null);
      },
      error: () => this.loadingVacunasMascotaId.set(null)
    });
  }

  getVacunasParaMascota(mascotaID: number): Vacuna[] {
    return this.vacunasPorMascotaId()[mascotaID] ?? [];
  }

  cargarDatosAdicionales(pacienteID: number): void {
    // Cargar ficha del paciente desde localStorage
    const fichaKey = `ficha_paciente_${pacienteID}`;
    const fichaData = localStorage.getItem(fichaKey);
    if (fichaData) {
      this.fichaPaciente.set(JSON.parse(fichaData));
    }

    // Cargar imágenes del paciente desde localStorage
    const imagenesKey = `imagenes_paciente_${pacienteID}`;
    const imagenesData = localStorage.getItem(imagenesKey);
    if (imagenesData) {
      this.imagenesPaciente.set(JSON.parse(imagenesData));
    }

    // Cargar historial de registros desde localStorage
    const historialKey = `historial_paciente_${pacienteID}`;
    const historialData = localStorage.getItem(historialKey);
    if (historialData) {
      this.historialRegistros.set(JSON.parse(historialData));
    }

  }

  inicializarHistorialEjemplo(pacienteID: number): void {
    // Crear historial inicial basado en turnos antiguos
    const turnosAntiguos = this.turnosAntiguos();
    if (turnosAntiguos.length === 0) return;

    const registros: HistorialRegistro[] = turnosAntiguos.map((turno, index) => {
      const fechaHora = turno.horaInicio.split('T');
      const fecha = fechaHora[0];
      const hora = fechaHora[1]?.substring(0, 5) || '00:00';
      const esPrimeraVez = index === turnosAntiguos.length - 1;
      
      return {
        id: `reg_${turno.id}`,
        fecha: fecha,
        hora: hora,
        tipo: esPrimeraVez ? '1° Vez' : 'CONTROL',
        numeroConsulta: esPrimeraVez ? undefined : `${turnosAntiguos.length - index}/5`,
        profesional: turno.profesional?.nombre || 'Profesional',
        descripcion: turno.notas
      };
    });
    
    this.historialRegistros.set(registros);
    this.guardarHistorialEnLocalStorage(pacienteID);
  }

  guardarFichaEnLocalStorage(pacienteID: number, ficha: FichaPaciente): void {
    const key = `ficha_paciente_${pacienteID}`;
    localStorage.setItem(key, JSON.stringify(ficha));
  }

  guardarImagenesEnLocalStorage(pacienteID: number, imagenes: ImagenPaciente[]): void {
    const key = `imagenes_paciente_${pacienteID}`;
    localStorage.setItem(key, JSON.stringify(imagenes));
  }

  guardarHistorialEnLocalStorage(pacienteID: number): void {
    const key = `historial_paciente_${pacienteID}`;
    localStorage.setItem(key, JSON.stringify(this.historialRegistros()));
  }

  cargarPaciente(pacienteID: number): void {
    this.loading.set(true);
    this.pacientesService.obtener(pacienteID).subscribe({
      next: (paciente) => {
        this.paciente.set(paciente);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  /**
   * Carga todos los turnos del tutor o de la mascota (sin paginar) y reparte en próximos / antiguos
   * como en el backend: desde inicio del día local en adelante = próximos; antes = antiguos.
   */
  cargarTurnosParaVistaActual(pacienteID: number, mascotaID?: number | null): void {
    this.loadingTurnosProximos.set(true);
    this.loadingTurnosAntiguos.set(true);
    const req$ =
      mascotaID != null
        ? this.turnosService.listarTodosPorMascota(mascotaID)
        : this.turnosService.listar({ pacienteID });
    req$.subscribe({
      next: (raw) => {
        if (mascotaID != null) {
          this.turnosListaCompletaMascota.set(raw);
        } else {
          this.turnosListaCompletaMascota.set([]);
        }
        const all = raw;
        const ymdHoy = this.fechaHoyLocal();
        const proximos = all
          .filter((t) => this.ymdCalendarioTurno(t.horaInicio) >= ymdHoy)
          .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        const antiguos = all
          .filter((t) => this.ymdCalendarioTurno(t.horaInicio) < ymdHoy)
          .sort((a, b) => b.horaInicio.localeCompare(a.horaInicio));
        this.turnosProximos.set(proximos);
        this.turnosAntiguos.set(antiguos);
        this.turnosProximosTotal.set(proximos.length);
        this.turnosAntiguosTotal.set(antiguos.length);
        this.loadingTurnosProximos.set(false);
        this.loadingTurnosAntiguos.set(false);

        const historialKey = `historial_paciente_${pacienteID}`;
        const historialData = localStorage.getItem(historialKey);
        if (!historialData && antiguos.length > 0) {
          this.inicializarHistorialEjemplo(pacienteID);
        }
        if (antiguos.length > 0 && !this.turnoActual()) {
          this.turnoActual.set(antiguos[0]);
          this.entrarEdicionNotas();
        }
      },
      error: () => {
        this.loadingTurnosProximos.set(false);
        this.loadingTurnosAntiguos.set(false);
        this.turnosListaCompletaMascota.set([]);
      }
    });
  }

  /**
   * Fecha YYYY-MM-DD del turno para comparar con fechaHoyLocal() sin depender de un parse
   * que falle con "YYYY-MM-DD HH:mm:ss" (p. ej. MySQL) y deje el turno fuera de ambas listas.
   */
  private ymdCalendarioTurno(horaInicio: string | undefined | null): string {
    const s = horaInicio == null ? '' : String(horaInicio).trim();
    if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) {
      return s.slice(0, 10);
    }
    const ms = new Date(s).getTime();
    if (!Number.isFinite(ms)) {
      return '1970-01-01';
    }
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /** HH:mm para sidebar / display cuando hora viene con espacio o con T. */
  horaCortaDesdeTurno(horaInicio: string | undefined | null): string {
    const s = horaInicio == null ? '' : String(horaInicio).trim();
    const iT = s.indexOf('T');
    if (iT !== -1) {
      const rest = s.slice(iT + 1);
      const m = rest.match(/^(\d{2}):(\d{2})/);
      return m ? `${m[1]}:${m[2]}` : '00:00';
    }
    const iS = s.indexOf(' ');
    if (iS !== -1) {
      const rest = s.slice(iS + 1);
      const m = rest.match(/^(\d{2}):(\d{2})/);
      return m ? `${m[1]}:${m[2]}` : '00:00';
    }
    return '00:00';
  }

  onTurnosProximosPageChange(event: PageEvent): void {
    this.turnosProximosPage.set(event.pageIndex);
    this.turnosProximosPageSize.set(event.pageSize);
    const pacienteID = this.paciente()?.id;
    if (pacienteID) {
      this.cargarTurnosParaVistaActual(pacienteID, this.mascotaSeleccionadaId());
    }
  }

  onTurnosAntiguosPageChange(event: PageEvent): void {
    this.turnosAntiguosPage.set(event.pageIndex);
    this.turnosAntiguosPageSize.set(event.pageSize);
    const pacienteID = this.paciente()?.id;
    if (pacienteID) {
      this.cargarTurnosParaVistaActual(pacienteID, this.mascotaSeleccionadaId());
    }
  }

  volver(): void {
    this.router.navigate(['/pacientes']);
  }

  irAlChat(): void {
    const pacienteID = this.paciente()?.id;
    if (pacienteID) {
      this.router.navigate(['/chat/detalle', pacienteID]);
    }
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'RESERVADO': 'primary',
      'PENDIENTE': 'accent',
      'CANCELADO': 'warn',
      'COMPLETADO': 'primary',
      'BAJA': 'warn'
    };
    return colores[estado] || 'primary';
  }

  getEstadoBorderColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'RESERVADO': '#1976d2',
      'PENDIENTE': '#ff4081',
      'CANCELADO': '#f44336',
      'COMPLETADO': '#4caf50',
      'BAJA': '#9e9e9e'
    };
    return colores[estado] || '#1976d2';
  }

  actualizarNotaEnEdicion(turnoID: number, nota: string): void {
    const notasActuales = this.notasEditando();
    notasActuales[turnoID] = nota;
    this.notasEditando.set({ ...notasActuales });
  }

  guardarNotas(turnoID: number): void {
    const notas = this.notasEditando()[turnoID] || '';
    this.turnosService.actualizar(turnoID, { notas }).subscribe({
      next: () => {
        // Actualizar en turnos próximos
        const turnosProximos = this.turnosProximos();
        const turnoProximo = turnosProximos.find(t => t.id === turnoID);
        if (turnoProximo) {
          turnoProximo.notas = notas;
          this.turnosProximos.set([...turnosProximos]);
        }
        // Actualizar en turnos antiguos
        const turnosAntiguos = this.turnosAntiguos();
        const turnoAntiguo = turnosAntiguos.find(t => t.id === turnoID);
        if (turnoAntiguo) {
          turnoAntiguo.notas = notas;
          this.turnosAntiguos.set([...turnosAntiguos]);
        }
        const listaN = this.turnosListaCompletaMascota();
        const ix = listaN.findIndex((t) => t.id === turnoID);
        if (ix !== -1) {
          const copia = [...listaN];
          copia[ix] = { ...copia[ix], notas };
          this.turnosListaCompletaMascota.set(copia);
        }
        this.snackBar.open('Nota guardada exitosamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      },
      error: () => {
        this.snackBar.open('Error al guardar la nota', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }

  confirmarTurno(turnoID: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Turno',
        message: '¿Deseas confirmar la asistencia a este turno?',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.savingTurnoConfirmar.set(true);
        this.turnosService.actualizar(turnoID, { estado: 'COMPLETADO' }).subscribe({
          next: () => {
            const pacienteID = this.paciente()?.id;
            if (pacienteID) {
              this.cargarTurnosParaVistaActual(pacienteID, this.mascotaSeleccionadaId());
            }
            this.savingTurnoConfirmar.set(false);
            this.snackBar.open('Turno confirmado exitosamente', 'Cerrar', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          },
          error: () => {
            this.savingTurnoConfirmar.set(false);
            this.snackBar.open('Error al confirmar el turno', 'Cerrar', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
        });
      }
    });
  }

  cancelarTurno(turnoID: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancelar Turno',
        message: '¿Estás seguro de que deseas cancelar este turno?',
        confirmText: 'Cancelar',
        cancelText: 'No'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.savingTurnoCancelar.set(true);
        this.turnosService.cancelar(turnoID).subscribe({
          next: () => {
            const pacienteID = this.paciente()?.id;
            if (pacienteID) {
              this.cargarTurnosParaVistaActual(pacienteID, this.mascotaSeleccionadaId());
            }
            this.savingTurnoCancelar.set(false);
            this.snackBar.open('Turno cancelado exitosamente', 'Cerrar', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          },
          error: () => {
            this.savingTurnoCancelar.set(false);
            this.snackBar.open('Error al cancelar el turno', 'Cerrar', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
        });
      }
    });
  }

  puedeEditarNotas(estado: string): boolean {
    return estado === 'RESERVADO' || estado === 'PENDIENTE';
  }

  puedeConfirmar(estado: string): boolean {
    return estado === 'RESERVADO';
  }

  puedeCancelar(estado: string): boolean {
    return estado === 'RESERVADO' || estado === 'PENDIENTE';
  }

  /** Extra de consulta mergeado: default del servicio + extra de consulta (consulta gana). */
  getConsultaMergedExtra(turno: Turno | null): Record<string, unknown> {
    if (!turno) return {};
    const actual = turno.consulta?.extra ?? {};
    return mergeExtra({}, actual);
  }

  /** Lista de campos extra de consulta para el turno actual (para inputs). */
  getConsultaCampos(turno: Turno | null): CampoExtraItem[] {
    const merged = this.getConsultaMergedExtra(turno);
    const options = this.consultaFieldOptions();
    if (this.estaEditandoNotas(turno?.id ?? 0)) {
      const draft = this.consultaEditando();
      const extra = draft?.extra ?? merged;
      return extraToCampos(extra, options);
    }
    return extraToCampos(merged, options);
  }

  /** Valor de un campo extra de consulta (lectura o draft en edición). */
  getConsultaCampoValor(turno: Turno | null, key: string): string | number {
    if (this.estaEditandoNotas(turno?.id ?? 0)) {
      const draft = this.consultaEditando();
      const v = draft?.extra?.[key];
      return v == null ? '' : (typeof v === 'string' || typeof v === 'number' ? v : String(v));
    }
    const merged = this.getConsultaMergedExtra(turno);
    const v = merged[key];
    return v == null ? '' : (typeof v === 'string' || typeof v === 'number' ? v : String(v));
  }

  /** Extra de ficha mergeado: default (del servicio del turno o de un servicio) + ficha.extra (ficha gana). */
  getFichaMergedExtra(): Record<string, unknown> {
    const ficha = this.fichaPacienteApi();
    const actual = ficha?.extra ?? {};
    return mergeExtra({}, actual);
  }

  /** Lista de campos extra de ficha para inputs. */
  getFichaCampos(): CampoExtraItem[] {
    const options = this.fichaFieldOptions();
    if (this.fichaExtraEditando()) {
      return extraToCampos(this.fichaExtraEditando()!, options);
    }
    return extraToCampos(this.getFichaMergedExtra(), options);
  }

  getFichaCampoValor(key: string): string | number {
    if (this.fichaExtraEditando()) {
      const v = this.fichaExtraEditando()![key];
      return v == null ? '' : (typeof v === 'string' || typeof v === 'number' ? v : String(v));
    }
    const v = this.getFichaMergedExtra()[key];
    return v == null ? '' : (typeof v === 'string' || typeof v === 'number' ? v : String(v));
  }

  /** True si la ficha tiene al menos un valor cargado (para mostrar "Sin datos" o no). */
  tieneValoresFicha(): boolean {
    const campos = this.getFichaCampos();
    if (campos.length === 0) return false;
    return campos.some(c => !!this.getFichaCampoValor(c.key));
  }

  /** Actualiza un valor del draft de consulta en edición. */
  actualizarConsultaExtraEditando(key: string, valor: string | number): void {
    const draft = this.consultaEditando();
    if (!draft) return;
    const extra = { ...draft.extra, [key]: valor === '' ? null : valor };
    this.consultaEditando.set({ ...draft, extra });
  }

  actualizarConsultaNotaEditando(nota: string): void {
    const draft = this.consultaEditando();
    if (!draft) return;
    this.consultaEditando.set({ ...draft, nota });
  }

  actualizarConsultaClinica(
    campo: 'motivoConsulta' | 'examenClinico' | 'diagnostico' | 'planTratamiento' | 'pesoKg',
    value: string
  ): void {
    const draft = this.consultaEditando();
    if (!draft) return;
    this.consultaEditando.set({ ...draft, [campo]: value });
  }

  getConsultaClinicaParaEdicion(
    campo: 'motivoConsulta' | 'examenClinico' | 'diagnostico' | 'planTratamiento'
  ): string {
    const turno = this.turnoActual();
    if (!turno) return '';
    if (this.estaEditandoNotas(turno.id)) {
      const d = this.consultaEditando();
      return (d?.[campo] as string) ?? '';
    }
    const v = turno.consulta?.[campo];
    return v == null ? '' : String(v);
  }

  getPesoKgParaEdicion(): string {
    const turno = this.turnoActual();
    if (!turno) return '';
    if (this.estaEditandoNotas(turno.id)) {
      return this.consultaEditando()?.pesoKg ?? '';
    }
    const p = turno.consulta?.pesoKg;
    if (p == null || p === '') return '';
    return typeof p === 'number' ? String(p) : String(p);
  }

  private draftDesdeTurno(turno: Turno, extra: Record<string, unknown>): ConsultaEdicionDraft {
    const c = turno.consulta;
    const nota = c?.nota ?? turno.notas ?? '';
    const pesoRaw = c?.pesoKg;
    const pesoKg =
      pesoRaw == null || pesoRaw === ''
        ? ''
        : typeof pesoRaw === 'number'
          ? String(pesoRaw)
          : String(pesoRaw);
    return {
      nota,
      extra,
      motivoConsulta: c?.motivoConsulta ?? '',
      examenClinico: c?.examenClinico ?? '',
      diagnostico: c?.diagnostico ?? '',
      planTratamiento: c?.planTratamiento ?? '',
      pesoKg
    };
  }

  private payloadClinicoApi(draft: ConsultaEdicionDraft): {
    motivoConsulta: string | null;
    examenClinico: string | null;
    diagnostico: string | null;
    planTratamiento: string | null;
    pesoKg: number | null;
  } {
    const trimOrNull = (s: string): string | null => {
      const t = (s ?? '').trim();
      return t === '' ? null : t;
    };
    const rawPeso = (draft.pesoKg ?? '').trim().replace(',', '.');
    let pesoKg: number | null = null;
    if (rawPeso !== '') {
      const n = parseFloat(rawPeso);
      if (Number.isFinite(n)) pesoKg = n;
    }
    return {
      motivoConsulta: trimOrNull(draft.motivoConsulta),
      examenClinico: trimOrNull(draft.examenClinico),
      diagnostico: trimOrNull(draft.diagnostico),
      planTratamiento: trimOrNull(draft.planTratamiento),
      pesoKg: rawPeso === '' ? null : pesoKg
    };
  }

  private cargarHistorialSidebarMascota(mascotaID: number | null): void {
    if (mascotaID == null) {
      this.historialSidebarVacunas.set([]);
      this.historialSidebarFiles.set([]);
      return;
    }
    this.loadingHistorialSidebar.set(true);
    this.mascotasService.getHistorialClinico(mascotaID).subscribe({
      next: (hc) => {
        this.historialSidebarVacunas.set(hc.vacunas ?? []);
        this.historialSidebarFiles.set(hc.files ?? []);
        this.loadingHistorialSidebar.set(false);
      },
      error: () => {
        this.historialSidebarVacunas.set([]);
        this.historialSidebarFiles.set([]);
        this.loadingHistorialSidebar.set(false);
      }
    });
  }

  /** Actualiza un valor del draft de ficha en edición. */
  actualizarFichaExtraEditando(key: string, valor: string | number): void {
    const draft = this.fichaExtraEditando();
    if (draft == null) return;
    this.fichaExtraEditando.set({ ...draft, [key]: valor === '' ? null : valor });
  }

  entrarEdicionNotas(): void {
    const turno = this.turnoActual();
    if (!turno) return;
    const merged = this.getConsultaMergedExtra(turno);
    const extra = { ...merged };
    if (turno.tipo === 'INTERNACION' && !Array.isArray(extra['internacion'])) {
      extra['internacion'] = [];
    }
    const draft = this.draftDesdeTurno(turno, extra);
    this.actualizarNotaEnEdicion(turno.id, draft.nota);
    this.consultaEditando.set(draft);
    this.editandoNotasTurnoID.set(turno.id);
  }

  salirEdicionNotas(): void {
    const turno = this.turnoActual();
    if (turno) {
      const merged = this.getConsultaMergedExtra(turno);
      const extra = { ...merged };
      if (turno.tipo === 'INTERNACION' && !Array.isArray(extra['internacion'])) {
        extra['internacion'] = [];
      }
      this.consultaEditando.set(this.draftDesdeTurno(turno, extra));
    } else {
      this.editandoNotasTurnoID.set(null);
      this.consultaEditando.set(null);
    }
  }

  entrarEdicionFicha(): void {
    const merged = this.getFichaMergedExtra();
    const keys = Object.keys(merged);
    const fichaOptions = this.fichaFieldOptions();
    const base =
      keys.length > 0
        ? merged
        : Object.fromEntries(fichaOptions.map(o => [o.key, null]));
    this.fichaExtraEditando.set({ ...base });
  }

  salirEdicionFicha(): void {
    this.fichaExtraEditando.set(null);
  }

  estaEditandoFicha(): boolean {
    return this.fichaExtraEditando() != null;
  }

  guardarNotasYSalir(turnoID: number): void {
    const draft = this.consultaEditando();
    const turno = this.turnosProximos().find(t => t.id === turnoID) ?? this.turnosAntiguos().find(t => t.id === turnoID);
    if (!turno) {
      this.editandoNotasTurnoID.set(null);
      this.consultaEditando.set(null);
      return;
    }
    this.savingConsulta.set(true);
    const nota = draft?.nota ?? turno.consulta?.nota ?? turno.notas ?? '';
    const extra = draft?.extra ?? turno.consulta?.extra ?? {};
    const mergedFallback = this.getConsultaMergedExtra(turno);
    const extraForClinicalDraft = { ...mergedFallback };
    if (turno.tipo === 'INTERNACION' && !Array.isArray(extraForClinicalDraft['internacion'])) {
      extraForClinicalDraft['internacion'] = [];
    }
    const clinicalDraft = draft ?? this.draftDesdeTurno(turno, extraForClinicalDraft);
    const clinical = this.payloadClinicoApi(clinicalDraft);
    const consultaBody = { nota, extra, ...clinical };

    if (turno.consultaID && turno.consulta) {
      this.consultasService.actualizar(turno.consulta.id, consultaBody).subscribe({
        next: (consultaActualizada) => {
          this.actualizarTurnoEnListas(turnoID, { consulta: consultaActualizada, consultaID: consultaActualizada.id, notas: nota });
          this.turnosService.actualizar(turnoID, { notas: nota }).subscribe({
            next: () => this.finGuardarConsulta(turnoID, nota),
            error: () => {
              this.savingConsulta.set(false);
              this.mostrarErrorGuardar('consulta');
            }
          });
        },
        error: () => {
          this.savingConsulta.set(false);
          this.mostrarErrorGuardar('consulta');
        }
      });
    } else {
      this.consultasService.crear({ ...consultaBody, turnoID }).subscribe({
        next: (consultaCreada) => {
          this.actualizarTurnoEnListas(turnoID, { consulta: consultaCreada, consultaID: consultaCreada.id, notas: nota });
          this.turnosService.actualizar(turnoID, { notas: nota, consultaID: consultaCreada.id }).subscribe({
            next: () => this.finGuardarConsulta(turnoID, nota),
            error: () => {
              this.savingConsulta.set(false);
              this.mostrarErrorGuardar('consulta');
            }
          });
        },
        error: () => {
          this.savingConsulta.set(false);
          this.mostrarErrorGuardar('consulta');
        }
      });
    }
  }

  private actualizarTurnoEnListas(turnoID: number, patch: Partial<Turno>): void {
    const prox = this.turnosProximos().map(t => t.id === turnoID ? { ...t, ...patch } : t);
    const ant = this.turnosAntiguos().map(t => t.id === turnoID ? { ...t, ...patch } : t);
    this.turnosProximos.set(prox);
    this.turnosAntiguos.set(ant);
    const lista = this.turnosListaCompletaMascota();
    if (lista.length > 0) {
      this.turnosListaCompletaMascota.set(
        lista.map((t) => (t.id === turnoID ? { ...t, ...patch } : t))
      );
    }
    const actual = this.turnoActual();
    if (actual?.id === turnoID) this.turnoActual.set({ ...actual, ...patch });
  }

  private finGuardarConsulta(turnoID: number, nota: string): void {
    this.savingConsulta.set(false);
    const actual = this.turnoActual();
    if (actual?.id === turnoID) {
      const merged = this.getConsultaMergedExtra(actual);
      const extra = { ...merged };
      if (actual.tipo === 'INTERNACION' && !Array.isArray(extra['internacion'])) {
        extra['internacion'] = [];
      }
      this.consultaEditando.set(this.draftDesdeTurno(actual, extra));
    } else {
      this.editandoNotasTurnoID.set(null);
      this.consultaEditando.set(null);
    }
    this.snackBar.open('Consulta guardada correctamente', 'Cerrar', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  private mostrarErrorGuardar(tipo: string): void {
    this.snackBar.open(`Error al guardar ${tipo}`, 'Cerrar', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  guardarFichaYSalir(): void {
    const draft = this.fichaExtraEditando();
    const ficha = this.fichaPacienteApi();
    const pacienteID = this.paciente()?.id;
    if (!pacienteID) {
      this.fichaExtraEditando.set(null);
      return;
    }
    if (!draft) {
      this.fichaExtraEditando.set(null);
      return;
    }
    this.savingFicha.set(true);
    if (ficha) {
      this.fichasService.actualizar(ficha.id, { extra: draft }).subscribe({
        next: (actualizada) => {
          this.fichaPacienteApi.set(actualizada);
          this.fichaExtraEditando.set(null);
          this.savingFicha.set(false);
          this.snackBar.open('Ficha guardada correctamente', 'Cerrar', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        },
        error: () => {
          this.savingFicha.set(false);
          this.mostrarErrorGuardar('ficha');
        }
      });
    } else {
      this.fichasService.crear({
        pacienteID,
        mascotaID: this.mascotaSeleccionadaId() ?? undefined,
        extra: draft
      }).subscribe({
        next: (creada) => {
          this.fichaPacienteApi.set(creada);
          this.fichaExtraEditando.set(null);
          this.savingFicha.set(false);
          this.snackBar.open('Ficha guardada correctamente', 'Cerrar', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        },
        error: () => {
          this.savingFicha.set(false);
          this.mostrarErrorGuardar('ficha');
        }
      });
    }
  }

  estaEditandoNotas(turnoID: number): boolean {
    return this.editandoNotasTurnoID() === turnoID;
  }

  /** Texto de la nota/indicaciones a mostrar en el textarea (edición). */
  getNotaParaEdicion(): string {
    const turno = this.turnoActual();
    if (!turno) return '';
    if (this.estaEditandoNotas(turno.id)) {
      const draft = this.consultaEditando();
      return draft?.nota ?? '';
    }
    return turno.consulta?.nota ?? turno.notas ?? '';
  }

  /** Notas de internación (solo cuando turno es INTERNACION y estamos editando). */
  getInternacionNotas(): Array<{ fecha?: string; nota?: string }> {
    const draft = this.consultaEditando();
    const arr = draft?.extra?.['internacion'];
    return Array.isArray(arr) ? arr : [];
  }

  /** Notas de internación para solo lectura (desde consulta del turno). */
  getInternacionNotasLectura(): Array<{ fecha?: string; nota?: string }> {
    const turno = this.turnoActual();
    if (!turno?.consulta?.extra) return [];
    const arr = turno.consulta.extra['internacion'];
    return Array.isArray(arr) ? arr : [];
  }

  addInternacionNota(): void {
    const draft = this.consultaEditando();
    if (!draft) return;
    const arr = Array.isArray(draft.extra?.['internacion']) ? [...draft.extra['internacion']] : [];
    arr.push({ fecha: new Date().toISOString().slice(0, 10), nota: '' });
    this.consultaEditando.set({ ...draft, extra: { ...draft.extra, internacion: arr } });
  }

  updateInternacionNota(index: number, field: 'fecha' | 'nota', value: string): void {
    const draft = this.consultaEditando();
    if (!draft) return;
    const arr = Array.isArray(draft.extra?.['internacion']) ? [...draft.extra['internacion']] : [];
    if (index < 0 || index >= arr.length) return;
    arr[index] = { ...arr[index], [field]: value };
    this.consultaEditando.set({ ...draft, extra: { ...draft.extra, internacion: arr } });
  }

  removeInternacionNota(index: number): void {
    const draft = this.consultaEditando();
    if (!draft) return;
    const arr = Array.isArray(draft.extra?.['internacion']) ? [...draft.extra['internacion']] : [];
    arr.splice(index, 1);
    this.consultaEditando.set({ ...draft, extra: { ...draft.extra, internacion: arr } });
  }

  /** Mascota con al menos un co-tutor adicional (pareja / mismo hogar). */
  esMascotaCompartida(m: Mascota): boolean {
    return (m.coTutores?.length ?? 0) > 0;
  }

  abrirMascotaForm(mascota?: Mascota | null): void {
    const pacienteID = this.paciente()?.id;
    if (!pacienteID) return;
    import('../../../components/shared/mascota-form-dialog/mascota-form-dialog').then(module => {
      this.dialog.open(module.MascotaFormDialogComponent, {
        width: '600px',
        maxWidth: '94vw',
        panelClass: 'mascota-form-dialog-panel',
        data: { pacienteID, mascota }
      }).afterClosed().subscribe((saved) => {
        if (saved === true) {
          this.cargarMascotas(pacienteID);
          this.snackBar.open('Mascota guardada', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        } else if (saved === 'co-tutores') {
          this.cargarMascotas(pacienteID);
          this.snackBar.open('Co-tutores actualizados', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
    });
  }

  /** Abre la agenda semanal en modal (todos los turnos) y precarga tutor/mascota al elegir horario. */
  abrirCrearTurno(): void {
    const pacienteID = this.paciente()?.id;
    if (pacienteID == null) return;
    const data: TurnoAgendaModalData = {
      tutorID: pacienteID,
      mascotaID: this.mascotaSeleccionadaId()
    };
    this.dialog
      .open(TurnoAgendaModalComponent, {
        width: '90vw',
        maxWidth: '90vw',
        height: '90vh',
        panelClass: 'full-screen-dialog',
        data
      })
      .afterClosed()
      .subscribe(() => {
        const mid = this.mascotaSeleccionadaId();
        this.cargarTurnosParaVistaActual(pacienteID, mid ?? undefined);
        this.cargarHistorialSidebarMascota(mid);
      });
  }

  /** Abre el modal de vacunas de la mascota seleccionada. */
  abrirModalVacunas(): void {
    const mascotaID = this.mascotaSeleccionadaId();
    if (mascotaID == null) return;
    const mascota = this.mascotas().find(m => m.id === mascotaID);
    const mascotaNombre = mascota?.nombre ?? 'Mascota';
    import('../../../components/shared/vacunas-mascota-dialog/vacunas-mascota-dialog').then(module => {
      this.dialog.open(module.VacunasMascotaDialogComponent, {
        width: '480px',
        maxWidth: '90vw',
        data: { mascotaID, mascotaNombre }
      }).afterClosed().subscribe(() => {
        this.cargarHistorialSidebarMascota(mascotaID);
      });
    });
  }

  /** Edita la mascota actualmente seleccionada en el select. */
  editarMascotaSeleccionada(): void {
    const mascotaID = this.mascotaSeleccionadaId();
    if (mascotaID == null) return;
    const mascota = this.mascotas().find(m => m.id === mascotaID);
    if (mascota) this.abrirMascotaForm(mascota);
  }

  abrirVacunaForm(mascotaID: number, vacuna?: Vacuna | null): void {
    import('../../../components/shared/vacuna-form-dialog/vacuna-form-dialog').then(module => {
      this.dialog.open(module.VacunaFormDialogComponent, {
        width: '440px',
        maxWidth: '90vw',
        data: { mascotaID, vacuna }
      }).afterClosed().subscribe((saved) => {
        if (saved) {
          this.vacunasPorMascotaId.set({ ...this.vacunasPorMascotaId(), [mascotaID]: [] });
          this.vacunasService.listarPorMascota(mascotaID).subscribe(lista => {
            this.vacunasPorMascotaId.set({ ...this.vacunasPorMascotaId(), [mascotaID]: lista });
          });
          this.cargarHistorialSidebarMascota(mascotaID);
          this.snackBar.open('Vacuna guardada', 'Cerrar', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        }
      });
    });
  }

  verDetalleTurno(turno: Turno): void {
    this.turnoActual.set(turno);
    this.dialog.open(TurnoDetalleModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: {
        turno: turno
      }
    });
  }

  abrirDialogoCargarFicha(): void {
    // Importar dinámicamente el componente de diálogo
    import('../../../components/shared/ficha-paciente-dialog/ficha-paciente-dialog').then(module => {
      const pacienteID = this.paciente()?.id;
      if (!pacienteID) return;

      const dialogRef = this.dialog.open(module.FichaPacienteDialogComponent, {
        width: '600px',
        maxWidth: '90vw',
        data: {
          ficha: this.fichaPaciente(),
          pacienteID: pacienteID
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.fichaPaciente.set(result);
          this.guardarFichaEnLocalStorage(pacienteID, result);
          this.snackBar.open('Ficha de la mascota guardada exitosamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
    });
  }

  abrirDialogoArchivosConsulta(): void {
    const turno = this.turnoActual();
    const pacienteID = this.paciente()?.id;
    const mascotaID = this.mascotaSeleccionadaId();
    if (!turno || !pacienteID || mascotaID == null) return;

    import('../../../components/shared/imagenes-paciente-dialog/imagenes-paciente-dialog').then(module => {
      this.dialog.open(module.ImagenesPacienteDialogComponent, {
        width: '800px',
        maxWidth: '90vw',
        data: {
          pacienteID,
          mascotaID,
          turnoID: turno.id
        }
      }).afterClosed().subscribe((result) => {
        if (result) {
          this.cargarArchivosTurnoActual();
          this.cargarHistorialSidebarMascota(this.mascotaSeleccionadaId());
          this.snackBar.open('Archivos de la consulta actualizados', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
    });
  }

  calcularEdad(fechaNacimiento?: string): number | null {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  formatearFechaCorta(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  obtenerPesoActual(): string {
    const turno = this.turnoActual();
    if (!turno) return '-';
    const v = this.getConsultaCampoValor(turno, 'peso');
    return v === '' ? '-' : String(v);
  }

  obtenerTalla(): string {
    const turno = this.turnoActual();
    if (!turno) return '-';
    const v = this.getConsultaCampoValor(turno, 'altura');
    return v === '' ? '-' : String(v);
  }

  obtenerUltimaConsulta(): string {
    const turnosAntiguos = this.turnosAntiguos();
    if (turnosAntiguos.length === 0) return '-';
    const masReciente = [...turnosAntiguos].sort((a, b) =>
      b.horaInicio.localeCompare(a.horaInicio)
    )[0];
    return this.formatearFechaCorta(masReciente.horaInicio);
  }

  obtenerProximoTurno(): Turno | null {
    const turnosProximos = this.turnosProximos();
    if (turnosProximos.length === 0) return null;
    return [...turnosProximos].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))[0];
  }

  /** Fecha local YYYY-MM-DD para comparar con el campo fecha de los turnos. */
  fechaHoyLocal(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  etiquetaEstadoTurno(estado: Turno['estado']): string {
    const map: Record<Turno['estado'], string> = {
      RESERVADO: 'Reservado',
      PENDIENTE: 'Pendiente',
      COMPLETADO: 'Completado',
      CANCELADO: 'Cancelado',
      BAJA: 'Baja'
    };
    return map[estado] ?? estado;
  }

  claseMarcadorEstado(estado: Turno['estado']): string {
    return `timeline-marker--${estado.toLowerCase()}`;
  }

  private truncarMotivo(texto: string, max: number): string {
    const t = texto.replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max - 1)}…`;
  }

  seleccionarTurno(turno: Turno): void {
    this.turnoActual.set(turno);
    this.entrarEdicionNotas();
    this.cargarArchivosTurnoActual();
  }

  cargarArchivosTurnoActual(): void {
    const turno = this.turnoActual();
    const pacienteID = this.paciente()?.id;
    const mascotaID = this.mascotaSeleccionadaId();
    if (!turno || !pacienteID || mascotaID == null) {
      this.archivosTurnoActual.set([]);
      return;
    }
    this.loadingArchivosTurno.set(true);
    this.filesService.listar({
      pacienteID,
      mascotaID,
      turnoID: turno.id,
      page: 1,
      pageSize: 50
    }).subscribe({
      next: (res) => {
        this.archivosTurnoActual.set(res.data);
        this.loadingArchivosTurno.set(false);
      },
      error: () => this.loadingArchivosTurno.set(false)
    });
  }

  eliminarArchivoTurno(fileId: number): void {
    this.filesService.eliminar(fileId).subscribe({
      next: () => {
        this.cargarArchivosTurnoActual();
        this.cargarHistorialSidebarMascota(this.mascotaSeleccionadaId());
      },
      error: () => {
        this.snackBar.open('Error al eliminar el archivo', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }

  imprimirHistorialClinico(): void {
    const pacienteID = this.paciente()?.id;
    const mascotaID = this.mascotaSeleccionadaId();
    if (!pacienteID) return;
    this.loadingPdfHistorial.set(true);
    if (mascotaID != null) {
      this.mascotasService.getHistorialClinico(mascotaID).subscribe({
        next: (hc) => {
          const paciente = (hc.mascota as unknown as { paciente?: ResumenHistorialClinico['paciente'] }).paciente ?? {
            id: pacienteID,
            nombre: this.paciente()!.nombre,
            dni: this.paciente()!.dni,
            telefono: this.paciente()!.telefono,
            email: this.paciente()!.email
          };
          const resumen: ResumenHistorialClinico & { mascota?: { nombre: string } } = {
            paciente,
            ficha: hc.ficha,
            turnos: hc.turnos as ResumenHistorialClinico['turnos'],
            vacunas: hc.vacunas,
            files: hc.files,
            filesCount: hc.filesCount
          };
          if (hc.mascota?.nombre) resumen.mascota = { nombre: hc.mascota.nombre };
          this.generarPdfHistorialClinico(resumen);
        },
        error: () => {
          this.loadingPdfHistorial.set(false);
          this.snackBar.open('Error al obtener historial clínico de la mascota', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
    } else {
      this.pacientesService.getResumenHistorialClinico(pacienteID).subscribe({
        next: (resumen) => this.generarPdfHistorialClinico(resumen),
        error: () => {
          this.loadingPdfHistorial.set(false);
          this.snackBar.open('Error al obtener datos para el historial clínico', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
    }
  }

  private generarPdfHistorialClinico(resumen: ResumenHistorialClinico & { mascota?: { nombre: string } }): void {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      let y = 0;
      const margin = 16;
      const lineHeight = 5.2;
      const maxW = pageW - margin * 2;
      const primary: [number, number, number] = [21, 101, 192];
      const lineMuted: [number, number, number] = [229, 231, 235];
      const fillHeader: [number, number, number] = [241, 248, 255];

      const wrap = (text: string, maxWidth: number): string[] => {
        const lines = doc.splitTextToSize(text || '', maxWidth);
        return Array.isArray(lines) ? lines : [lines];
      };

      const newPageIfNeeded = (minSpace: number) => {
        if (y + minSpace > pageH - 12) {
          doc.addPage();
          y = margin;
        }
      };

      const sectionTitle = (title: string) => {
        newPageIfNeeded(lineHeight * 3);
        y += 2;
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81);
        doc.text(title.toUpperCase(), margin, y);
        y += 3.5;
        doc.setDrawColor(...lineMuted);
        doc.setLineWidth(0.35);
        doc.line(margin, y, margin + maxW, y);
        y += 5;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
      };

      // Franja institucional
      doc.setFillColor(...primary);
      doc.rect(0, 0, pageW, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Historial clínico', margin, 12);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Veterinaria Balbi · Documento clínico', margin, 18);
      doc.setTextColor(0, 0, 0);
      y = 28;

      // Resumen tutor / mascota
      const boxH = resumen.mascota?.nombre ? 15 : 11;
      newPageIfNeeded(boxH + 4);
      doc.setDrawColor(...lineMuted);
      doc.setLineWidth(0.25);
      doc.roundedRect(margin, y, maxW, boxH, 2, 2, 'S');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(resumen.paciente.nombre || 'Tutor', margin + 3, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      if (resumen.mascota?.nombre) {
        doc.text(`Mascota: ${resumen.mascota.nombre}`, margin + 3, y + 11);
      }
      doc.setTextColor(0, 0, 0);
      y += boxH + 6;

      sectionTitle('Datos del tutor');
      const datosPac = [
        `Nombre: ${resumen.paciente.nombre || '-'}`,
        `DNI: ${resumen.paciente.dni || '-'}`,
        `Teléfono: ${resumen.paciente.telefono || '-'}`,
        `Email: ${resumen.paciente.email || '-'}`
      ];
      datosPac.forEach((line) => {
        newPageIfNeeded(lineHeight);
        doc.text(line, margin, y);
        y += lineHeight;
      });
      y += 3;

      if (resumen.ficha) {
        sectionTitle('Ficha de la mascota');
        if (resumen.ficha.notas) {
          wrap(resumen.ficha.notas, maxW).forEach((l) => {
            newPageIfNeeded(lineHeight);
            doc.text(l, margin, y);
            y += lineHeight;
          });
        }
        if (resumen.ficha.extra && typeof resumen.ficha.extra === 'object') {
          const fichaOptions = this.fichaFieldOptions();
          Object.entries(resumen.ficha.extra).forEach(([key, val]) => {
            if (val == null) return;
            const label = fichaOptions.find((o) => o.key === key)?.label ?? key;
            const text = `${label}: ${String(val)}`;
            wrap(text, maxW).forEach((l) => {
              newPageIfNeeded(lineHeight);
              doc.text(l, margin, y);
              y += lineHeight;
            });
          });
        }
        y += 3;
      }

      const inner = margin + 3;
      const innerW = maxW - 6;

      const pdfBloqueClinico = (label: string, texto: string | null | undefined) => {
        if (!texto || String(texto).trim() === '') return;
        newPageIfNeeded(lineHeight * 2);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(`${label}:`, inner, y);
        y += lineHeight;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        wrap(String(texto), innerW).forEach((l) => {
          newPageIfNeeded(lineHeight);
          doc.text(l, inner, y);
          y += lineHeight;
        });
      };

      sectionTitle('Historial de turnos y consultas');
      resumen.turnos.forEach((t, idx) => {
        const fecha = t.horaInicio
          ? new Date(t.horaInicio).toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '-';
        const headText = `${idx + 1}.  ${fecha}  ·  ${t.servicio?.nombre || 'Servicio'}  ·  ${t.profesional?.nombre || 'Profesional'}  ·  ${t.estado}`;
        const headLines = wrap(headText, maxW - 8);
        const bandH = Math.max(8, 4 + headLines.length * lineHeight);

        newPageIfNeeded(bandH + 20);
        y += 1;
        const y0 = y;
        doc.setFillColor(...fillHeader);
        doc.setDrawColor(187, 222, 251);
        doc.roundedRect(margin, y0, maxW, bandH, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.8);
        doc.setTextColor(...primary);
        let yLine = y0 + 5;
        headLines.forEach((hl) => {
          doc.text(hl, margin + 3, yLine);
          yLine += lineHeight;
        });
        doc.setTextColor(0, 0, 0);
        y = y0 + bandH + 4;

        const c = t.consulta;
        if (c) {
          pdfBloqueClinico('Motivo de consulta', c.motivoConsulta ?? undefined);
          pdfBloqueClinico('Examen clínico', c.examenClinico ?? undefined);
          if (c.pesoKg != null && c.pesoKg !== '') {
            newPageIfNeeded(lineHeight * 2);
            doc.setFont('helvetica', 'bold');
            doc.text('Peso (kg):', inner, y);
            y += lineHeight;
            doc.setFont('helvetica', 'normal');
            doc.text(String(c.pesoKg), inner, y);
            y += lineHeight;
          }
          pdfBloqueClinico('Diagnóstico', c.diagnostico ?? undefined);
          pdfBloqueClinico('Plan / tratamiento', c.planTratamiento ?? undefined);
        }
        if (t.consulta?.nota) {
          wrap(t.consulta.nota, maxW).forEach((l) => {
            newPageIfNeeded(lineHeight);
            doc.text(l, margin, y);
            y += lineHeight;
          });
        }
        if (t.consulta?.extra && typeof t.consulta.extra === 'object') {
          const consultaOptions = this.consultaFieldOptions();
          Object.entries(t.consulta.extra).forEach(([key, val]) => {
            if (val == null) return;
            const label = consultaOptions.find((o) => o.key === key)?.label ?? key;
            wrap(`${label}: ${String(val)}`, maxW).forEach((l) => {
              newPageIfNeeded(lineHeight);
              doc.text(l, margin, y);
              y += lineHeight;
            });
          });
        }
        if (t.notas && !t.consulta?.nota) {
          wrap(`Notas: ${t.notas}`, maxW).forEach((l) => {
            newPageIfNeeded(lineHeight);
            doc.text(l, margin, y);
            y += lineHeight;
          });
        }

        y += 3;
        doc.setDrawColor(...lineMuted);
        doc.setLineWidth(0.2);
        doc.line(margin, y, margin + maxW, y);
        y += 4;
      });

      if (resumen.vacunas && resumen.vacunas.length > 0) {
        sectionTitle('Vacunas');
        for (const v of resumen.vacunas) {
          const prox = v.proximaDosis ? ` · Próx.: ${v.proximaDosis}` : '';
          const line = `· ${v.nombre} — ${v.fechaAplicacion}${prox}`;
          wrap(line, maxW).forEach((l) => {
            newPageIfNeeded(lineHeight);
            doc.text(l, margin, y);
            y += lineHeight;
          });
        }
        y += 4;
      }

      if (resumen.files && resumen.files.length > 0) {
        sectionTitle('Archivos adjuntos');
        for (const f of resumen.files) {
          const tipo = f.tipoArchivo || 'Archivo';
          const turnoRef = f.turnoID != null ? ` · Turno #${f.turnoID}` : '';
          const fechaF = f.createdAt
            ? new Date(f.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : '';
          const line = `· ${f.nombreArchivo || 'Sin nombre'} (${tipo})${turnoRef}${fechaF ? ` · ${fechaF}` : ''}`;
          wrap(line, maxW).forEach((l) => {
            newPageIfNeeded(lineHeight);
            doc.text(l, margin, y);
            y += lineHeight;
          });
        }
        y += 4;
      }

      const nombreArchivo = `historial-clinico-${(resumen.paciente.nombre || 'tutor').replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(nombreArchivo);
      this.loadingPdfHistorial.set(false);
      this.snackBar.open('PDF generado correctamente', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }).catch(() => {
      this.loadingPdfHistorial.set(false);
      this.snackBar.open('Error al generar el PDF', 'Cerrar', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
    });
  }

  calcularDiasDesde(fecha: string): number {
    const hoy = new Date();
    const fechaTurno = new Date(fecha);
    const diffTime = Math.abs(hoy.getTime() - fechaTurno.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  obtenerTipoConsulta(turno: Turno): string {
    // Si es un turno próximo, mostrar "Próximo"
    const esProximo = this.turnosProximos().some(t => t.id === turno.id);
    if (esProximo) {
      return 'Próximo';
    }
    // Determinar el tipo de consulta basado en el historial
    const historial = this.historialRegistros();
    const fechaTurno = turno.horaInicio.split('T')[0];
    const registro = historial.find(r => r.fecha === fechaTurno);
    if (registro) {
      if (registro.numeroConsulta) {
        return `${registro.tipo} ${registro.numeroConsulta}`;
      }
      return registro.tipo;
    }
    // Si no hay registro, buscar en el índice de turnos antiguos
    const turnosAntiguos = this.turnosAntiguos();
    const index = turnosAntiguos.findIndex(t => t.id === turno.id);
    if (index !== -1 && index === turnosAntiguos.length - 1) {
      return '1° Vez. Plan 1/5 COMPROMISO';
    }
    return `CONTROL ${turnosAntiguos.length - index}/5`;
  }

  /**
   * Historial del sidebar: misma lista que el GET por-mascota (orden desc. por hora),
   * sin depender de partir próximos/antiguos (evita perder filas por tipos o lógica de fechas).
   */
  historialTurnosParaSidebar(): HistorialTurnoSidebarItem[] {
    const hoy = this.fechaHoyLocal();
    const completa = this.turnosListaCompletaMascota();
    const base =
      completa.length > 0
        ? [...completa]
        : [...this.turnosProximos(), ...this.turnosAntiguos()];
    base.sort((a, b) => b.horaInicio.localeCompare(a.horaInicio));

    const mapTurno = (t: Turno, esProximo: boolean): HistorialTurnoSidebarItem => {
      const fecha = this.ymdCalendarioTurno(t.horaInicio);
      const hora = this.horaCortaDesdeTurno(t.horaInicio);
      const motivoRaw = t.consulta?.motivoConsulta?.trim();
      const servicioNombre = t.servicio?.nombre?.trim() || 'Consulta';
      const mn = t.mascota?.nombre?.trim();
      const esp = t.mascota?.especie?.trim();
      const mascotaLinea =
        mn && esp ? `${mn} (${esp})` : mn ? mn : '';

      return {
        turno: t,
        fecha,
        hora,
        profesional: t.profesional?.nombre ?? 'Profesional',
        esProximo,
        esHoy: fecha === hoy,
        servicioNombre,
        mascotaLinea,
        motivoLinea: motivoRaw ? this.truncarMotivo(motivoRaw, 80) : null,
        estado: t.estado,
        estadoLabel: this.etiquetaEstadoTurno(t.estado)
      };
    };

    return base.map((t) =>
      mapTurno(t, this.ymdCalendarioTurno(t.horaInicio) >= hoy)
    );
  }

  /**
   * Historial completo para el timeline: turnos por venir (próximos) primero,
   * luego los registros pasados del historial de HC.
   */
  historialRegistrosCompleto(): HistorialRegistro[] {
    const proximos = this.turnosProximos();
    const pasados = this.historialRegistros();

    const registrosProximos: HistorialRegistro[] = proximos.map(turno => {
      const fechaHora = turno.horaInicio.split('T');
      const fecha = fechaHora[0];
      const hora = fechaHora[1]?.substring(0, 5) || '00:00';
      return {
        id: `prox_${turno.id}`,
        fecha,
        hora,
        tipo: 'Próximo',
        profesional: turno.profesional?.nombre || 'Profesional',
        descripcion: turno.servicio?.nombre,
        esProximo: true
      };
    });

    // Ordenar próximos por fecha ascendente (el más cercano primero)
    registrosProximos.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

    return [...registrosProximos, ...pasados];
  }

  /** Indica si un turno es próximo (por venir) para estilos en la lista. */
  esTurnoProximo(turno: Turno): boolean {
    return this.turnosProximos().some(t => t.id === turno.id);
  }

}
