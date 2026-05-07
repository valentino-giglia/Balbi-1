import { Component, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent {
  collapsed = input<boolean>(false);

  menuItems: MenuItem[] = [
    { label: 'Inicio', icon: 'dashboard', route: '/dashboard' },
    { label: 'Veterinarios', icon: 'medical_services', route: '/profesionales' },
    { label: 'Tutores', icon: 'person', route: '/pacientes' },
    { label: 'Mascotas', icon: 'pets', route: '/mascotas' },
    { label: 'Vacunas', icon: 'vaccines', route: '/vacunas' },
    { label: 'Servicios', icon: 'healing', route: '/servicios' },
    { label: 'Turnos', icon: 'event', route: '/turnos' },
    { label: 'Turnos Pendientes', icon: 'pending_actions', route: '/turnos-pendientes' },
    { label: 'Chat', icon: 'chat', route: '/chat' },
    { label: 'Campos personalizados', icon: 'tune', route: '/custom-fields' }
  ];
}
