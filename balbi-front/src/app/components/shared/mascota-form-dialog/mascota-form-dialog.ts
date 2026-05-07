import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { MascotasService, Mascota } from '../../../services/mascotas.service';
import { PacientesService, Paciente } from '../../../services/pacientes.service';

export interface MascotaFormDialogData {
  /** Tutor titular. Si no se indica, el formulario incluye selector de tutor. */
  pacienteID?: number;
  mascota?: Mascota | null;
}

@Component({
  selector: 'app-mascota-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './mascota-form-dialog.html',
  styleUrl: './mascota-form-dialog.scss'
})
export class MascotaFormDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<MascotaFormDialogComponent>);
  data = inject<MascotaFormDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private mascotasService = inject(MascotasService);
  private pacientesService = inject(PacientesService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);

  form: FormGroup;
  loading = false;
  error: string | null = null;
  isEdit = false;
  /** true cuando el tutor viene fijo en data (ficha del tutor / edición). */
  tutorFijo = false;
  tutores: Paciente[] = [];
  loadingTutores = false;

  /** Mascota con co-tutores (solo en edición) */
  detalle: Mascota | null = null;
  loadingDetalle = false;
  loadingCoTutor = false;
  coTutorFiltrados: Paciente[] = [];
  coTutorSearchControl = new FormControl<string | Paciente | null>('');
  private coTutorSearchSubject = new Subject<string>();
  /** Hubo alta/baja de co-tutores sin guardar el formulario de la mascota */
  private coTutoresModificados = false;

  constructor() {
    this.form = this.fb.group({
      pacienteID: [null as number | null, Validators.required],
      nombre: ['', Validators.required],
      especie: [''],
      raza: [''],
      fechaNacimiento: [null as string | null],
      notas: ['']
    });
  }

  ngOnInit(): void {
    const pid = this.data?.pacienteID;
    this.tutorFijo = pid != null;
    const pacienteCtrl = this.form.get('pacienteID');
    if (this.tutorFijo) {
      pacienteCtrl?.setValue(pid);
      pacienteCtrl?.clearValidators();
      pacienteCtrl?.updateValueAndValidity();
      pacienteCtrl?.disable();
    }

    if (!this.tutorFijo) {
      this.loadingTutores = true;
      this.pacientesService.listar({ estado: 'ACTIVO', page: 1, pageSize: 500 }).subscribe({
        next: (res) => {
          this.tutores = res.data;
          this.loadingTutores = false;
        },
        error: () => {
          this.loadingTutores = false;
        }
      });
    }

    const mascota = this.data?.mascota;
    this.isEdit = !!mascota;
    if (mascota) {
      this.form.patchValue({
        nombre: mascota.nombre || '',
        especie: mascota.especie || '',
        raza: mascota.raza || '',
        fechaNacimiento: mascota.fechaNacimiento || null,
        notas: mascota.notas || ''
      });
      this.loadingDetalle = true;
      this.mascotasService.obtener(mascota.id).subscribe({
        next: (m) => {
          this.detalle = m;
          this.loadingDetalle = false;
        },
        error: () => {
          this.detalle = mascota;
          this.loadingDetalle = false;
        }
      });
    }

    this.coTutorSearchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm: string) => {
          if (!searchTerm || searchTerm.length < 2) {
            return this.pacientesService.listar({ estado: 'ACTIVO', page: 1, pageSize: 100 });
          }
          return this.pacientesService.listar({
            estado: 'ACTIVO',
            nombre: searchTerm,
            page: 1,
            pageSize: 100
          });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          const titularId = this.detalle?.pacienteID;
          const coIds = new Set((this.detalle?.coTutores ?? []).map((c) => c.id));
          this.coTutorFiltrados = response.data.filter(
            (p) => p.id !== titularId && !coIds.has(p.id)
          );
        },
        error: () => {
          this.coTutorFiltrados = [];
        }
      });

    this.coTutorSearchControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      if (value && typeof value === 'object' && 'id' in value) {
        return;
      }
      const searchTerm = typeof value === 'string' ? value : '';
      if (!searchTerm.trim()) {
        this.coTutorFiltrados = [];
      } else {
        this.coTutorSearchSubject.next(searchTerm);
      }
    });
  }

  get titulo(): string {
    return this.isEdit ? 'Editar mascota' : 'Crear mascota';
  }

  displayTutor(p: Paciente | null): string {
    return p?.nombre ?? '';
  }

  /** Texto del buscador (string) para mensaje si no hay coincidencias */
  textoBusquedaCoTutor(): string {
    const v = this.coTutorSearchControl.value;
    return typeof v === 'string' ? v.trim() : '';
  }

  abrirCrearCoTutor(): void {
    const prefill = this.textoBusquedaCoTutor();
    void import('../tutor-co-create-dialog/tutor-co-create-dialog').then((m) => {
      const ref = this.dialog.open(m.TutorCoCreateDialogComponent, {
        width: '440px',
        maxWidth: '90vw',
        data: { nombrePrefill: prefill }
      });
      ref.afterClosed().subscribe((nuevo: Paciente | null | undefined) => {
        if (nuevo?.id) {
          void this.vincularNuevoCoTutor(nuevo.id);
        }
      });
    });
  }

  private async vincularNuevoCoTutor(pacienteId: number): Promise<void> {
    if (!this.detalle?.id) return;
    this.loadingCoTutor = true;
    this.error = null;
    try {
      this.detalle = await firstValueFrom(
        this.mascotasService.agregarCoTutor(this.detalle.id, pacienteId)
      );
      this.coTutoresModificados = true;
      this.coTutorSearchControl.setValue('', { emitEvent: false });
      this.coTutorFiltrados = [];
    } catch (err: unknown) {
      this.error =
        (err as { error?: { error?: string } })?.error?.error ||
        (err as Error).message ||
        'Error al vincular co-tutor';
    } finally {
      this.loadingCoTutor = false;
    }
  }

  async onCoTutorSelected(event: MatAutocompleteSelectedEvent): Promise<void> {
    const p = event.option.value as Paciente;
    if (!this.detalle?.id || !p?.id) return;
    this.loadingCoTutor = true;
    this.error = null;
    try {
      this.detalle = await firstValueFrom(this.mascotasService.agregarCoTutor(this.detalle.id, p.id));
      this.coTutoresModificados = true;
      this.coTutorSearchControl.setValue('', { emitEvent: false });
      this.coTutorFiltrados = [];
    } catch (err: unknown) {
      this.error =
        (err as { error?: { error?: string } })?.error?.error ||
        (err as Error).message ||
        'Error al agregar co-tutor';
    } finally {
      this.loadingCoTutor = false;
    }
  }

  async quitarCoTutor(pacienteId: number): Promise<void> {
    if (!this.detalle?.id) return;
    this.loadingCoTutor = true;
    this.error = null;
    try {
      this.detalle = await firstValueFrom(
        this.mascotasService.quitarCoTutor(this.detalle.id, pacienteId)
      );
      this.coTutoresModificados = true;
    } catch (err: unknown) {
      this.error =
        (err as { error?: { error?: string } })?.error?.error ||
        (err as Error).message ||
        'Error al quitar co-tutor';
    } finally {
      this.loadingCoTutor = false;
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
      const v = this.form.getRawValue() as {
        pacienteID: number | null;
        nombre: string;
        especie: string;
        raza: string;
        fechaNacimiento: string | null;
        notas: string;
      };
      const pacienteID =
        this.data.pacienteID ?? v.pacienteID ?? this.data.mascota?.pacienteID ?? null;
      if (pacienteID == null) {
        this.error = 'Seleccioná un tutor';
        this.loading = false;
        return;
      }
      const payload = {
        pacienteID,
        nombre: v.nombre?.trim() || '',
        especie: v.especie?.trim() || null,
        raza: v.raza?.trim() || null,
        fechaNacimiento: v.fechaNacimiento || null,
        notas: v.notas?.trim() || null
      };
      if (this.isEdit && this.data.mascota) {
        await firstValueFrom(this.mascotasService.actualizar(this.data.mascota.id, payload));
      } else {
        await firstValueFrom(this.mascotasService.crear(payload));
      }
      this.dialogRef.close(true);
    } catch (err: unknown) {
      this.error =
        (err as { error?: { error?: string } })?.error?.error || (err as Error).message || 'Error al guardar';
    } finally {
      this.loading = false;
    }
  }

  cancelar(): void {
    this.dialogRef.close(this.coTutoresModificados ? 'co-tutores' : false);
  }
}
