import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LoadingSpinnerComponent } from '../../../components/shared/loading-spinner/loading-spinner';
import { ServiciosService } from '../../../services/servicios.service';

@Component({
  selector: 'app-servicios-editar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './servicios.editar.html',
  styleUrl: './servicios.editar.scss'
})
export class ServiciosEditarComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  loadingData = signal(true);
  error = signal<string | null>(null);
  codigoGenerado = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private serviciosService: ServiciosService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      codigo: ['', [Validators.required]],
      duracionMinutos: [30, [Validators.required, Validators.min(1)]],
      color: ['#1976d2', [Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)]],
      precio: [0, [Validators.required, Validators.min(0)]]
    });

    // Auto-generar código cuando cambia el nombre
    this.form.get('nombre')?.valueChanges.subscribe((nombre: string) => {
      if (nombre) {
        const codigo = this.generarCodigo(nombre);
        this.codigoGenerado.set(codigo);
        this.form.patchValue({ codigo }, { emitEvent: false });
      } else {
        this.codigoGenerado.set('');
      }
    });
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

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadServicio(id);
  }

  loadServicio(id: number): void {
    this.loadingData.set(true);
    this.serviciosService.obtener(id).subscribe({
      next: (data) => {
        this.form.patchValue({
          nombre: data.nombre,
          codigo: data.codigo,
          duracionMinutos: data.duracionMinutos,
          color: data.color || '#1976d2',
          precio: data.precio ?? 0
        });
        this.loadingData.set(false);
      },
      error: () => {
        this.error.set('Error al cargar servicio');
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
    this.serviciosService.actualizar(id, this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/servicios']);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al actualizar servicio');
        this.loading.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/servicios']);
  }
}
