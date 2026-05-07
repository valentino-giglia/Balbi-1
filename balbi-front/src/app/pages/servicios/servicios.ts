import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DataTableComponent, TableColumn } from '../../components/shared/data-table/data-table';
import { LoadingSpinnerComponent } from '../../components/shared/loading-spinner/loading-spinner';
import { ServiciosService, Servicio } from '../../services/servicios.service';
import { ConfirmDialogComponent } from '../../components/shared/confirm-dialog/confirm-dialog';

interface ServicioTableRow {
  id: number;
  nombre: string;
  codigo: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'BAJA';
  _original: Servicio;
}

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    DataTableComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './servicios.html',
  styleUrl: './servicios.scss'
})
export class ServiciosComponent implements OnInit {
  servicios = signal<ServicioTableRow[]>([]);
  loading = signal(false);
  totalCount = signal(0);
  currentPage = signal(0);
  pageSize = signal(10);
  searchTerm = signal('');
  columns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'codigo', label: 'Código', type: 'text' },
    { key: 'estado', label: 'Estado', type: 'status' }
  ];

  constructor(
    private serviciosService: ServiciosService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadServicios();
  }

  loadServicios(page: number = 1, pageSize: number = 10, searchTerm: string = ''): void {
    this.loading.set(true);
    const filtros: any = {
      estado: 'ACTIVO',
      page,
      pageSize
    };
    
    if (searchTerm) {
      filtros.nombre = searchTerm;
    }

    this.serviciosService.listar(filtros).subscribe({
      next: (response) => {
        const formatted: ServicioTableRow[] = response.data.map(s => ({
          id: s.id,
          nombre: s.nombre,
          codigo: s.codigo,
          estado: s.estado,
          _original: s
        }));
        this.servicios.set(formatted);
        this.totalCount.set(response.pagination.total);
        this.currentPage.set(response.pagination.page - 1);
        this.pageSize.set(response.pagination.pageSize);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.loadServicios(event.page, event.pageSize, this.searchTerm());
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(0);
    this.loadServicios(1, this.pageSize(), term);
  }

  onEdit(row: any): void {
    this.router.navigate(['/servicios/editar', row._original.id]);
  }

  onDelete(row: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Servicio',
        message: `¿Estás seguro de eliminar el servicio "${row.nombre}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.serviciosService.eliminar(row._original.id).subscribe({
          next: () => this.loadServicios(this.currentPage() + 1, this.pageSize(), this.searchTerm()),
          error: () => {}
        });
      }
    });
  }

  crearServicio(): void {
    this.router.navigate(['/servicios/agregar']);
  }
}
