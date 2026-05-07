import { Component, inject, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { FilesService } from '../../../services/files.service';
import { ImagenPaciente } from '../../../pages/pacientes/detalle-turnos/pacientes.detalle-turnos';

export interface ImagenesPacienteDialogData {
  pacienteID: number;
  /** Si se pasa, se listan/suben archivos por mascota */
  mascotaID?: number | null;
  /** Si se pasa, archivos de esta consulta (turno); si no, archivos generales de la mascota */
  turnoID?: number | null;
  /** Solo para compatibilidad: si se pasa, se ignora y se cargan desde API */
  imagenes?: ImagenPaciente[];
}

/** Item mostrado en la grilla: id puede ser number (API) o string (temporal); tipoArchivo: IMAGEN | DOCUMENTO */
export interface ImagenItem extends Omit<ImagenPaciente, 'id'> {
  id: number | string;
  tipoArchivo?: string | null;
}

@Component({
  selector: 'app-imagenes-paciente-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  templateUrl: './imagenes-paciente-dialog.html',
  styleUrl: './imagenes-paciente-dialog.scss'
})
export class ImagenesPacienteDialogComponent implements OnInit {
  private filesService = inject(FilesService);
  dialogRef = inject(MatDialogRef<ImagenesPacienteDialogComponent>);
  data = inject<ImagenesPacienteDialogData>(MAT_DIALOG_DATA);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  imagenes: ImagenItem[] = [];
  imagenPreview: ImagenItem | null = null;
  indicePreview = -1;

  loading = false;
  uploading = false;
  page = 1;
  pageSize = 12;
  total = 0;
  totalPages = 0;

  ngOnInit(): void {
    this.cargarPagina(1);
  }

  cargarPagina(page: number): void {
    this.loading = true;
    const params: { pacienteID: number; mascotaID?: number; turnoID?: number; page: number; pageSize: number } = {
      pacienteID: this.data.pacienteID,
      page,
      pageSize: this.pageSize
    };
    if (this.data.mascotaID != null) params.mascotaID = this.data.mascotaID;
    if (this.data.turnoID != null) params.turnoID = this.data.turnoID;
    this.filesService.listar(params).subscribe({
      next: (res) => {
        this.imagenes = res.data.map((f) => this.fileToImagen(f));
        this.page = res.pagination.page;
        this.pageSize = res.pagination.pageSize;
        this.total = res.pagination.total;
        this.totalPages = res.pagination.totalPages;
        this.loading = false;
        this.cerrarPreview();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onPaginate(event: PageEvent): void {
    if (event.pageSize !== this.pageSize) {
      this.pageSize = event.pageSize;
    }
    this.cargarPagina(event.pageIndex + 1);
  }

  private fileToImagen(f: { id: number; url: string | null; nombreArchivo: string | null; createdAt: string; tipoArchivo?: string | null }): ImagenItem {
    return {
      id: f.id,
      url: f.url || '',
      fecha: f.createdAt,
      descripcion: f.nombreArchivo || undefined,
      tipoArchivo: f.tipoArchivo ?? 'IMAGEN'
    };
  }

  onSeleccionarArchivos(): void {
    this.fileInput.nativeElement.click();
  }

  onArchivosSeleccionados(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.uploading = true;
    const files = Array.from(input.files);
    let done = 0;

    const checkDone = () => {
      done++;
      if (done === files.length) {
        this.uploading = false;
        this.cargarPagina(this.page);
      }
    };

    files.forEach((file) => {
      this.filesService.subir({
        pacienteID: this.data.pacienteID,
        mascotaID: this.data.mascotaID ?? undefined,
        turnoID: this.data.turnoID ?? undefined,
        file
      }).subscribe({
        next: (created) => {
          this.imagenes.unshift(this.fileToImagen(created));
          this.total++;
          checkDone();
        },
        error: () => checkDone()
      });
    });

    input.value = '';
  }

  eliminarImagen(index: number): void {
    const item = this.imagenes[index];
    if (typeof item.id !== 'number') {
      this.imagenes.splice(index, 1);
      if (this.indicePreview === index) this.cerrarPreview();
      else if (this.indicePreview > index) this.indicePreview--;
      return;
    }

    this.filesService.eliminar(item.id).subscribe({
      next: () => {
        this.imagenes.splice(index, 1);
        this.total--;
        if (this.indicePreview === index) this.cerrarPreview();
        else if (this.indicePreview > index) this.indicePreview--;
      }
    });
  }

  abrirPreview(imagen: ImagenItem, index: number): void {
    if (imagen.tipoArchivo === 'DOCUMENTO' && imagen.url) {
      window.open(imagen.url, '_blank');
      return;
    }
    this.imagenPreview = imagen;
    this.indicePreview = index;
  }

  esImagen(item: ImagenItem): boolean {
    return item.tipoArchivo !== 'DOCUMENTO';
  }

  cerrarPreview(): void {
    this.imagenPreview = null;
    this.indicePreview = -1;
  }

  imagenAnterior(): void {
    const prevIndex = this.getPrevImagenIndex(this.indicePreview);
    if (prevIndex >= 0) {
      this.indicePreview = prevIndex;
      this.imagenPreview = this.imagenes[prevIndex];
    }
  }

  imagenSiguiente(): void {
    const nextIndex = this.getSiguienteImagenIndex(this.indicePreview);
    if (nextIndex >= 0) {
      this.indicePreview = nextIndex;
      this.imagenPreview = this.imagenes[nextIndex];
    }
  }

  getPrevImagenIndex(fromIndex: number): number {
    for (let i = fromIndex - 1; i >= 0; i--) {
      if (this.esImagen(this.imagenes[i])) return i;
    }
    return -1;
  }

  getSiguienteImagenIndex(fromIndex: number): number {
    for (let i = fromIndex + 1; i < this.imagenes.length; i++) {
      if (this.esImagen(this.imagenes[i])) return i;
    }
    return -1;
  }

  puedeIrAnterior(): boolean {
    return this.getPrevImagenIndex(this.indicePreview) >= 0;
  }

  puedeIrSiguiente(): boolean {
    return this.getSiguienteImagenIndex(this.indicePreview) >= 0;
  }

  onGuardar(): void {
    this.dialogRef.close(true);
  }

  onCancelar(): void {
    this.dialogRef.close();
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
