import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { LoadingSpinnerComponent } from '../../../components/shared/loading-spinner/loading-spinner';
import { MascotasService } from '../../../services/mascotas.service';
import { PacientesService, Paciente } from '../../../services/pacientes.service';

@Component({
  selector: 'app-mascotas-agregar',
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
  templateUrl: './mascotas.agregar.html',
  styleUrl: './mascotas.agregar.scss'
})
export class MascotasAgregarComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  loadingData = signal(true);
  error = signal<string | null>(null);
  tutores: Paciente[] = [];

  constructor(
    private fb: FormBuilder,
    private mascotasService: MascotasService,
    private pacientesService: PacientesService,
    private router: Router
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
        this.loadingData.set(false);
      },
      error: () => this.loadingData.set(false)
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const value = this.form.value;
    this.mascotasService.crear({
      pacienteID: value.pacienteID,
      nombre: value.nombre?.trim(),
      especie: value.especie?.trim() || null,
      raza: value.raza?.trim() || null,
      fechaNacimiento: value.fechaNacimiento || null,
      notas: value.notas?.trim() || null
    }).subscribe({
      next: () => this.router.navigate(['/mascotas']),
      error: (err: { error?: { error?: string } }) => {
        this.error.set(err.error?.error || 'Error al crear mascota');
        this.loading.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/mascotas']);
  }
}
