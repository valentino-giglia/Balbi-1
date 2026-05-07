import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VacunasService, Vacuna } from '../../../services/vacunas.service';
import { MatDialog } from '@angular/material/dialog';

export interface VacunasMascotaDialogData {
  mascotaID: number;
  mascotaNombre: string;
}

@Component({
  selector: 'app-vacunas-mascota-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './vacunas-mascota-dialog.html',
  styleUrl: './vacunas-mascota-dialog.scss'
})
export class VacunasMascotaDialogComponent {
  private dialogRef = inject(MatDialogRef<VacunasMascotaDialogComponent>);
  private data = inject<VacunasMascotaDialogData>(MAT_DIALOG_DATA);
  private vacunasService = inject(VacunasService);
  private dialog = inject(MatDialog);

  vacunas: Vacuna[] = [];
  loading = true;
  error: string | null = null;

  get mascotaNombre(): string {
    return this.data?.mascotaNombre ?? 'Mascota';
  }

  get mascotaID(): number {
    return this.data?.mascotaID ?? 0;
  }

  constructor() {
    this.cargarVacunas();
  }

  private cargarVacunas(): void {
    this.loading = true;
    this.error = null;
    this.vacunasService.listarPorMascota(this.mascotaID).subscribe({
      next: (list) => {
        this.vacunas = list;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar vacunas';
        this.loading = false;
      }
    });
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  agregarVacuna(): void {
    import('../vacuna-form-dialog/vacuna-form-dialog').then((module) => {
      this.dialog.open(module.VacunaFormDialogComponent, {
        width: '440px',
        maxWidth: '90vw',
        data: { mascotaID: this.mascotaID }
      }).afterClosed().subscribe((saved) => {
        if (saved) this.cargarVacunas();
      });
    });
  }

  editarVacuna(v: Vacuna): void {
    import('../vacuna-form-dialog/vacuna-form-dialog').then((module) => {
      this.dialog.open(module.VacunaFormDialogComponent, {
        width: '440px',
        maxWidth: '90vw',
        data: { mascotaID: this.mascotaID, vacuna: v }
      }).afterClosed().subscribe((saved) => {
        if (saved) this.cargarVacunas();
      });
    });
  }

  cerrar(): void {
    this.dialogRef.close(true);
  }
}
