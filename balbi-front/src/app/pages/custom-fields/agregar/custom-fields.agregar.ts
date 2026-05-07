import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LoadingSpinnerComponent } from '../../../components/shared/loading-spinner/loading-spinner';
import { CustomFieldsService, CustomFieldScope } from '../../../services/custom-fields.service';

@Component({
  selector: 'app-custom-fields-agregar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './custom-fields.agregar.html',
  styleUrl: './custom-fields.agregar.scss'
})
export class CustomFieldsAgregarComponent {
  form: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  keyGenerado = signal('');

  scopeOptions: { value: CustomFieldScope; label: string }[] = [
    { value: 'consulta', label: 'Consulta' },
    { value: 'ficha', label: 'Ficha' }
  ];

  typeOptions: { value: string; label: string }[] = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'date', label: 'Fecha' },
    { value: 'textarea', label: 'Texto largo' },
    { value: 'link', label: 'Enlace (link)' }
  ];

  constructor(
    private fb: FormBuilder,
    private customFieldsService: CustomFieldsService,
    private router: Router
  ) {
    this.form = this.fb.group({
      key: ['', [Validators.required]],
      label: ['', [Validators.required]],
      type: ['text'],
      scope: ['consulta', [Validators.required]],
      orden: [0, [Validators.required]]
    });

    this.form.get('label')?.valueChanges.subscribe((label: string) => {
      if (label) {
        const key = this.labelToKey(label);
        this.keyGenerado.set(key);
        if (!this.form.get('key')?.dirty) {
          this.form.patchValue({ key }, { emitEvent: false });
        }
      } else {
        this.keyGenerado.set('');
      }
    });
  }

  private labelToKey(label: string): string {
    return label
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .replace(/-+/g, '_')
      .replace(/^_|_$/g, '');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.customFieldsService.crear(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/custom-fields']);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al crear campo personalizado');
        this.loading.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/custom-fields']);
  }
}

