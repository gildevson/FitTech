import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const authReq = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Token expirado/inválido: limpa a sessão e volta para o login
      if (err.status === 401 && token && !req.url.includes('/api/auth/')) {
        authService.logout();
      }
      return throwError(() => err);
    })
  );
};
