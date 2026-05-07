import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { BloqueosAgendaService } from '../../../services/bloqueos-agenda.service';
import { ProfesionalesService } from '../../../services/profesionales.service';
import type { BloqueoAgenda } from '../../../services/bloqueos-agenda.service';

export interface BloqueoAgendaEditarModalData {
  bloqueo: BloqueoAgenda;
}

@Component({
  selector: 'app-bloqueo-agenda-editar-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './bloqueo-agenda-editar-modal.html',
  styleUrl: './bloqueo-agenda-editar-modal.scss'
})
export class BloqueoAgendaEditarModalComponent implements OnInit {
  dialogRef = inject(MatDialogRef<BloqueoAgendaEditarModalComponent>);
  data = inject<BloqueoAgendaEditarModalData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private bloqueosAgendaService = inject(BloqueosAgendaService);
  private profesionalesService = inject(ProfesionalesService);

  form: FormGroup;
  loading = false;
  loadingData = true;
  error: string | null = null;
  profesionales: Array<{ id: number; nombre: string }> = [];

  constructor() {
    this.form = this.fb.group({
      profesionalID: [null, Validators.required],
      fecha: [null, Validators.required],
      horaInicio: [null, Validators.required],
      duracionMinutos: [60, [Validators.required, Validators.min(1)]],
    });
  }

  async ngOnInit(): Promise<void> {
    const b = this.data.bloqueo;
    const start = new Date(b.horaInicio.replace('Z', ''));
    const horaStr = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
    const end = new Date(b.horaFin.replace('Z', ''));
    const duracion = Math.round((end.getTime() - start.getTime()) / 60000);

    this.form.patchValue({
      profesionalID: b.profesionalID,
      fecha: start,
      horaInicio: horaStr,
      duracionMinutos: duracion || 60
    });

    try {
      const res = await firstValueFrom(
        this.profesionalesService.listar({ estado: 'ACTIVO', page: 1, pageSize: 1000 })
      );
      this.profesionales = res.data;
    } catch (err) {
      console.error(err);
      this.error = 'Error al cargar profesionales';
    } finally {
      this.loadingData = false;
    }
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
      const fecha = new Date(v.fecha);
      const [h, m] = v.horaInicio.split(':').map(Number);
      fecha.setHours(h, m, 0, 0);
      const horaFin = new Date(fecha);
      horaFin.setMinutes(horaFin.getMinutes() + (v.duracionMinutos || 60));

      await firstValueFrom(
        this.bloqueosAgendaService.actualizar(this.data.bloqueo.id, {
          profesionalID: v.profesionalID,
          horaInicio: fecha.toISOString(),
          horaFin: horaFin.toISOString()
        })
      );
      this.dialogRef.close(true);
    } catch (err: unknown) {
      this.error = (err as { error?: { error?: string } })?.error?.error || (err as Error).message || 'Error al actualizar';
    } finally {
      this.loading = false;
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
