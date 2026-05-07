import { Component, input, output, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'currency' | 'status' | 'actions' | 'toggle';
  toggleChange?: (row: any, value: boolean) => void;
}

export type ViewMenuAction = 'detalle' | 'crearMascota' | 'asignarMascota' | 'elegirMascota';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatMenuModule,
    FormsModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss'
})
export class DataTableComponent implements OnInit {
  columns = input.required<TableColumn[]>();
  data = input.required<any[]>();
  loading = input<boolean>(false);
  pageSize = input<number>(10);
  pageSizeOptions = input<number[]>([10, 25, 50, 100]);
  searchPlaceholder = input<string>('Buscar...');
  showSearch = input<boolean>(true);
  showActions = input<boolean>(true);
  showViewAction = input<boolean>(true);
  /** Si es true, el ícono "ver" abre un menú (emite onViewMenu). Si es false, un clic emite onView. */
  viewActionAsMenu = input<boolean>(false);
  showEditAction = input<boolean>(true);
  showDeleteAction = input<boolean>(true);
  totalCount = input<number>(0);
  serverSidePagination = input<boolean>(false);
  currentPageIndex = input<number>(0);
  currentSearchTerm = input<string>('');
  currentPage = signal<number>(0);

  onView = output<any>();
  onViewMenu = output<{ action: ViewMenuAction; row: any }>();
  onEdit = output<any>();
  onDelete = output<any>();
  onPageChange = output<{ page: number; pageSize: number }>();
  onSearch = output<string>();

  searchTerm = signal<string>('');
  displayedColumns: string[] = [];
  filteredData = signal<any[]>([]);
  private searchSubject = new Subject<string>();
  private isInitialized = false;
  private lastSearchTerm = '';

  constructor() {
    // Debounce para búsqueda del servidor
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(term => {
      if (this.serverSidePagination()) {
        this.currentPage.set(0); // Reset a primera página cuando se busca
        this.lastSearchTerm = term; // Guardar el último término buscado
        this.onSearch.emit(term);
      }
    });

    effect(() => {
      // Sincronizar currentPage cuando cambia el input
      if (this.serverSidePagination()) {
        this.currentPage.set(this.currentPageIndex());
        // NO sincronizar searchTerm desde el padre en el effect después de la inicialización
        // El searchTerm interno debe mantenerse siempre que el usuario lo haya establecido
        // Solo sincronizar durante la inicialización
        if (!this.isInitialized) {
          const parentSearchTerm = this.currentSearchTerm();
          if (parentSearchTerm !== undefined && parentSearchTerm !== null && parentSearchTerm !== '') {
            this.searchTerm.set(parentSearchTerm);
            this.lastSearchTerm = parentSearchTerm;
          }
        }
        // En paginación del servidor, usar los datos directamente
        // El searchTerm se mantiene independientemente de los cambios en data()
        this.filteredData.set(this.data());
      } else {
        // Cliente-side filtering
        const term = this.searchTerm().toLowerCase();
        const data = this.data();
        if (!term) {
          this.filteredData.set(data);
        } else {
          this.filteredData.set(
            data.filter(item =>
              Object.values(item).some(val =>
                val?.toString().toLowerCase().includes(term)
              )
            )
          );
        }
      }
    });
  }

  onSearchChange(term: string): void {
    // Conservar el término de búsqueda - siempre mantenerlo
    const trimmedTerm = term || '';
    this.searchTerm.set(trimmedTerm);
    this.lastSearchTerm = trimmedTerm; // Guardar el último término
    if (this.serverSidePagination()) {
      this.searchSubject.next(trimmedTerm);
    }
  }

  ngOnInit(): void {
    this.displayedColumns = this.columns().map(col => col.key);
    if (this.showActions()) {
      this.displayedColumns.push('actions');
    }
    
    // Sincronizar currentPage con el input
    if (this.serverSidePagination()) {
      this.currentPage.set(this.currentPageIndex());
      // Inicializar searchTerm con el valor del padre si está disponible
      const parentSearchTerm = this.currentSearchTerm();
      if (parentSearchTerm && this.searchTerm() === '') {
        this.searchTerm.set(parentSearchTerm);
      }
      this.isInitialized = true;
    }
    
    if (!this.serverSidePagination()) {
      const term = this.searchTerm().toLowerCase();
      const data = this.data();
      if (!term) {
        this.filteredData.set(data);
      } else {
        this.filteredData.set(
          data.filter(item =>
            Object.values(item).some(val =>
              val?.toString().toLowerCase().includes(term)
            )
          )
        );
      }
    } else {
      this.filteredData.set(this.data());
    }
  }

  onPageEvent(event: PageEvent): void {
    if (this.serverSidePagination()) {
      this.currentPage.set(event.pageIndex);
      this.onPageChange.emit({
        page: event.pageIndex + 1, // Material usa índice 0, backend usa 1
        pageSize: event.pageSize
      });
    }
  }

  formatValue(value: any, type?: string): string {
    if (value === null || value === undefined) return '-';
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS'
        }).format(value);
      case 'date':
        return new Date(value).toLocaleDateString('es-AR');
      case 'status':
        return value;
      default:
        return value.toString();
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVO':
        return 'status-active';
      case 'INACTIVO':
        return 'status-inactive';
      case 'BAJA':
        return 'status-baja';
      default:
        return '';
    }
  }

  onToggleChange(row: any, column: TableColumn, value: boolean): void {
    if (column.toggleChange) {
      column.toggleChange(row, value);
    }
  }
}

