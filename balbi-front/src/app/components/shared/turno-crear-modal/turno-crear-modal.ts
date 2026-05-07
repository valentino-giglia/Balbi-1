import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { PacientesService, type Paciente } from '../../../services/pacientes.service';
import { ProfesionalesService } from '../../../services/profesionales.service';
import { ServiciosService, type Servicio } from '../../../services/servicios.service';
import { TurnosService } from '../../../services/turnos.service';
import { MascotasService, type Mascota } from '../../../services/mascotas.service';
import { HorariosService, type Horario } from '../../../services/horarios.service';

export interface TurnoCrearModalData {
  fechaHoraInicial?: Date;
  /** Precargar tutor (p. ej. desde ficha del tutor) */
  pacienteID?: number;
  /** Precargar mascota si hay una seleccionada */
  mascotaID?: number | null;
}

@Component({
  selector: 'app-turno-crear-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './turno-crear-modal.html',
  styleUrl: './turno-crear-modal.scss'
})
export class TurnoCrearModalComponent implements OnInit {
  dialogRef = inject(MatDialogRef<TurnoCrearModalComponent>);
  data = inject<TurnoCrearModalData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private turnosService = inject(TurnosService);
  private pacientesService = inject(PacientesService);
  private profesionalesService = inject(ProfesionalesService);
  private serviciosService = inject(ServiciosService);
  private mascotasService = inject(MascotasService);
  private horariosService = inject(HorariosService);
  form: FormGroup;
  loading = false;
  loadingData = true;
  error: string | null = null;

  // Opciones para los selects
  pacientes: Paciente[] = [];
  pacientesFiltrados: Paciente[] = [];
  profesionales: any[] = [];
  servicios: any[] = [];
  mascotas: Mascota[] = [];

  /** Horarios de atención del profesional seleccionado */
  horariosProfesional: Horario[] = [];

  // Para el buscador de pacientes
  pacienteSearchSubject = new Subject<string>();
  pacienteSearchControl = this.fb.control<Paciente | string | null>(null);

  constructor() {
    this.form = this.fb.group({
      pacienteID: [null],
      mascotaID: [null],
      tipo: ['CONSULTORIO', Validators.required],
      profesionalID: [null, Validators.required],
      servicioID: [null, Validators.required],
      precio: [null],
      fecha: [null, Validators.required],
      hora: [null, Validators.required],
      duracionMinutos: [30, [Validators.required, Validators.min(1)]],
      notas: [null]
    });

    // Configurar el buscador de pacientes con debounce
    this.pacienteSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((searchTerm: string) => {
        if (!searchTerm || searchTerm.length < 2) {
          // Si el término de búsqueda es muy corto, cargar todos
          return this.pacientesService.listar({ estado: 'ACTIVO', page: 1, pageSize: 100 });
        }
        return this.pacientesService.listar({ 
          estado: 'ACTIVO', 
          nombre: searchTerm,
          page: 1, 
          pageSize: 100 
        });
      })
    ).subscribe({
      next: (response) => {
        this.pacientesFiltrados = response.data;
      },
      error: (error) => {
        console.error('Error buscando pacientes:', error);
        this.pacientesFiltrados = [];
      }
    });

    // Suscribirse a cambios en el control de búsqueda
    this.pacienteSearchControl.valueChanges.subscribe((value: string | Paciente | null) => {
      // Si el valor es un objeto Paciente, no hacer nada (ya está seleccionado)
      if (value && typeof value === 'object' && 'id' in value) {
        return;
      }
      
      const searchTerm = typeof value === 'string' ? value : '';
      if (!searchTerm || searchTerm.trim() === '') {
        // Si el campo está vacío, limpiar la selección y mostrar todos los pacientes
        this.form.patchValue({ pacienteID: null }, { emitEvent: false });
        this.pacientesFiltrados = this.pacientes;
      } else {
        // Si hay texto, buscar
        this.pacienteSearchSubject.next(searchTerm);
      }
    });

