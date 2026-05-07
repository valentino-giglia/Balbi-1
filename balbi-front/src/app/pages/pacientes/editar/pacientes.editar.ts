import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LoadingSpinnerComponent } from '../../../components/shared/loading-spinner/loading-spinner';
import { PacientesService } from '../../../services/pacientes.service';

@Component({
  selector: 'app-pacientes-editar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './pacientes.editar.html',
  styleUrl: './pacientes.editar.scss'
})
export class PacientesEditarComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  loadingData = signal(true);
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private pacientesService: PacientesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      dni: [''],
      telefono: [''],
      email: ['', [Validators.email]],
      kapso_phone_number_id: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadPaciente(id);
  }

  loadPaciente(id: number): void {
    this.loadingData.set(true);
    this.pacientesService.obtener(id).subscribe({
      next: (data) => {
        this.form.patchValue(data);
        this.loadingData.set(false);
      },
      error: () => {
        this.error.set('Error al cargar tutor');
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
    this.pacientesService.actualizar(id, this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/pacientes']);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al actualizar tutor');
        this.loading.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/pacientes']);
  }
}

