import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DataTableComponent, TableColumn } from '../../components/shared/data-table/data-table';
import { LoadingSpinnerComponent } from '../../components/shared/loading-spinner/loading-spinner';
import { CustomFieldsService, CustomField } from '../../services/custom-fields.service';
import { ConfirmDialogComponent } from '../../components/shared/confirm-dialog/confirm-dialog';

interface CustomFieldTableRow {
  id: number;
  key: string;
  label: string;
  type: string;
  scope: string;
  orden: number;
  _original: CustomField;
}

@Component({
  selector: 'app-custom-fields',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    DataTableComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './custom-fields.html',
  styleUrl: './custom-fields.scss'
})
export class CustomFieldsComponent implements OnInit {
  customFields = signal<CustomFieldTableRow[]>([]);
  loading = signal(false);
  totalCount = signal(0);
  currentPage = signal(0);
  pageSize = signal(10);
  searchTerm = signal('');
  columns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'key', label: 'Clave', type: 'text' },
    { key: 'label', label: 'Etiqueta', type: 'text' },
    { key: 'type', label: 'Tipo', type: 'text' },
    { key: 'scope', label: 'Ámbito', type: 'text' },
    { key: 'orden', label: 'Orden', type: 'number' }
  ];

  constructor(
    private customFieldsService: CustomFieldsService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCustomFields();
  }

  loadCustomFields(page: number = 1, pageSize: number = 10): void {
    this.loading.set(true);
    this.customFieldsService.listar({ page, pageSize }).subscribe({
      next: (response) => {
        const formatted: CustomFieldTableRow[] = response.data.map(f => ({
          id: f.id,
          key: f.key,
          label: f.label,
          type: f.type || 'text',
          scope: this.scopeLabel(f.scope),
          orden: f.orden ?? 0,
          _original: f
        }));
        this.customFields.set(formatted);
        this.totalCount.set(response.pagination.total);
        this.currentPage.set(response.pagination.page - 1);
        this.pageSize.set(response.pagination.pageSize);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private scopeLabel(scope: string): string {
    const map: Record<string, string> = {
      consulta: 'Consulta',
      ficha: 'Ficha'
    };
    return map[scope] || scope;
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.loadCustomFields(event.page + 1, event.pageSize);
  }

  onEdit(row: CustomFieldTableRow): void {
    this.router.navigate(['/custom-fields/editar', row._original.id]);
  }

  onDelete(row: CustomFieldTableRow): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar campo personalizado',
        message: `¿Estás seguro de eliminar el campo "${row.label}" (${row.key})? Los valores ya guardados en consultas o fichas no se borran.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.customFieldsService.eliminar(row._original.id).subscribe({
          next: () => this.loadCustomFields(this.currentPage() + 1, this.pageSize()),
          error: () => {}
        });
      }
    });
  }

  crear(): void {
    this.router.navigate(['/custom-fields/agregar']);
  }
}

