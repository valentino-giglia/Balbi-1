import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MascotasService, type Mascota } from '../../../services/mascotas.service';

export interface MascotaSelectorDialogData {
  tutorID: number;
  tutorNombre: string;
}

export interface MascotaSelectorDialogResult {
  mascotaID: number | null;
}

@Component({
  selector: 'app-mascota-selector-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './mascota-selector-dialog.html',
  styleUrl: './mascota-selector-dialog.scss'
})
export class MascotaSelectorDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<MascotaSelectorDialogComponent, MascotaSelectorDialogResult>);
  data = inject<MascotaSelectorDialogData>(MAT_DIALOG_DATA);
  private mascotasService = inject(MascotasService);

  mascotas: Mascota[] = [];
  loading = true;
  error: string | null = null;
  selectedId: number | null = null;

  ngOnInit(): void {
    this.mascotasService.listarPorPaciente(this.data.tutorID).subscribe({
      next: (res) => {
        this.mascotas = res.data ?? [];
        this.loading = false;
        if (this.mascotas.length === 1) {
          this.selectedId = this.mascotas[0].id;
        }
      },
      error: () => {
        this.error = 'Error al cargar mascotas del tutor';
        this.loading = false;
      }
    });
  }

  seleccionar(mascotaID: number): void {
    this.selectedId = mascotaID;
  }

  confirmar(): void {
    if (!this.selectedId) return;
    this.dialogRef.close({ mascotaID: this.selectedId });
  }

  cancelar(): void {
    this.dialogRef.close({ mascotaID: null });
  }
}

