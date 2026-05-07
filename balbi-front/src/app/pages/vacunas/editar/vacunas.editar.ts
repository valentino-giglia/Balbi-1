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
import { VacunasService, Vacuna } from '../../../services/vacunas.service';
import { MascotasService, Mascota } from '../../../services/mascotas.service';

@Component({
  selector: 'app-vacunas-editar',
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
  templateUrl: './vacunas.editar.html',
  styleUrl: './vacunas.editar.scss'
})
export class VacunasEditarComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  loadingData = signal(true);
  error = signal<string | null>(null);
  mascotas: Mascota[] = [];

  constructor(
    private fb: FormBuilder,
    private vacunasService: VacunasService,
    private mascotasService: MascotasService,
    private router: Router,
    private route: ActivatedRoute
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
      },
      error: () => {}
    });
    const id = this.route.snapshot.params['id'];
    if (id) this.loadVacuna(Number(id));
  }

  loadVacuna(id: number): void {
    this.loadingData.set(true);
    this.vacunasService.obtener(id).subscribe({
      next: (data: Vacuna) => {
        this.form.patchValue({
          mascotaID: data.mascotaID,
          nombre: data.nombre,
          fechaAplicacion: data.fechaAplicacion ? new Date(data.fechaAplicacion + 'T12:00:00') : null,
          proximaDosis: data.proximaDosis ? new Date(data.proximaDosis + 'T12:00:00') : null,
          notas: data.notas ?? ''
        });
        this.loadingData.set(false);
      },
      error: () => {
        this.error.set('Error al cargar vacuna');
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
    const fechaAplicacion = value.fechaAplicacion instanceof Date
      ? value.fechaAplicacion.toISOString().slice(0, 10)
      : value.fechaAplicacion;
    const proximaDosis = value.proximaDosis
      ? (value.proximaDosis instanceof Date ? value.proximaDosis.toISOString().slice(0, 10) : value.proximaDosis)
      : null;
    this.vacunasService.actualizar(Number(id), {
      mascotaID: value.mascotaID,
      nombre: value.nombre?.trim(),
      fechaAplicacion: fechaAplicacion || '',
      proximaDosis,
      notas: value.notas?.trim() || null
    }).subscribe({
      next: () => this.router.navigate(['/vacunas']),
      error: (err: { error?: { error?: string } }) => {
        this.error.set(err.error?.error || 'Error al actualizar vacuna');
        this.loading.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/vacunas']);
  }
}
