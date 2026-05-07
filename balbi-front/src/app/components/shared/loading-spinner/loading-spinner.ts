import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './loading-spinner.html',
  styleUrl: './loading-spinner.scss'
})
export class LoadingSpinnerComponent {
  diameter = input<number>(50);
  overlay = input<boolean>(false);
}

