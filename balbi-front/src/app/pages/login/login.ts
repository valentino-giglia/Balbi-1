import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  loading = false;
  errorMessage: string | null = null;

  form;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {

    this.form = this.fb.group({
      user: ['', Validators.required],
      password: ['', Validators.required]
    });

  }

  handleSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    const { user, password } = this.form.value;

    this.authService.login(user!, password!).subscribe({
      next: () => {
        this.loading = false;
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') || '/dashboard';
        this.router.navigateByUrl(redirectTo);
      },
      error: error => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message || 'Credenciales inválidas, intenta nuevamente.';
      }
    });
  }
}

