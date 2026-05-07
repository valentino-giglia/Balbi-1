import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../components/shared/loading-spinner/loading-spinner';
import { ProfesionalesService } from '../../../services/profesionales.service';
import { HorariosService, Horario } from '../../../services/horarios.service';
import { ServiciosService, Servicio } from '../../../services/servicios.service';
import { forkJoin } from 'rxjs';
interface HorarioDia {
  horaInicio: string;
  horaFin: string;
  id?: string | number; // ID temporal o real
}

interface DiaSemana {
  nombre: string;
  codigo: string;
  horarios: HorarioDia[];
}

@Component({
  selector: 'app-profesionales-editar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './profesionales.editar.html',
  styleUrl: './profesionales.editar.scss'
})

export class ProfesionalesEditarComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  loadingData = signal(true);
  error = signal<string | null>(null);
  profesionalId: number | null = null;
  servicios = signal<Servicio[]>([]);
  serviciosSeleccionados = signal<number[]>([]);
  
  diasSemana: DiaSemana[] = [
    { nombre: 'Domingo', codigo: 'Domingo', horarios: [] },
    { nombre: 'Lunes', codigo: 'Lunes', horarios: [] },
    { nombre: 'Martes', codigo: 'Martes', horarios: [] },
    { nombre: 'Miércoles', codigo: 'Miércoles', horarios: [] },
    { nombre: 'Jueves', codigo: 'Jueves', horarios: [] },
    { nombre: 'Viernes', codigo: 'Viernes', horarios: [] },
    { nombre: 'Sábado', codigo: 'Sábado', horarios: [] }
  ];

  constructor(
    private fb: FormBuilder,
    private profesionalesService: ProfesionalesService,
    private horariosService: HorariosService,
    private serviciosService: ServiciosService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      codigo: [''],
      telefono: [''],
      email: ['', [Validators.email]],
      color: ['#1976d2'],
      detalles: ['']
    });

    this.form.get('nombre')?.valueChanges.subscribe((nombre: string) => {
      if (nombre) {
        this.form.patchValue({ codigo: this.generarCodigo(nombre) }, { emitEvent: false });
      } else {
        this.form.patchValue({ codigo: '' }, { emitEvent: false });
      }
    });
    this.cargarServicios();
  }

  cargarServicios(): void {
    this.serviciosService.listar({ estado: 'ACTIVO', pageSize: 1000 }).subscribe({
      next: (response) => {
        this.servicios.set(response.data);
      },
      error: () => {
        this.error.set('Error al cargar servicios');
      }
    });
  }

  onServiciosChange(servicioIds: number[]): void {
    this.serviciosSeleccionados.set(servicioIds);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.profesionalId = +id;
    this.loadProfesional(this.profesionalId);
  }

  loadProfesional(id: number): void {
    this.loadingData.set(true);
    this.profesionalesService.obtener(id).subscribe({
      next: (data) => {
        this.form.patchValue(data);
        // Si no hay código pero sí nombre, generar código automáticamente
        const nombre = data.nombre || this.form.get('nombre')?.value;
        if (nombre && !data.codigo) {
          this.form.patchValue({ codigo: this.generarCodigo(nombre) }, { emitEvent: false });
        }
        if (data.servicios && Array.isArray(data.servicios)) {
          this.serviciosSeleccionados.set(data.servicios.map((s: any) => s.id));
        }
        this.loadHorarios(id);
      },
      error: () => {
        this.error.set('Error al cargar veterinario');
        this.loadingData.set(false);
      }
    });
  }

  loadHorarios(profesionalID: number): void {
    this.horariosService.listar(profesionalID).subscribe({
      next: (horarios) => {
        // Resetear horarios
        this.diasSemana.forEach(dia => dia.horarios = []);
        
        // Cargar horarios existentes
        horarios.forEach(horario => {
          const dia = this.diasSemana.find(d => d.codigo === horario.diaSemana);
          if (dia) {
            // TIME viene como "HH:MM:SS", convertir a "HH:MM" para el input
            const horaInicio = this.formatearHoraParaInput(horario.horaInicio);
            const horaFin = this.formatearHoraParaInput(horario.horaFin);
            
            dia.horarios.push({
              horaInicio,
              horaFin,
              id: horario.id
            });
          }
        });
        
        this.loadingData.set(false);
      },
      error: () => {
        this.loadingData.set(false);
      }
    });
  }

  private formatearHoraParaInput(hora: string): string {
    // TIME viene como "HH:MM:SS" o "HH:MM", convertir a "HH:MM" para input type="time"
    if (hora.length >= 5) {
      return hora.substring(0, 5); // Toma solo "HH:MM"
    }
    return hora;
  }

  agregarHorario(dia: DiaSemana): void {
    dia.horarios.push({
      horaInicio: '09:00',
      horaFin: '17:00',
      id: `temp-${Date.now()}-${Math.random()}`
    });
  }

  eliminarHorario(dia: DiaSemana, index: number): void {
    dia.horarios.splice(index, 1);
  }

  duplicarHorario(dia: DiaSemana, horario: HorarioDia): void {
    dia.horarios.push({
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
      id: `temp-${Date.now()}-${Math.random()}`
    });
  }

  tieneHorarios(dia: DiaSemana): boolean {
    return dia.horarios.length > 0;
  }

  private generarCodigo(nombre: string): string {
    return nombre
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const id = this.route.snapshot.params['id'];
    this.profesionalesService.actualizar(id, this.form.value).subscribe({
      next: () => {
        const serviciosIds = this.serviciosSeleccionados();
        const horariosParaGuardar = this.obtenerHorariosParaGuardar(+id);
        
        const acciones = [];
        
        if (serviciosIds.length > 0) {
          acciones.push(this.profesionalesService.actualizarServicios(+id, serviciosIds));
        } else {
          acciones.push(this.profesionalesService.actualizarServicios(+id, []));
        }
        
        if (horariosParaGuardar.length > 0) {
          acciones.push(this.horariosService.crearMasivo(+id, horariosParaGuardar));
        }
        
        forkJoin(acciones).subscribe({
          next: () => {
            this.router.navigate(['/profesionales']);
          },
          error: (err) => {
            this.error.set(err.error?.error || 'Error al guardar datos adicionales');
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al actualizar veterinario');
        this.loading.set(false);
      }
    });
  }

  private obtenerHorariosParaGuardar(profesionalID: number): Omit<Horario, 'id' | 'createdAt' | 'updatedAt'>[] {
    const horarios: Omit<Horario, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
    this.diasSemana.forEach(dia => {
      dia.horarios.forEach(horario => {
        // Convertir formato "HH:MM" a "HH:MM:SS" para TIME
        const horaInicio = horario.horaInicio.length === 5 
          ? `${horario.horaInicio}:00` 
          : horario.horaInicio;
        const horaFin = horario.horaFin.length === 5 
          ? `${horario.horaFin}:00` 
          : horario.horaFin;
        
        horarios.push({
          profesionalID,
          diaSemana: dia.codigo,
          horaInicio,
          horaFin
        });
      });
    });
    
    return horarios;
  }

  cancelar(): void {
    this.router.navigate(['/profesionales']);
  }
}

