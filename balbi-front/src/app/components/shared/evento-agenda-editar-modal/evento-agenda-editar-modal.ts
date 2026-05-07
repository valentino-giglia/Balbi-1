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
import { EventosAgendaService, type TipoEventoAgenda } from '../../../services/eventos-agenda.service';
import { ProfesionalesService } from '../../../services/profesionales.service';
import type { EventoAgenda } from '../../../services/eventos-agenda.service';

export interface EventoAgendaEditarModalData {
  evento: EventoAgenda;
}

@Component({
  selector: 'app-evento-agenda-editar-modal',
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
  templateUrl: './evento-agenda-editar-modal.html',
  styleUrl: './evento-agenda-editar-modal.scss'
})
export class EventoAgendaEditarModalComponent implements OnInit {
  dialogRef = inject(MatDialogRef<EventoAgendaEditarModalComponent>);
  data = inject<EventoAgendaEditarModalData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private eventosAgendaService = inject(EventosAgendaService);
  private profesionalesService = inject(ProfesionalesService);

  form: FormGroup;
  loading = false;
  loadingData = true;
  error: string | null = null;
  profesionales: Array<{ id: number; nombre: string }> = [];

  readonly tipos: { value: TipoEventoAgenda; label: string }[] = [
    { value: 'TRASLADO', label: 'Traslado' },
    { value: 'ENVIO_MUESTRAS', label: 'Envío de muestras' },
    { value: 'CADETERIA', label: 'Cadetería' }
  ];

  constructor() {
    this.form = this.fb.group({
      tipo: [null as TipoEventoAgenda | null, Validators.required],
      profesionalID: [null, Validators.required],
      fecha: [null, Validators.required],
      horaInicio: [null, Validators.required],
      duracionMinutos: [30, [Validators.required, Validators.min(1)]],
      notas: [null]
    });
  }

  async ngOnInit(): Promise<void> {
    const e = this.data.evento;
    const start = new Date(e.horaInicio.replace('Z', ''));
    const horaStr = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
    const end = new Date(e.horaFin.replace('Z', ''));
    const duracion = Math.round((end.getTime() - start.getTime()) / 60000);

    this.form.patchValue({
      tipo: e.tipo,
      profesionalID: e.profesionalID,
      fecha: start,
      horaInicio: horaStr,
      duracionMinutos: duracion || 30,
      notas: e.notas ?? null
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
      horaFin.setMinutes(horaFin.getMinutes() + (v.duracionMinutos || 30));

      await firstValueFrom(
        this.eventosAgendaService.actualizar(this.data.evento.id, {
          tipo: v.tipo,
          profesionalID: v.profesionalID,
          horaInicio: fecha.toISOString(),
          horaFin: horaFin.toISOString(),
          notas: v.notas || null
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
