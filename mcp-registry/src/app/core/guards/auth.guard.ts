import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  // Temporarily disabled for development - allow all routes
  // TODO: Re-enable when login component is implemented
  return true;
  
  // Original implementation (commented out):
  // const authService = inject(AuthService);
  // const router = inject(Router);
  // 
  // if (authService.isAuthenticated()) {
  //   return true;
  // }
  // 
  // router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  // return false;
};