    // Cargar horarios cuando cambia el profesional
    this.form.get('profesionalID')?.valueChanges.subscribe((profesionalID: number | null) => {
      this.loadHorariosProfesional(profesionalID);
    });
  }


  async ngOnInit(): Promise<void> {
    this.loadingData = true;
    
    // Inicializar fecha y hora si viene del calendario
    const fechaInicial = this.data.fechaHoraInicial || new Date();
    const fecha = new Date(fechaInicial);
    const horaStr = `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
    this.form.patchValue({ fecha, hora: horaStr });

    try {
      await Promise.all([
        this.loadPacientes(),
        this.loadProfesionales(),
        this.loadServicios()
      ]);
      await this.aplicarPacienteMascotaPrecargados();
    } finally {
      this.loadingData = false;
    }

    // Si ya hay profesional seleccionado (p. ej. por valor por defecto), cargar sus horarios
    const pid = this.form.get('profesionalID')?.value;
    if (pid) this.loadHorariosProfesional(pid);
  }

  /** Precarga tutor/mascota cuando el modal se abre desde la ficha del tutor */
  private async aplicarPacienteMascotaPrecargados(): Promise<void> {
    const prePid = this.data.pacienteID;
    if (prePid == null) return;
    let paciente = this.pacientes.find((x) => x.id === prePid) ?? null;
    if (!paciente) {
      try {
        paciente = await firstValueFrom(this.pacientesService.obtener(prePid));
        if (paciente && !this.pacientes.some((x) => x.id === paciente!.id)) {
          this.pacientes = [...this.pacientes, paciente];
        }
      } catch {
        return;
      }
    }
    if (!paciente) return;
    this.form.patchValue({ pacienteID: prePid, mascotaID: null }, { emitEvent: false });
    this.pacienteSearchControl.setValue(paciente, { emitEvent: false });
    await this.loadMascotasPorPaciente(prePid);
    const preMid = this.data.mascotaID;
    if (typeof preMid === 'number' && this.mascotas.some((m) => m.id === preMid)) {
      this.form.patchValue({ mascotaID: preMid }, { emitEvent: false });
    }
  }

  private async loadHorariosProfesional(profesionalID: number | null): Promise<void> {
    if (!profesionalID) {
      this.horariosProfesional = [];
      return;
    }
    try {
      this.horariosProfesional = await firstValueFrom(this.horariosService.listar(profesionalID));
    } catch {
      this.horariosProfesional = [];
    }
  }

  /** Líneas de horarios de atención (un día por línea) para mostrar. */
  get horariosLineas(): string[] {
    if (!this.horariosProfesional.length) return [];
    const byDay = new Map<string, Array<{ start: string; end: string }>>();
    const order = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    for (const h of this.horariosProfesional) {
      if (!byDay.has(h.diaSemana)) byDay.set(h.diaSemana, []);
      byDay.get(h.diaSemana)!.push({
        start: this.formatHoraShort(h.horaInicio),
        end: this.formatHoraShort(h.horaFin)
      });
    }
    return order
      .filter((d) => byDay.has(d))
      .map((d) => `${d} ${byDay.get(d)!.map((r) => `${r.start}-${r.end}`).join(', ')}`);
  }

  private formatHoraShort(hora: string): string {
    const parts = hora.split(':');
    const h = parts[0] ?? '00';
    const m = (parts[1] ?? '00').slice(0, 2);
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  }

  /** Si el turno elegido (fecha + hora + duración) cae fuera del horario de atención del profesional. */
  get fueraDeHorarioProfesional(): boolean {
    const fecha = this.form.get('fecha')?.value as Date | null;
    const hora = this.form.get('hora')?.value as string | null;
    const duracionMinutos = this.form.get('duracionMinutos')?.value as number | null;
    if (!fecha || !hora || duracionMinutos == null || !this.horariosProfesional.length) return false;
    const [h, m] = hora.split(':').map(Number);
    const startMin = (h ?? 0) * 60 + (m ?? 0);
    const endMin = startMin + duracionMinutos;
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaNombre = diasSemana[new Date(fecha).getDay()];
    const horariosDelDia = this.horariosProfesional.filter((x) => x.diaSemana === diaNombre);
    if (!horariosDelDia.length) return true;
    const dentroDeAlguno = horariosDelDia.some((h2) => {
      const rStart = this.horaToMinutes(h2.horaInicio);
      const rEnd = this.horaToMinutes(h2.horaFin);
      return startMin >= rStart && endMin <= rEnd;
    });
    return !dentroDeAlguno;
  }

  private horaToMinutes(hora: string): number {
    const parts = hora.split(':').map(Number);
    return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  }

  async loadPacientes(): Promise<void> {
    try {
      // Cargar una cantidad inicial de pacientes
      const response = await firstValueFrom(this.pacientesService.listar({ estado: 'ACTIVO', page: 1, pageSize: 100 }));
      this.pacientes = response.data;
      this.pacientesFiltrados = response.data;
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    }
  }

  async loadProfesionales(): Promise<void> {
    try {
      // Usar pageSize grande para obtener todos los profesionales para selección
      const response = await firstValueFrom(this.profesionalesService.listar({ estado: 'ACTIVO', page: 1, pageSize: 1000 }));
      this.profesionales = response.data;
    } catch (error) {
      console.error('Error cargando profesionales:', error);
    }
  }

  async loadServicios(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.serviciosService.listar({ estado: 'ACTIVO', page: 1, pageSize: 1000 })
      ) as { data: Servicio[] };
      this.servicios = response.data;
    } catch (error) {
      console.error('Error cargando servicios:', error);
    }
  }

  async crear(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const valores = this.form.value;
      
      // Construir fecha/hora de inicio
      const fecha = new Date(valores.fecha);
      const [horas, minutos] = valores.hora.split(':').map(Number);
      fecha.setHours(horas, minutos, 0, 0);
      
      // Calcular fecha/hora de fin
      const fechaFin = new Date(fecha);
      fechaFin.setMinutes(fechaFin.getMinutes() + valores.duracionMinutos);

      const turnoData: any = {
        profesionalID: valores.profesionalID,
        servicioID: valores.servicioID,
        horaInicio: fecha.toISOString(),
        horaFin: fechaFin.toISOString(),
        duracionMinutos: valores.duracionMinutos,
        estado: 'RESERVADO',
        tipo: valores.tipo || 'CONSULTORIO'
      };

      if (valores.pacienteID) turnoData.pacienteID = valores.pacienteID;
      if (valores.mascotaID) turnoData.mascotaID = valores.mascotaID;
      if (valores.precio) turnoData.precio = Number(valores.precio);
      if (valores.notas) turnoData.notas = valores.notas;

      await firstValueFrom(this.turnosService.crear(turnoData));
      this.dialogRef.close(true);
    } catch (error: any) {
      this.error = error?.error?.error || error?.message || 'Error al crear turno';
    } finally {
      this.loading = false;
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  displayTutor(paciente: Paciente | null): string {
    if (!paciente) return '';
    const nombre = paciente.nombre || 'Sin nombre';
    const dni = paciente.dni || 'Sin DNI';
    return `${nombre} - DNI ${dni}`;
  }

  onTutorSelected(event: any): void {
    const paciente = event.option?.value;
    if (paciente === null) {
      this.form.patchValue({ pacienteID: null, mascotaID: null });
      this.pacienteSearchControl.setValue('', { emitEvent: false });
      this.mascotas = [];
    } else if (paciente && paciente.id) {
      this.form.patchValue({ pacienteID: paciente.id, mascotaID: null });
      this.pacienteSearchControl.setValue(paciente, { emitEvent: false });
      this.loadMascotasPorPaciente(paciente.id);
    }
  }

  private async loadMascotasPorPaciente(pacienteID: number): Promise<void> {
    try {
      const res = await firstValueFrom(this.mascotasService.listarPorPaciente(pacienteID));
      this.mascotas = res.data || [];
    } catch {
      this.mascotas = [];
    }
  }
}

