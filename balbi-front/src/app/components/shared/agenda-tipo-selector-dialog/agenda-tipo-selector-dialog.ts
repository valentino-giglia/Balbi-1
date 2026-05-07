import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type AgendaTipoSeleccion = 'turno' | 'evento' | 'bloqueo';

@Component({
  selector: 'app-agenda-tipo-selector-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './agenda-tipo-selector-dialog.html',
  styleUrl: './agenda-tipo-selector-dialog.scss'
})
export class AgendaTipoSelectorDialogComponent {
  private dialogRef = inject(MatDialogRef<AgendaTipoSelectorDialogComponent>);

  elegir(tipo: AgendaTipoSeleccion): void {
    this.dialogRef.close(tipo);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
