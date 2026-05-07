import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LoadingSpinnerComponent } from '../../../components/shared/loading-spinner/loading-spinner';
import { CustomFieldsService, CustomFieldScope } from '../../../services/custom-fields.service';

@Component({
  selector: 'app-custom-fields-editar',
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
  templateUrl: './custom-fields.editar.html',
  styleUrl: './custom-fields.editar.scss'
})
export class CustomFieldsEditarComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  loadingData = signal(true);
  error = signal<string | null>(null);

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
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      key: ['', [Validators.required]],
      label: ['', [Validators.required]],
      type: ['text'],
      scope: ['consulta', [Validators.required]],
      orden: [0, [Validators.required]]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadCustomField(Number(id));
  }

  loadCustomField(id: number): void {
    this.loadingData.set(true);
    this.customFieldsService.obtener(id).subscribe({
      next: (data) => {
        this.form.patchValue({
          key: data.key,
          label: data.label,
          type: data.type || 'text',
          scope: data.scope,
          orden: data.orden ?? 0
        });
        this.loadingData.set(false);
      },
      error: () => {
        this.error.set('Error al cargar campo personalizado');
        this.loadingData.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const id = this.route.snapshot.params['id'];
    this.customFieldsService.actualizar(Number(id), this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/custom-fields']);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al actualizar campo personalizado');
        this.loading.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/custom-fields']);
  }
}

