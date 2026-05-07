import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DataTableComponent, TableColumn } from '../../components/shared/data-table/data-table';
import { LoadingSpinnerComponent } from '../../components/shared/loading-spinner/loading-spinner';
import { MascotasService, Mascota } from '../../services/mascotas.service';
import { ConfirmDialogComponent } from '../../components/shared/confirm-dialog/confirm-dialog';

interface MascotaTableRow {
  id: number;
  nombre: string;
  especie: string;
  raza: string;
  tutor: string;
  estado: string;
  _original: Mascota;
}

@Component({
  selector: 'app-mascotas',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    DataTableComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './mascotas.html',
  styleUrl: './mascotas.scss'
})
export class MascotasComponent implements OnInit {
  mascotas = signal<MascotaTableRow[]>([]);
  loading = signal(false);
  totalCount = signal(0);
  currentPage = signal(0);
  pageSize = signal(10);
  searchTerm = signal('');
  columns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'especie', label: 'Especie', type: 'text' },
    { key: 'raza', label: 'Raza', type: 'text' },
    { key: 'tutor', label: 'Tutor', type: 'text' },
    { key: 'estado', label: 'Estado', type: 'status' }
  ];

  constructor(
    private mascotasService: MascotasService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadMascotas();
  }

  loadMascotas(page: number = 1, pageSize: number = 10, searchTerm: string = ''): void {
    this.loading.set(true);
    const filtros: { page: number; pageSize: number; estado?: string; pacienteID?: number } = {
      page,
      pageSize
    };
    if (searchTerm) {
      // El backend no tiene búsqueda por nombre de mascota; podríamos filtrar en front o agregar endpoint
      // Por ahora cargamos sin filtro de búsqueda por nombre
    }
    this.mascotasService.listar(filtros).subscribe({
      next: (response) => {
        const formatted: MascotaTableRow[] = response.data.map(m => ({
          id: m.id,
          nombre: m.nombre,
          especie: m.especie || '-',
          raza: m.raza || '-',
          tutor: m.paciente?.nombre || '-',
          estado: m.estado,
          _original: m
        }));
        this.mascotas.set(formatted);
        this.totalCount.set(response.pagination.total);
        this.currentPage.set(response.pagination.page - 1);
        this.pageSize.set(response.pagination.pageSize);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.loadMascotas(event.page, event.pageSize, this.searchTerm());
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(0);
    this.loadMascotas(1, this.pageSize(), term);
  }

  onEdit(row: { _original: Mascota }): void {
    this.router.navigate(['/mascotas/editar', row._original.id]);
  }

  onDelete(row: MascotaTableRow): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar mascota',
        message: `¿Estás seguro de eliminar a "${row.nombre}" del registro?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.mascotasService.eliminar(row._original.id).subscribe({
          next: () => this.loadMascotas(this.currentPage() + 1, this.pageSize(), this.searchTerm()),
          error: () => {}
        });
      }
    });
  }

  crearMascota(): void {
    import('../../components/shared/mascota-form-dialog/mascota-form-dialog').then((module) => {
      this.dialog
        .open(module.MascotaFormDialogComponent, {
          width: '600px',
          maxWidth: '94vw',
          panelClass: 'mascota-form-dialog-panel',
          data: { mascota: null }
        })
        .afterClosed()
        .subscribe((saved) => {
          if (saved === true) {
            this.loadMascotas(this.currentPage() + 1, this.pageSize(), this.searchTerm());
            this.snackBar.open('Mascota creada', 'Cerrar', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
        });
    });
  }

  onView(row: { _original: Mascota }): void {
    this.router.navigate(
      ['/pacientes', row._original.pacienteID, 'turnos'],
      { queryParams: { mascotaId: row._original.id } }
    );
  }
}
