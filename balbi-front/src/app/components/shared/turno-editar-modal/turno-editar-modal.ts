import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { PacientesService, type Paciente } from '../../../services/pacientes.service';
import { ProfesionalesService } from '../../../services/profesionales.service';
import { ServiciosService } from '../../../services/servicios.service';
import { TurnosService, type Turno } from '../../../services/turnos.service';
import { MascotasService, type Mascota } from '../../../services/mascotas.service';
import { HorariosService, type Horario } from '../../../services/horarios.service';

export interface TurnoEditarModalData {
  turno: Turno;
}

@Component({
  selector: 'app-turno-editar-modal',
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
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './turno-editar-modal.html',
  styleUrl: './turno-editar-modal.scss'
})
export class TurnoEditarModalComponent implements OnInit {
  dialogRef = inject(MatDialogRef<TurnoEditarModalComponent>);
  data = inject<TurnoEditarModalData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private turnosService = inject(TurnosService);
  private pacientesService = inject(PacientesService);
  private profesionalesService = inject(ProfesionalesService);
  private serviciosService = inject(ServiciosService);
  private mascotasService = inject(MascotasService);
  private horariosService = inject(HorariosService);
  private router = inject(Router);

  form: FormGroup;
  loading = false;
  loadingData = true;
  error: string | null = null;
  turnoId: number;

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
    this.turnoId = this.data.turno.id;

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
      estado: ['RESERVADO', Validators.required],
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
    this.pacienteSearchControl.valueChanges.subscribe((value: Paciente | string | null) => {
      // Si el valor es un objeto Paciente, no hacer búsqueda (ya está seleccionado)
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

  /** Si el turno elegido cae fuera del horario de atención del profesional. */
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

  async ngOnInit(): Promise<void> {
    this.loadingData = true;
    const turno = this.data.turno;
    
    try {
      // Cargar pacientes primero para tener la lista disponible
      await this.loadPacientes();

      // Cargar el resto de opciones en paralelo
      await Promise.all([
        this.loadProfesionales(),
        this.loadServicios()
      ]);
    
    // Si hay pacienteID, intentar obtener el paciente completo del servicio si no está en la lista
    if (turno.pacienteID) {
      const pacienteEnLista = this.pacientes.find(p => p.id === turno.pacienteID);
      if (!pacienteEnLista) {
        try {
          const pacienteCompleto = await firstValueFrom(this.pacientesService.obtener(turno.pacienteID));
          if (pacienteCompleto && pacienteCompleto.id && pacienteCompleto.nombre && pacienteCompleto.dni) {
            this.pacientes.push(pacienteCompleto);
            this.pacientesFiltrados.push(pacienteCompleto);
          }
        } catch (error) {
          console.error('Error obteniendo paciente completo:', error);
        }
      }
    }

    // Parsear fecha/hora de inicio
    const horaInicio = new Date(turno.horaInicio.replace('Z', ''));
    horaInicio.setHours(horaInicio.getHours() - 3); // Ajustar a GMT-3

    // Configurar el formulario con los datos del turno
    this.form.patchValue({
      profesionalID: turno.profesionalID,
      servicioID: turno.servicioID,
      pacienteID: turno.pacienteID || null,
      mascotaID: turno.mascotaID ?? null,
      tipo: turno.tipo || 'CONSULTORIO',
      precio: turno.precio || null,
      fecha: horaInicio,
      hora: `${String(horaInicio.getHours()).padStart(2, '0')}:${String(horaInicio.getMinutes()).padStart(2, '0')}`,
      duracionMinutos: turno.duracionMinutos || 30,
      estado: turno.estado || 'RESERVADO',
      notas: turno.notas || null
    });

    // Configurar el paciente en el autocomplete si existe
    if (turno.pacienteID) {
      // Buscar el paciente en la lista cargada (ya debería estar si lo obtuvimos antes)
      let pacienteEncontrado = this.pacientes.find(p => p.id === turno.pacienteID);
      
      // Si aún no está en la lista pero viene en el turno con datos válidos, usarlo
      if (!pacienteEncontrado && turno.paciente && turno.paciente.id && turno.paciente.nombre && turno.paciente.dni) {
        const pacienteDesdeTurno: Paciente = {
          id: turno.paciente.id,
          nombre: turno.paciente.nombre,
          dni: turno.paciente.dni,
          telefono: turno.paciente.telefono,
          email: turno.paciente.email,
          estado: 'ACTIVO'
        };
        this.pacientes.push(pacienteDesdeTurno);
        this.pacientesFiltrados.push(pacienteDesdeTurno);
        pacienteEncontrado = pacienteDesdeTurno;
      }
      
      // Si encontramos el paciente con datos válidos, configurarlo en el autocomplete
      if (pacienteEncontrado && pacienteEncontrado.nombre && pacienteEncontrado.dni) {
        // Asegurarse de que el paciente esté en la lista filtrada
        if (!this.pacientesFiltrados.find(p => p.id === pacienteEncontrado!.id)) {
          this.pacientesFiltrados.push(pacienteEncontrado);
        }
        // Configurar el control con el objeto Paciente completo
        this.pacienteSearchControl.setValue(pacienteEncontrado, { emitEvent: false });
      } else {
        console.warn('No se pudo cargar el paciente para el turno', turno.pacienteID);
      }
    }

    if (turno.pacienteID) {
      try {
        const res = await firstValueFrom(this.mascotasService.listarPorPaciente(turno.pacienteID));
        this.mascotas = res.data || [];
      } catch {
        this.mascotas = [];
      }
    }

    // Cargar horarios del profesional del turno
    await this.loadHorariosProfesional(turno.profesionalID);

    } finally {
      this.loadingData = false;
    }
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
      // Usar pageSize grande para obtener todos los servicios para selección
      const response = await firstValueFrom(this.serviciosService.listar({ estado: 'ACTIVO', page: 1, pageSize: 1000 }));
      this.servicios = response.data;
    } catch (error) {
      console.error('Error cargando servicios:', error);
    }
  }

  async actualizar(): Promise<void> {
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
        estado: valores.estado,
        tipo: valores.tipo || 'CONSULTORIO'
      };

      if (valores.pacienteID) {
        turnoData.pacienteID = valores.pacienteID;
      } else {
        turnoData.pacienteID = null;
      }
      if (valores.mascotaID) {
        turnoData.mascotaID = valores.mascotaID;
      } else {
        turnoData.mascotaID = null;
      }
      if (valores.precio) {
        turnoData.precio = Number(valores.precio);
      } else {
        turnoData.precio = null;
      }
      if (valores.notas) {
        turnoData.notas = valores.notas;
      } else {
        turnoData.notas = null;
      }

      await firstValueFrom(this.turnosService.actualizar(this.turnoId, turnoData));
      this.dialogRef.close(true);
    } catch (error: any) {
      this.error = error?.error?.error || error?.message || 'Error al actualizar turno';
    } finally {
      this.loading = false;
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  /** Navega a la página de turnos del tutor y cierra el modal. */
  irATutorTurnos(): void {
    const pacienteID = this.form.get('pacienteID')?.value ?? this.data.turno.pacienteID;
    if (pacienteID) {
      this.dialogRef.close(false);
      this.router.navigate(['/pacientes', pacienteID, 'turnos']);
    }
  }

  displayTutor(paciente: Paciente | string | null): string {
    if (!paciente) return '';
    if (typeof paciente === 'string') return paciente; // Si es una cadena, devolverla tal cual (usuario escribiendo)
    if (typeof paciente === 'object' && 'id' in paciente && 'nombre' in paciente && 'dni' in paciente) {
      return `${paciente.nombre} - DNI ${paciente.dni}`;
    }
    return '';
  }

  onTutorSelected(event: any): void {
    const paciente = event.option?.value;
    if (paciente === null) {
      this.form.patchValue({ pacienteID: null, mascotaID: null });
      this.pacienteSearchControl.setValue(null, { emitEvent: false });
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
