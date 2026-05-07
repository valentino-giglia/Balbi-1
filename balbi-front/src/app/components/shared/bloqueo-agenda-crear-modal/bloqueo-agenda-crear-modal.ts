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

export interface BloqueoAgendaCrearModalData {
  fechaHoraInicial?: Date;
}

@Component({
  selector: 'app-bloqueo-agenda-crear-modal',
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
  templateUrl: './bloqueo-agenda-crear-modal.html',
  styleUrl: './bloqueo-agenda-crear-modal.scss'
})
export class BloqueoAgendaCrearModalComponent implements OnInit {
  dialogRef = inject(MatDialogRef<BloqueoAgendaCrearModalComponent>);
  data = inject<BloqueoAgendaCrearModalData>(MAT_DIALOG_DATA);
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
    const fechaInicial = this.data?.fechaHoraInicial || new Date();
    const fecha = new Date(fechaInicial);
    const horaStr = `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
    this.form.patchValue({ fecha, horaInicio: horaStr });

    try {
      const res = await firstValueFrom(
        this.profesionalesService.listar({ estado: 'ACTIVO', page: 1, pageSize: 1000 })
      );
      this.profesionales = res.data;
    } catch (e) {
      console.error(e);
      this.error = 'Error al cargar profesionales';
    } finally {
      this.loadingData = false;
    }
  }

  async crear(): Promise<void> {
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
        this.bloqueosAgendaService.crear({
          profesionalID: v.profesionalID,
          horaInicio: fecha.toISOString(),
          horaFin: horaFin.toISOString()
        })
      );
      this.dialogRef.close(true);
    } catch (err: unknown) {
      this.error = (err as { error?: { error?: string } })?.error?.error || (err as Error).message || 'Error al crear bloqueo';
    } finally {
      this.loading = false;
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
