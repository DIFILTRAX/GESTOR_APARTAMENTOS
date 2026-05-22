import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  {
  path: 'portafolio',
    loadComponent: () =>
      import('./features/portafolio/portafolio.component').then(m => m.PortafolioComponent)
  },
  
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },

  // ✅ RUTAS DE RESIDENTE — fuera del bloque admin
  {
    path: 'residente',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/residente/residente.component').then(m => m.ResidenteComponent)
  },
  {
    path: 'residente/pagos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/residente/residente-pagos.component').then(m => m.ResidentePagosComponent)
  },

  

  // ✅ RUTAS DE ADMIN
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'pagos',
        loadComponent: () =>
          import('./features/admin/pagos/pagos.component').then(m => m.PagosComponent)
      },
      {
        path: 'edificios',
        loadComponent: () =>
          import('./features/admin/edificios/edificios.component').then(m => m.EdificiosComponent)
      },
      {
        path: 'pisos',
        loadComponent: () =>
          import('./features/admin/pisos/pisos.component').then(m => m.PisosComponent)
      },
      {
        path: 'apartamentos',
        loadComponent: () =>
          import('./features/admin/apartamentos/apartamentos.component').then(m => m.ApartamentosComponent)
      },
      {
        path: 'propietarios',
        loadComponent: () =>
          import('./features/admin/propietarios/propietarios.component').then(m => m.PropietariosComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/admin/usuarios/usuarios.component').then(m => m.UsuariosComponent)
      },
      {
        path: 'tipos-pagos',
        loadComponent: () =>
          import('./features/admin/tipos-pagos/tipos-pagos.component').then(m => m.TiposPagosComponent)
      },
      {
        path: 'estados-pagos',
        loadComponent: () =>
          import('./features/admin/estados-pagos/estados-pagos.component').then(m => m.EstadosPagosComponent)
      },
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('./features/admin/notificaciones/notificaciones.component').then(m => m.NotificacionesComponent)
      },
      {
        path: 'tipos-notificaciones',
        loadComponent: () =>
          import('./features/admin/tipos-notificaciones/tipos-notificaciones.component').then(m => m.TiposNotificacionesComponent)
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./features/admin/roles/roles.component').then(m => m.RolesComponent)
      },
      {
        path: 'perfiles',
        loadComponent: () =>
          import('./features/admin/perfiles/perfiles.component').then(m => m.PerfilesComponent)
      },
      {
        path: 'formularios',
        loadComponent: () =>
          import('./features/admin/formularios/formularios.component').then(m => m.FormulariosComponent)
      },
      {
        path: 'permisos',
        loadComponent: () =>
          import('./features/admin/permisos/permisos.component').then(m => m.PermisosComponent)
      },
      {
        path: 'residentes',
        loadComponent: () =>
          import('./features/admin/residentes/residentes.component').then(m => m.ResidentesComponent)
      },
      {
        path: 'portafolio',
        loadComponent: () =>
          import('./features/admin/portafolio/portafolio.component').then(m => m.PortafolioComponent)
      },
      
    ]
  },

  { path: '**', redirectTo: '/login' }
];