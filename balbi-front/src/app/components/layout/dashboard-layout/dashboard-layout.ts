import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from '../sidebar/sidebar';
import { HeaderComponent } from '../header/header';
import { NotificationService } from '../../../services/notification.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent, MatSnackBarModule],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss'
})
export class DashboardLayoutComponent {
  sidebarCollapsed = signal(false);
  pageTitle = signal('Inicio');

  private titles: { [key: string]: string } = {
    '/dashboard': 'Inicio',
    '/profesionales': 'Veterinarios',
    '/pacientes': 'Tutores',
    '/mascotas': 'Mascotas',
    '/vacunas': 'Vacunas',
    '/servicios': 'Servicios',
    '/turnos': 'Turnos',
    '/turnos-pendientes': 'Turnos Pendientes',
    '/chat': 'Chat',
    '/chat/detalle/:id': 'Chat Detalle',
    '/mascotas/agregar': 'Nueva mascota',
    '/mascotas/editar/:id': 'Editar mascota',
    '/vacunas/agregar': 'Nueva vacuna',
    '/vacunas/editar/:id': 'Editar vacuna',
    '/pacientes/agregar': 'Nuevo tutor',
    '/pacientes/editar/:id': 'Editar tutor'
  };

  constructor(private router: Router, private notificationService: NotificationService) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects.split('?')[0];
        let title = this.titles[url];
        this.pageTitle.set(title || 'Inicio');
      });
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed.update(value => !value);
  }

  ngOnInit(): void {
    this.notificationService.connect();
  }
}
