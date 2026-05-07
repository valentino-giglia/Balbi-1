import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DataTableComponent, TableColumn, ViewMenuAction } from '../../components/shared/data-table/data-table';
import { LoadingSpinnerComponent } from '../../components/shared/loading-spinner/loading-spinner';
import { PacientesService, Paciente } from '../../services/pacientes.service';
import { ConfirmDialogComponent } from '../../components/shared/confirm-dialog/confirm-dialog';

interface PacienteTableRow {
  id: number;
  nombre: string;
  dni: string;
  telefono: string;
  email: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'BAJA';
  _original: Paciente;
}

@Component({
  selector: 'app-pacientes',
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
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.scss'
})
export class PacientesComponent implements OnInit {
  pacientes = signal<PacienteTableRow[]>([]);
  loading = signal(false);
  totalCount = signal(0);
  currentPage = signal(0);
  pageSize = signal(10);
  searchTerm = signal('');
  columns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'dni', label: 'DNI', type: 'text' },
    { key: 'telefono', label: 'Teléfono', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'estado', label: 'Estado', type: 'status' }
  ];

  constructor(
    private pacientesService: PacientesService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPacientes();
  }

  loadPacientes(page: number = 1, pageSize: number = 10, searchTerm: string = ''): void {
    this.loading.set(true);
    const filtros: any = {
      estado: 'ACTIVO',
      page,
      pageSize
    };
    
    if (searchTerm) {
      filtros.nombre = searchTerm;
    }

    this.pacientesService.listar(filtros).subscribe({
      next: (response) => {
        const formatted: PacienteTableRow[] = response.data.map(p => ({
          id: p.id,
          nombre: p.nombre,
          dni: p.dni ?? '-',
          telefono: p.telefono || '-',
          email: p.email || '-',
          estado: p.estado,
          _original: p
        }));
        this.pacientes.set(formatted);
        this.totalCount.set(response.pagination.total);
        this.currentPage.set(response.pagination.page - 1);
        this.pageSize.set(response.pagination.pageSize);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.loadPacientes(event.page, event.pageSize, this.searchTerm());
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(0);
    this.loadPacientes(1, this.pageSize(), term);
  }

  onEdit(row: any): void {
    this.router.navigate(['/pacientes/editar', row._original.id]);
  }

  onDelete(row: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar tutor',
        message: `¿Estás seguro de eliminar a "${row.nombre}" del registro?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.pacientesService.eliminar(row._original.id).subscribe({
          next: () => this.loadPacientes(this.currentPage() + 1, this.pageSize(), this.searchTerm()),
          error: () => {}
        });
      }
    });
  }

  crearTutor(): void {
    this.router.navigate(['/pacientes/agregar']);
  }

  onViewMenu(event: { action: ViewMenuAction; row: any }): void {
    const paciente = event.row._original as Paciente;
    switch (event.action) {
      case 'detalle':
        this.router.navigate(['/pacientes', paciente.id, 'turnos']);
        break;
      case 'crearMascota':
        this.abrirCrearMascota(paciente);
        break;
      case 'asignarMascota':
        this.abrirAsignarMascota(paciente);
        break;
      case 'elegirMascota':
        this.abrirSelectorMascota(paciente);
        break;
    }
  }

  private abrirSelectorMascota(paciente: Paciente): void {
    import('../../components/shared/mascota-selector-dialog/mascota-selector-dialog').then((module) => {
      const dialogRef = this.dialog.open(module.MascotaSelectorDialogComponent, {
        width: '420px',
        maxWidth: '90vw',
        data: {
          tutorID: paciente.id,
          tutorNombre: paciente.nombre
        }
      });

      dialogRef.afterClosed().subscribe((result: { mascotaID: number | null } | undefined) => {
        if (result?.mascotaID) {
          this.router.navigate(['/pacientes', paciente.id, 'turnos'], {
            queryParams: { mascotaId: result.mascotaID }
          });
        }
      });
    });
  }

  private abrirCrearMascota(paciente: Paciente): void {
    import('../../components/shared/mascota-form-dialog/mascota-form-dialog').then((module) => {
      this.dialog
        .open(module.MascotaFormDialogComponent, {
          width: '600px',
          maxWidth: '94vw',
          panelClass: 'mascota-form-dialog-panel',
          data: { pacienteID: paciente.id, mascota: null }
        })
        .afterClosed()
        .subscribe((saved) => {
          if (saved === true) {
            this.snackBar.open('Mascota creada', 'Cerrar', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
        });
    });
  }

  private abrirAsignarMascota(paciente: Paciente): void {
    import('../../components/shared/asignar-mascota-dialog/asignar-mascota-dialog').then((module) => {
      this.dialog
        .open(module.AsignarMascotaDialogComponent, {
          width: '480px',
          maxWidth: '90vw',
          data: { coTutorId: paciente.id, coTutorNombre: paciente.nombre }
        })
        .afterClosed()
        .subscribe((ok) => {
          if (ok) {
            this.snackBar.open('Mascota asignada al tutor (co-tutor)', 'Cerrar', {
              duration: 3500,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
        });
    });
  }
}

