import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardLayoutComponent } from './components/layout/dashboard-layout/dashboard-layout';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { ProfesionalesComponent } from './pages/profesionales/profesionales';
import { ProfesionalesAgregarComponent } from './pages/profesionales/agregar/profesionales.agregar';
import { ProfesionalesEditarComponent } from './pages/profesionales/editar/profesionales.editar';
import { PacientesComponent } from './pages/pacientes/pacientes';
import { PacientesAgregarComponent } from './pages/pacientes/agregar/pacientes.agregar';
import { PacientesEditarComponent } from './pages/pacientes/editar/pacientes.editar';
import { PacientesDetalleTurnosComponent } from './pages/pacientes/detalle-turnos/pacientes.detalle-turnos';
import { MascotasComponent } from './pages/mascotas/mascotas';
import { MascotasAgregarComponent } from './pages/mascotas/agregar/mascotas.agregar';
import { MascotasEditarComponent } from './pages/mascotas/editar/mascotas.editar';
import { VacunasComponent } from './pages/vacunas/vacunas';
import { VacunasAgregarComponent } from './pages/vacunas/agregar/vacunas.agregar';
import { VacunasEditarComponent } from './pages/vacunas/editar/vacunas.editar';
import { ServiciosComponent } from './pages/servicios/servicios';
import { ServiciosAgregarComponent } from './pages/servicios/agregar/servicios.agregar';
import { ServiciosEditarComponent } from './pages/servicios/editar/servicios.editar';
import { TurnosComponent } from './pages/turnos/turnos';
import { TurnosPendientesComponent } from './pages/turnos-pendientes/turnos-pendientes';
import { ChatComponent } from './pages/chat/chat';
import { ChatDetalleComponent } from './pages/chat/detalle/chat-detalle';
import { authGuard } from './guards/auth.guard';
import { CustomFieldsComponent } from './pages/custom-fields/custom-fields';
import { CustomFieldsAgregarComponent } from './pages/custom-fields/agregar/custom-fields.agregar';
import { CustomFieldsEditarComponent } from './pages/custom-fields/editar/custom-fields.editar';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profesionales', component: ProfesionalesComponent },
      { path: 'profesionales/agregar', component: ProfesionalesAgregarComponent },
      { path: 'profesionales/editar/:id', component: ProfesionalesEditarComponent },
      { path: 'pacientes', component: PacientesComponent },
      { path: 'pacientes/agregar', component: PacientesAgregarComponent },
      { path: 'pacientes/editar/:id', component: PacientesEditarComponent },
      { path: 'pacientes/:id/turnos', component: PacientesDetalleTurnosComponent },
      { path: 'mascotas', component: MascotasComponent },
      { path: 'mascotas/agregar', component: MascotasAgregarComponent },
      { path: 'mascotas/editar/:id', component: MascotasEditarComponent },
      { path: 'vacunas', component: VacunasComponent },
      { path: 'vacunas/agregar', component: VacunasAgregarComponent },
      { path: 'vacunas/editar/:id', component: VacunasEditarComponent },
      { path: 'servicios', component: ServiciosComponent },
      { path: 'servicios/agregar', component: ServiciosAgregarComponent },
      { path: 'servicios/editar/:id', component: ServiciosEditarComponent },
      { path: 'custom-fields', component: CustomFieldsComponent },
      { path: 'custom-fields/agregar', component: CustomFieldsAgregarComponent },
      { path: 'custom-fields/editar/:id', component: CustomFieldsEditarComponent },
      { path: 'turnos', component: TurnosComponent },
      { path: 'turnos-pendientes', component: TurnosPendientesComponent },
      { path: 'chat', component: ChatComponent },
      { path: 'chat/detalle/:id', component: ChatDetalleComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
