import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError(error => {
      // Temporarily disabled login redirect for development
      // if (error.status === 401) {
      //   // Unauthorized - redirect to login
      //   router.navigate(['/login']);
      // }
      return throwError(() => error);
    })
  );
};

