import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule, MatChipListboxChange } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoadingSpinnerComponent } from '../../components/shared/loading-spinner/loading-spinner';
import { ChatService } from '../../services/chat.service';
import { PacientesService, Paciente } from '../../services/pacientes.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatTooltipModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.scss'
})
export class ChatComponent implements OnInit {
  tutores = signal<Paciente[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  totalItems = signal(0);
  pageSize = signal(10);
  currentPage = signal(0);
  filtroDerivados = signal<'todos' | 'derivados'>('todos');
  displayedColumns: string[] = ['nombre', 'dni', 'telefono', 'kapso_agent_status', 'actions'];

  constructor(
    private chatService: ChatService,
    private pacientesService: PacientesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTutores(1);
  }

  onFiltroDerivadosChange(event: MatChipListboxChange): void {
    const value = event.value as 'todos' | 'derivados';
    if (value === 'todos' || value === 'derivados') {
      this.filtroDerivados.set(value);
      this.loadTutores(1);
    }
  }

  loadTutores(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    const snDerivado = this.filtroDerivados() === 'derivados' ? true : undefined;
    const filtros = snDerivado !== undefined ? { snDerivado } : undefined;
    this.chatService.listarPacientesConChat(page, this.pageSize(), filtros).subscribe({
      next: (response) => {
        this.tutores.set(response.data);
        this.totalItems.set(response.total);
        this.currentPage.set(response.currentPage - 1);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al cargar tutores');
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.loadTutores(event.pageIndex + 1);
  }

  abrirChat(row: Paciente): void {
    this.router.navigate(['/chat/detalle', row.id]);
  }

  toggleKapsoAgentStatus(row: Paciente, event: any): void {
    event.stopPropagation();
    const nuevoStatus = row.kapso_agent_status === 'ON' ? 'OFF' : 'ON';
    this.pacientesService.actualizar(row.id, { kapso_agent_status: nuevoStatus }).subscribe({
      next: () => {
        row.kapso_agent_status = nuevoStatus;
      },
      error: () => {
        this.loadTutores(this.currentPage() + 1);
      }
    });
  }

  getWhatsAppLink(telefono: string | undefined): string {
    if (!telefono) return '#';
    const digits = telefono.replace(/\D/g, '');
    return digits ? `https://wa.me/${digits}` : '#';
  }
}
