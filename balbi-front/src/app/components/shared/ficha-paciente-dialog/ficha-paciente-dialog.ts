import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { FichaPaciente } from '../../../pages/pacientes/detalle-turnos/pacientes.detalle-turnos';

export interface FichaPacienteDialogData {
  ficha: FichaPaciente | null;
  pacienteID: number;
}

@Component({
  selector: 'app-ficha-paciente-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule
  ],
  templateUrl: './ficha-paciente-dialog.html',
  styleUrl: './ficha-paciente-dialog.scss'
})
export class FichaPacienteDialogComponent {
  dialogRef = inject(MatDialogRef<FichaPacienteDialogComponent>);
  data = inject<FichaPacienteDialogData>(MAT_DIALOG_DATA);

  ficha: FichaPaciente = {
    fechaNacimiento: this.data.ficha?.fechaNacimiento || '',
    domicilio: this.data.ficha?.domicilio || '',
    ocupacion: this.data.ficha?.ocupacion || '',
    sexo: this.data.ficha?.sexo || 'Masculino',
    localidad: this.data.ficha?.localidad || '',
    estadoCivil: this.data.ficha?.estadoCivil || '',
    obraSocial: this.data.ficha?.obraSocial || '',
    nroAfiliado: this.data.ficha?.nroAfiliado || '',
    nacionalidad: this.data.ficha?.nacionalidad || '',
    religion: this.data.ficha?.religion || ''
  };

  onGuardar(): void {
    this.dialogRef.close(this.ficha);
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
