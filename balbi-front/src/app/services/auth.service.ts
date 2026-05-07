import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface LoginResponse {
  token: string;
  refreshToken?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'agenda-eficiencia::token';
  private readonly refreshKey = 'agenda-eficiencia::refresh-token';
  private token: string | null = this.loadFromStorage(this.tokenKey);

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, contrasena: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, contrasena })
      .pipe(
        tap(response => {
          this.saveToken(response.token);
          if (response.refreshToken) {
            sessionStorage.setItem(this.refreshKey, response.refreshToken);
          }
        }),
        catchError(error => throwError(() => error))
      );
  }

  register(data: { nombre: string; email: string; telefono?: string; contrasena: string }): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/register`, data)
      .pipe(
        tap(response => {
          this.saveToken(response.token);
          if (response.refreshToken) {
            sessionStorage.setItem(this.refreshKey, response.refreshToken);
          }
        }),
        catchError(error => throwError(() => error))
      );
  }

  logout(): void {
    this.token = null;
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.refreshKey);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  handleUnauthorized(): void {
    this.logout();
  }

  private saveToken(token: string): void {
    this.token = token;
    sessionStorage.setItem(this.tokenKey, token);
  }

  private loadFromStorage(key: string): string | null {
    return sessionStorage.getItem(key);
  }
}

