import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // No mostrar snackbar para errores de autenticación ya que el authInterceptor los maneja
      // También excluir errores si la URL incluye rutas específicas que manejan sus propios errores
      if (error.status === 401 || error.status === 403) {
        return throwError(() => error);
      }

      // No mostrar snackbar si es una ruta de login/register (manejado por el componente)
      if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
        return throwError(() => error);
      }

      // Extraer mensaje de error
      let errorMessage = 'Ha ocurrido un error';
      
      if (error.error) {
        // Intentar obtener el mensaje del error del backend
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error.error) {
          errorMessage = error.error.error;
        } else if (error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Mensajes personalizados según el código de estado
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else if (error.status >= 500) {
        errorMessage = `Error del servidor (${error.status}): ${errorMessage}`;
      } else if (error.status === 404) {
        errorMessage = `Recurso no encontrado: ${errorMessage}`;
      } else if (error.status >= 400 && error.status < 500) {
        // Mantener el mensaje del backend para errores 4xx
        if (!errorMessage || errorMessage === 'Ha ocurrido un error') {
          errorMessage = `Error en la solicitud (${error.status})`;
        }
      }

      // Mostrar snackbar con el error
      snackBar.open(errorMessage, 'Cerrar', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });

      return throwError(() => error);
    })
  );
};
