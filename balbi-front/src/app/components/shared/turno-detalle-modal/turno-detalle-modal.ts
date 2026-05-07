import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Turno, TurnosService } from '../../../services/turnos.service';

export interface TurnoDetalleModalData {
  turno: Turno;
}

@Component({
  selector: 'app-turno-detalle-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  templateUrl: './turno-detalle-modal.html',
  styleUrl: './turno-detalle-modal.scss'
})
export class TurnoDetalleModalComponent implements OnInit {
  dialogRef = inject(MatDialogRef<TurnoDetalleModalComponent>);
  data = inject<TurnoDetalleModalData>(MAT_DIALOG_DATA);
  snackBar = inject(MatSnackBar);
  private turnosService = inject(TurnosService);

  notasConsulta = signal<string>('');

  get turno(): Turno {
    return this.data.turno;
  }

  ngOnInit(): void {
    // Cargar notas desde localStorage
    const notasGuardadas = this.cargarNotasDesdeLocalStorage();
    this.notasConsulta.set(notasGuardadas || this.turno.notas || '');
  }

  private getStorageKey(): string {
    return `turno_notas_${this.turno.id}`;
  }

  private cargarNotasDesdeLocalStorage(): string | null {
    try {
      const key = this.getStorageKey();
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error al cargar notas desde localStorage:', error);
      return null;
    }
  }

  private guardarNotasEnLocalStorage(notas: string): void {
    try {
      const key = this.getStorageKey();
      if (notas.trim()) {
        localStorage.setItem(key, notas);
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error al guardar notas en localStorage:', error);
    }
  }

  guardarNotas(): void {
    const notas = this.notasConsulta().trim();
    this.turnosService.actualizarNotas(this.turno.id, notas).subscribe({
      next: (turnoActualizado) => {
        this.turno.notas = turnoActualizado.notas;
        this.guardarNotasEnLocalStorage(notas);
        this.snackBar.open('Notas guardadas exitosamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      },
      error: () => {
        this.snackBar.open('Error al guardar las notas del turno', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'RESERVADO': 'primary',
      'PENDIENTE': 'accent',
      'CANCELADO': 'warn',
      'COMPLETADO': 'primary',
      'BAJA': 'warn'
    };
    return colores[estado] || 'primary';
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
