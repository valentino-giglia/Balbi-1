import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner';
import { AgendaCalendarComponent } from '../agenda-calendar/agenda-calendar';

export interface TurnosCalendarExpandModalData {
  turnosRef: any; // TurnosComponent - avoid circular import
}

@Component({
  selector: 'app-turnos-calendar-expand-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatTooltipModule,
    LoadingSpinnerComponent,
    AgendaCalendarComponent
  ],
  templateUrl: './turnos-calendar-expand-modal.html',
  styleUrl: './turnos-calendar-expand-modal.scss'
})
export class TurnosCalendarExpandModalComponent {
  private dialogRef = inject(MatDialogRef<TurnosCalendarExpandModalComponent>);
  data = inject<TurnosCalendarExpandModalData>(MAT_DIALOG_DATA);

  get turnos(): any {
    return this.data.turnosRef;
  }

  close(): void {
    this.dialogRef.close();
  }
}
