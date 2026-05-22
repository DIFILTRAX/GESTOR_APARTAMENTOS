import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const token = auth.getAccessToken();
  console.log('authGuard — url:', state.url, '— token:', !!token);

  if (token) return true;
  return router.createUrlTree(['/login']);
};

export const adminGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const permisos = auth.permisos();
  const isAdmin  = auth.isAdmin();
  console.log('adminGuard — url:', state.url, '— permisos:', permisos.length, '— isAdmin:', isAdmin);

  if (isAdmin) return true;
  return router.createUrlTree(['/residente']);
};