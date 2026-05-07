import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoadingSpinnerComponent } from '../../components/shared/loading-spinner/loading-spinner';
import { TurnosService, Turno } from '../../services/turnos.service';
import { ConfirmDialogComponent } from '../../components/shared/confirm-dialog/confirm-dialog';

interface TurnoPendienteTableRow {
  id: number;
  tutor: string;
  telefono: string;
  fechaHora: string;
  servicio: string;
  profesional: string;
  _original: Turno;
}

@Component({
  selector: 'app-turnos-pendientes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    MatTooltipModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './turnos-pendientes.html',
  styleUrl: './turnos-pendientes.scss'
})
export class TurnosPendientesComponent implements OnInit {
  turnosPendientes = signal<TurnoPendienteTableRow[]>([]);
  loading = signal(false);
  
  displayedColumns: string[] = ['tutor', 'telefono', 'fechaHora', 'servicio', 'profesional', 'actions'];
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];
  pageIndex = 0;
  totalItems = 0;

  constructor(
    private turnosService: TurnosService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTurnosPendientes();
  }

  loadTurnosPendientes(): void {
    this.loading.set(true);
    this.turnosService.listar({ estado: 'PENDIENTE' }).subscribe({
      next: (turnos: Turno[]) => {
        // Filtrar solo turnos que tengan paciente asignado
        const turnosConTutor = turnos.filter(t => t.pacienteID && t.paciente);
        
        const formatted: TurnoPendienteTableRow[] = turnosConTutor.map((turno: Turno) => ({
          id: turno.id,
          tutor: turno.paciente?.nombre || '-',
          telefono: turno.paciente?.telefono || '-',
          fechaHora: this.formatFechaHora(turno.horaInicio),
          servicio: turno.servicio?.nombre || '-',
          profesional: turno.profesional?.nombre || '-',
          _original: turno
        }));
        this.turnosPendientes.set(formatted);
        this.totalItems = formatted.length;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.turnosPendientes.set([]);
        this.totalItems = 0;
      }
    });
  }

  formatFechaHora(fecha: string): string {
    const date = new Date(fecha);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  get paginatedData(): TurnoPendienteTableRow[] {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    return this.turnosPendientes().slice(start, end);
  }

  confirmarTurno(row: TurnoPendienteTableRow): void {
    const turno = row._original;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Turno',
        message: `¿Confirmar el turno de ${turno.paciente?.nombre || 'tutor'} para ${this.formatFechaHora(turno.horaInicio)}?`,
        confirmText: 'Confirmar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading.set(true);
        // Cambiar estado de PENDIENTE a RESERVADO
        this.turnosService.actualizar(turno.id, { estado: 'RESERVADO' }).subscribe({
          next: () => {
            this.loadTurnosPendientes();
          },
          error: () => this.loading.set(false)
        });
      }
    });
  }

  cancelarTurno(row: TurnoPendienteTableRow): void {
    const turno = row._original;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancelar Turno',
        message: `¿Cancelar el turno de ${turno.paciente?.nombre || 'tutor'} para ${this.formatFechaHora(turno.horaInicio)}?`,
        confirmText: 'Cancelar',
        cancelText: 'No'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading.set(true);
        // Usar el método cancelar del servicio
        this.turnosService.cancelar(turno.id).subscribe({
          next: () => {
            this.loadTurnosPendientes();
          },
          error: () => this.loading.set(false)
        });
      }
    });
  }

  irAlChat(row: TurnoPendienteTableRow): void {
    const turno = row._original;
    // Usar pacienteID si existe, si no usar paciente.id
    const pacienteId = turno.pacienteID || turno.paciente?.id;
    if (pacienteId) {
      this.router.navigate(['/chat/detalle', pacienteId]);
    }
  }
}

