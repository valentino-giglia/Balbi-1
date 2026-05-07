import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LoadingSpinnerComponent } from '../../../components/shared/loading-spinner/loading-spinner';
import { PacientesService } from '../../../services/pacientes.service';

@Component({
  selector: 'app-pacientes-agregar',
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
  templateUrl: './pacientes.agregar.html',
  styleUrl: './pacientes.agregar.scss'
})
export class PacientesAgregarComponent {
  form: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private pacientesService: PacientesService,
    private router: Router
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      dni: [''],
      telefono: [''],
      email: ['', [Validators.email]],
      kapso_phone_number_id: ['']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.pacientesService.crear(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/pacientes']);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al crear tutor');
        this.loading.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/pacientes']);
  }
}

