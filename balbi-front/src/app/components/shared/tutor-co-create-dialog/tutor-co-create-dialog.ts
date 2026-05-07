import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { firstValueFrom } from 'rxjs';
import { PacientesService, Paciente } from '../../../services/pacientes.service';

export interface TutorCoCreateDialogData {
  /** Texto ya escrito en el buscador de co-tutor */
  nombrePrefill?: string;
}

@Component({
  selector: 'app-tutor-co-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './tutor-co-create-dialog.html',
  styleUrl: './tutor-co-create-dialog.scss'
})
export class TutorCoCreateDialogComponent {
  dialogRef = inject(MatDialogRef<TutorCoCreateDialogComponent, Paciente | null>);
  private fb = inject(FormBuilder);
  private pacientesService = inject(PacientesService);
  data = inject<TutorCoCreateDialogData>(MAT_DIALOG_DATA);

  loading = false;
  error: string | null = null;

  form = this.fb.nonNullable.group({
    nombre: [this.data?.nombrePrefill?.trim() ?? '', [Validators.required]],
    dni: [''],
    telefono: [''],
    email: ['', [Validators.email]]
  });

  cancelar(): void {
    this.dialogRef.close(null);
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = null;
    const v = this.form.getRawValue();
    try {
      const creado = await firstValueFrom(
        this.pacientesService.crear({
          nombre: v.nombre.trim(),
          dni: v.dni?.trim() || undefined,
          telefono: v.telefono?.trim() || undefined,
          email: v.email?.trim() || undefined
        })
      );
      this.dialogRef.close(creado);
    } catch (err: unknown) {
      this.error =
        (err as { error?: { error?: string } })?.error?.error ||
        (err as Error).message ||
        'Error al crear tutor';
    } finally {
      this.loading = false;
    }
  }
}
