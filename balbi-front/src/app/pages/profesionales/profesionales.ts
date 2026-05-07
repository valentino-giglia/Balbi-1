import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DataTableComponent, TableColumn } from '../../components/shared/data-table/data-table';
import { LoadingSpinnerComponent } from '../../components/shared/loading-spinner/loading-spinner';
import { ProfesionalesService, Profesional } from '../../services/profesionales.service';
import { ConfirmDialogComponent } from '../../components/shared/confirm-dialog/confirm-dialog';

interface ProfesionalTableRow {
  id: number;
  nombre: string;
  codigo: string;
  telefono: string;
  email: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'BAJA';
  _original: Profesional;
}

@Component({
  selector: 'app-profesionales',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    DataTableComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './profesionales.html',
  styleUrl: './profesionales.scss'
})
export class ProfesionalesComponent implements OnInit {
  profesionales = signal<ProfesionalTableRow[]>([]);
  loading = signal(false);
  totalCount = signal(0);
  currentPage = signal(0);
  pageSize = signal(10);
  searchTerm = signal('');
  columns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'codigo', label: 'Código (turno)', type: 'text' },
    { key: 'telefono', label: 'Teléfono', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'estado', label: 'Estado', type: 'status' }
  ];

  constructor(
    private profesionalesService: ProfesionalesService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProfesionales();
  }

  loadProfesionales(page: number = 1, pageSize: number = 10, searchTerm: string = ''): void {
    this.loading.set(true);
    const filtros: any = {
      estado: 'ACTIVO',
      page,
      pageSize
    };
    
    if (searchTerm) {
      filtros.nombre = searchTerm;
    }

    this.profesionalesService.listar(filtros).subscribe({
      next: (response) => {
        const formatted: ProfesionalTableRow[] = response.data.map(p => ({
          id: p.id,
          nombre: p.nombre,
          codigo: p.codigo || '-',
          telefono: p.telefono || '-',
          email: p.email || '-',
          estado: p.estado,
          _original: p
        }));
        this.profesionales.set(formatted);
        this.totalCount.set(response.pagination.total);
        this.currentPage.set(response.pagination.page - 1);
        this.pageSize.set(response.pagination.pageSize);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.loadProfesionales(event.page, event.pageSize, this.searchTerm());
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(0);
    this.loadProfesionales(1, this.pageSize(), term);
  }

  onEdit(row: any): void {
    this.router.navigate(['/profesionales/editar', row._original.id]);
  }

  onDelete(row: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar veterinario',
        message: `¿Estás seguro de eliminar al veterinario "${row.nombre}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.profesionalesService.eliminar(row._original.id).subscribe({
          next: () => this.loadProfesionales(this.currentPage() + 1, this.pageSize(), this.searchTerm()),
          error: () => {}
        });
      }
    });
  }

  crearProfesional(): void {
    this.router.navigate(['/profesionales/agregar']);
  }
}

