import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DataTableComponent, TableColumn } from '../../components/shared/data-table/data-table';
import { LoadingSpinnerComponent } from '../../components/shared/loading-spinner/loading-spinner';
import { VacunasService, Vacuna } from '../../services/vacunas.service';
import { ConfirmDialogComponent } from '../../components/shared/confirm-dialog/confirm-dialog';

interface VacunaTableRow {
  id: number;
  nombre: string;
  fechaAplicacion: string;
  proximaDosis: string;
  mascota: string;
  _original: Vacuna;
}

@Component({
  selector: 'app-vacunas',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    DataTableComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './vacunas.html',
  styleUrl: './vacunas.scss'
})
export class VacunasComponent implements OnInit {
  vacunas = signal<VacunaTableRow[]>([]);
  loading = signal(false);
  columns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'nombre', label: 'Vacuna', type: 'text' },
    { key: 'fechaAplicacion', label: 'Fecha aplicación', type: 'date' },
    { key: 'proximaDosis', label: 'Próxima dosis', type: 'date' },
    { key: 'mascota', label: 'Mascota', type: 'text' }
  ];

  constructor(
    private vacunasService: VacunasService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadVacunas();
  }

  loadVacunas(): void {
    this.loading.set(true);
    this.vacunasService.listar().subscribe({
      next: (data) => {
        const formatted: VacunaTableRow[] = data.map(v => ({
          id: v.id,
          nombre: v.nombre,
          fechaAplicacion: v.fechaAplicacion,
          proximaDosis: v.proximaDosis || '-',
          mascota: v.mascota?.nombre || '-',
          _original: v
        }));
        this.vacunas.set(formatted);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    // Client-side pagination handled by data-table
  }

  onSearch(term: string): void {
    // Optional: filter locally by term
  }

  onEdit(row: { _original: Vacuna }): void {
    this.router.navigate(['/vacunas/editar', row._original.id]);
  }

  onDelete(row: VacunaTableRow): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar vacuna',
        message: `¿Estás seguro de eliminar el registro de "${row.nombre}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.vacunasService.eliminar(row._original.id).subscribe({
          next: () => this.loadVacunas(),
          error: () => {}
        });
      }
    });
  }

  crearVacuna(): void {
    this.router.navigate(['/vacunas/agregar']);
  }

  onView(row: { _original: Vacuna }): void {
    if (row._original.mascotaID) {
      this.router.navigate(['/mascotas/editar', row._original.mascotaID]);
    }
  }
}
