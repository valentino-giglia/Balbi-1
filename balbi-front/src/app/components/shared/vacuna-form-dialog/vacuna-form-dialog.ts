import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VacunasService, Vacuna } from '../../../services/vacunas.service';
import { firstValueFrom } from 'rxjs';

export interface VacunaFormDialogData {
  mascotaID: number;
  vacuna?: Vacuna | null;
}

@Component({
  selector: 'app-vacuna-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './vacuna-form-dialog.html',
  styleUrl: './vacuna-form-dialog.scss'
})
export class VacunaFormDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<VacunaFormDialogComponent>);
  data = inject<VacunaFormDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private vacunasService = inject(VacunasService);

  form: FormGroup;
  loading = false;
  error: string | null = null;
  isEdit = false;

  constructor() {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      fechaAplicacion: [null as string | null, Validators.required],
      proximaDosis: [null as string | null],
      notas: ['']
    });
  }

  ngOnInit(): void {
    const vacuna = this.data?.vacuna;
    this.isEdit = !!vacuna;
    if (vacuna) {
      this.form.patchValue({
        nombre: vacuna.nombre || '',
        fechaAplicacion: vacuna.fechaAplicacion || null,
        proximaDosis: vacuna.proximaDosis ?? null,
        notas: vacuna.notas || ''
      });
    }
  }

  get titulo(): string {
    return this.isEdit ? 'Editar vacuna' : 'Nueva vacuna';
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = null;
    try {
      const v = this.form.value;
      const payload = {
        mascotaID: this.data.mascotaID,
        nombre: v.nombre?.trim() || '',
        fechaAplicacion: v.fechaAplicacion || '',
        proximaDosis: v.proximaDosis || null,
        notas: v.notas?.trim() || null
      };
      if (this.isEdit && this.data.vacuna) {
        await firstValueFrom(this.vacunasService.actualizar(this.data.vacuna.id, payload));
      } else {
        await firstValueFrom(this.vacunasService.crear(payload));
      }
      this.dialogRef.close(true);
    } catch (err: unknown) {
      this.error = (err as { error?: { error?: string } })?.error?.error || (err as Error).message || 'Error al guardar';
    } finally {
      this.loading = false;
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
