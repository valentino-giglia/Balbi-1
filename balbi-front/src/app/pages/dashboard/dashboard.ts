import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ProfesionalesService } from '../../services/profesionales.service';
import { PacientesService } from '../../services/pacientes.service';
import { ServiciosService } from '../../services/servicios.service';
import { TurnosService } from '../../services/turnos.service';
import { TurnosComponent } from '../turnos/turnos';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    TurnosComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  stats = signal({
    profesionales: 0,
    tutores: 0,
    servicios: 0,
    turnos: 0,
    turnosReservados: 0,
    turnosPendientes: 0
  });
  loading = signal(true);

  constructor(
    private profesionalesService: ProfesionalesService,
    private pacientesService: PacientesService,
    private serviciosService: ServiciosService,
    private turnosService: TurnosService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);
    
    Promise.all([
      // Usar pageSize 1 ya que solo necesitamos el total, no los datos
      firstValueFrom(this.profesionalesService.listar({ estado: 'ACTIVO', page: 1, pageSize: 1 })),
      firstValueFrom(this.pacientesService.listar({ estado: 'ACTIVO', page: 1, pageSize: 1 })),
      firstValueFrom(this.serviciosService.listar({ estado: 'ACTIVO', page: 1, pageSize: 1 })),
      firstValueFrom(this.turnosService.listar())
    ]).then(([profesionalesResponse, tutoresResponse, serviciosResponse, turnos]) => {
      const profesionales = profesionalesResponse.pagination?.total || 0;
      const tutores = tutoresResponse.pagination?.total || 0;
      const servicios = serviciosResponse.pagination?.total || 0;
      const turnosList = Array.isArray(turnos) ? turnos : (turnos as any)?.data || [];
      const turnosReservados = turnosList.filter((t: any) => t.estado === 'RESERVADO' || t.estado === 'COMPLETADO').length;
      const turnosPendientes = turnosList.filter((t: any) => t.estado === 'PENDIENTE').length;
      
      this.stats.set({
        profesionales,
        tutores,
        servicios,
        turnos: turnosList.length,
        turnosReservados,
        turnosPendientes
      });
      this.loading.set(false);
    }).catch(() => {
      this.loading.set(false);
    });
  }
}
