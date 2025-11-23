import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError, of } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Log error for debugging
      console.warn('API Error:', error.url, error.status, error.message);
      
      // For development, return empty responses instead of failing
      // This allows the UI to work with mock data
      if (error.status === 0 || error.status >= 500) {
        // Network error or server error - return empty response
        // Services will handle fallback to mock data
        return throwError(() => error);
      }
      
      // For 404s and other client errors, still throw to let services handle
      return throwError(() => error);
    })
  );
};

