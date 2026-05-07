import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { PacientesService, Paciente } from '../../../services/pacientes.service';
import { MascotasService, Mascota } from '../../../services/mascotas.service';

export interface AsignarMascotaDialogData {
  /** Tutor que recibirá la mascota como co-tutor */
  coTutorId: number;
  coTutorNombre: string;
}

@Component({
  selector: 'app-asignar-mascota-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './asignar-mascota-dialog.html',
  styleUrl: './asignar-mascota-dialog.scss'
})
export class AsignarMascotaDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<AsignarMascotaDialogComponent, boolean>);
  data = inject<AsignarMascotaDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private pacientesService = inject(PacientesService);
  private mascotasService = inject(MascotasService);
  private destroyRef = inject(DestroyRef);

  titularSearchControl = new FormControl<string | Paciente | null>('');
  titularFiltrados: Paciente[] = [];
  private titularSearchSubject = new Subject<string>();

  titularSeleccionado: Paciente | null = null;
  mascotasTitular: Mascota[] = [];
  mascotaIdCtrl = this.fb.control<number | null>(null, Validators.required);

  loadingMascotas = false;
  loadingGuardar = false;
  error: string | null = null;

  ngOnInit(): void {
    this.titularSearchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term: string) => {
          if (!term || term.length < 2) {
            return this.pacientesService.listar({ estado: 'ACTIVO', page: 1, pageSize: 100 });
          }
          return this.pacientesService.listar({
            estado: 'ACTIVO',
            nombre: term,
            page: 1,
            pageSize: 100
          });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          const excl = this.data.coTutorId;
          this.titularFiltrados = res.data.filter((p) => p.id !== excl);
        },
        error: () => {
          this.titularFiltrados = [];
        }
      });

    this.titularSearchControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      if (value && typeof value === 'object' && 'id' in value) {
        return;
      }
      const searchTerm = typeof value === 'string' ? value : '';
      if (!searchTerm.trim()) {
        this.titularFiltrados = [];
        if (!this.titularSeleccionado) {
          this.mascotasTitular = [];
          this.mascotaIdCtrl.setValue(null);
        }
      } else {
        this.titularSearchSubject.next(searchTerm);
      }
    });
  }

  displayTutor(p: Paciente | null): string {
    return p?.nombre ?? '';
  }

  onTitularSelected(event: MatAutocompleteSelectedEvent): void {
    const p = event.option.value as Paciente;
    this.titularSeleccionado = p;
    this.titularSearchControl.setValue(p, { emitEvent: false });
    this.mascotaIdCtrl.setValue(null);
    this.cargarMascotasTitular(p.id);
  }

  cargarMascotasTitular(pacienteID: number): void {
    this.loadingMascotas = true;
    this.error = null;
    this.mascotasTitular = [];
    this.mascotasService.listarPorPaciente(pacienteID).subscribe({
      next: (res) => {
        this.mascotasTitular = (res.data ?? []).filter((m) => m.estado !== 'BAJA');
        this.loadingMascotas = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las mascotas del tutor elegido';
        this.loadingMascotas = false;
      }
    });
  }

  async guardar(): Promise<void> {
    const mid = this.mascotaIdCtrl.value;
    if (mid == null || !this.titularSeleccionado) {
      this.mascotaIdCtrl.markAsTouched();
      return;
    }
    this.loadingGuardar = true;
    this.error = null;
    try {
      await firstValueFrom(
        this.mascotasService.agregarCoTutor(mid, this.data.coTutorId)
      );
      this.dialogRef.close(true);
    } catch (err: unknown) {
      this.error =
        (err as { error?: { error?: string } })?.error?.error ||
        (err as Error).message ||
        'No se pudo asignar la mascota';
    } finally {
      this.loadingGuardar = false;
    }
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
