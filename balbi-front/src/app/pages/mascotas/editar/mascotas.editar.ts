import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { LoadingSpinnerComponent } from '../../../components/shared/loading-spinner/loading-spinner';
import { MascotasService, Mascota } from '../../../services/mascotas.service';
import { PacientesService, Paciente } from '../../../services/pacientes.service';

@Component({
  selector: 'app-mascotas-editar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './mascotas.editar.html',
  styleUrl: './mascotas.editar.scss'
})
export class MascotasEditarComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  loadingData = signal(true);
  error = signal<string | null>(null);
  tutores: Paciente[] = [];

  constructor(
    private fb: FormBuilder,
    private mascotasService: MascotasService,
    private pacientesService: PacientesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      pacienteID: [null, [Validators.required]],
      nombre: ['', [Validators.required]],
      especie: [''],
      raza: [''],
      fechaNacimiento: [null],
      notas: ['']
    });
  }

  ngOnInit(): void {
    this.pacientesService.listar({ estado: 'ACTIVO', page: 1, pageSize: 500 }).subscribe({
      next: (res: { data: Paciente[] }) => {
        this.tutores = res.data;
      },
      error: () => {}
    });
    const id = this.route.snapshot.params['id'];
    if (id) this.loadMascota(Number(id));
  }

  loadMascota(id: number): void {
    this.loadingData.set(true);
    this.mascotasService.obtener(id).subscribe({
      next: (data: Mascota) => {
        this.form.patchValue({
          pacienteID: data.pacienteID,
          nombre: data.nombre,
          especie: data.especie ?? '',
          raza: data.raza ?? '',
          fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento + 'T12:00:00') : null,
          notas: data.notas ?? ''
        });
        this.loadingData.set(false);
      },
      error: () => {
        this.error.set('Error al cargar mascota');
        this.loadingData.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const id = this.route.snapshot.params['id'];
    const value = this.form.value;
    this.mascotasService.actualizar(Number(id), {
      pacienteID: value.pacienteID,
      nombre: value.nombre?.trim(),
      especie: value.especie?.trim() || null,
      raza: value.raza?.trim() || null,
      fechaNacimiento: value.fechaNacimiento || null,
      notas: value.notas?.trim() || null
    }).subscribe({
      next: () => this.router.navigate(['/mascotas']),
      error: (err: { error?: { error?: string } }) => {
        this.error.set(err.error?.error || 'Error al actualizar mascota');
        this.loading.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/mascotas']);
  }
}
