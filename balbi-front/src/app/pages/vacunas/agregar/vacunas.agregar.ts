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
import { VacunasService } from '../../../services/vacunas.service';
import { MascotasService, Mascota } from '../../../services/mascotas.service';

@Component({
  selector: 'app-vacunas-agregar',
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
  templateUrl: './vacunas.agregar.html',
  styleUrl: './vacunas.agregar.scss'
})
export class VacunasAgregarComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  loadingData = signal(true);
  error = signal<string | null>(null);
  mascotas: Mascota[] = [];

  constructor(
    private fb: FormBuilder,
    private vacunasService: VacunasService,
    private mascotasService: MascotasService,
    private router: Router
  ) {
    this.form = this.fb.group({
      mascotaID: [null, [Validators.required]],
      nombre: ['', [Validators.required]],
      fechaAplicacion: [null, [Validators.required]],
      proximaDosis: [null],
      notas: ['']
    });
  }

  ngOnInit(): void {
    this.mascotasService.listar({ page: 1, pageSize: 500 }).subscribe({
      next: (res: { data: Mascota[] }) => {
        this.mascotas = res.data ?? [];
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
    const fechaAplicacion = value.fechaAplicacion instanceof Date
      ? value.fechaAplicacion.toISOString().slice(0, 10)
      : value.fechaAplicacion;
    const proximaDosis = value.proximaDosis
      ? (value.proximaDosis instanceof Date ? value.proximaDosis.toISOString().slice(0, 10) : value.proximaDosis)
      : null;
    this.vacunasService.crear({
      mascotaID: value.mascotaID,
      nombre: value.nombre?.trim(),
      fechaAplicacion: fechaAplicacion || '',
      proximaDosis,
      notas: value.notas?.trim() || null
    }).subscribe({
      next: () => this.router.navigate(['/vacunas']),
      error: (err: { error?: { error?: string } }) => {
        this.error.set(err.error?.error || 'Error al crear vacuna');
        this.loading.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/vacunas']);
  }
}
