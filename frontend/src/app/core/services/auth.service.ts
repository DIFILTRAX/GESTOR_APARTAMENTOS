import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, PermisoMenu } from '../models/models';

export interface ApartamentoPropietario {
  apartamento:     number;
  piso:            number;
  edificio:        string;
  edificio_nombre: string;
}

export interface DatosUsuario {
  identificacion:  string;
  nombre:          string;
  perfil:          number;
  rol:             'admin' | 'propietario';
  apartamento?:    number;
  piso?:           number;
  edificio?:       string;
  edificio_nombre?: string;
  // ✅ Lista completa de apartamentos
  apartamentos?:   ApartamentoPropietario[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY   = 'fyl_access';
  private readonly REFRESH_KEY = 'fyl_refresh';
  private readonly USER_KEY    = 'fyl_user';
  private readonly PERMS_KEY   = 'fyl_permisos';

  private _user     = signal<DatosUsuario | null>(this.loadUser());
  private _permisos = signal<PermisoMenu[]>(this.loadPermisos());
  private _loading  = signal(false);

  readonly user     = this._user.asReadonly();
  readonly permisos = this._permisos.asReadonly();
  readonly loading  = this._loading.asReadonly();

  readonly menuItems = computed(() =>
    this._permisos()
      .filter(p => p.leer === 'S')
      .sort((a, b) => a.orden - b.orden)
  );

  readonly isAdmin = computed(() => this._user()?.rol === 'admin');

  // ──────────────────────────────────────────
  // LOGIN
  // ──────────────────────────────────────────
  login(payload: LoginRequest): Observable<LoginResponse> {
    this._loading.set(true);
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/usuarios/login/`, payload)
      .pipe(
        tap({
          next: (res) => {
            localStorage.setItem(this.TOKEN_KEY, res.access);
            localStorage.setItem(this.REFRESH_KEY, res.refresh);
            this._loading.set(false);
          },
          error: () => this._loading.set(false)
        })
      );
  }

  // ──────────────────────────────────────────
  // CARGAR PERMISOS
  // ──────────────────────────────────────────
  cargarPermisos(): Observable<PermisoMenu[]> {
    return this.http
      .get<PermisoMenu[]>(`${environment.apiUrl}/usuarios/mis-permisos/`)
      .pipe(
        tap(permisos => {
          localStorage.setItem(this.PERMS_KEY, JSON.stringify(permisos));
          this._permisos.set(permisos);
        }),
        switchMap(permisos => {
          // ✅ Sin permisos — usuario sin perfil asignado
          if (permisos.length === 0) {
            const user: DatosUsuario = {
              identificacion: '',
              nombre: 'Usuario',
              perfil: 0,
              rol: 'propietario',
            };
            this._user.set(user);
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            return of(permisos);
          }

          // ✅ Admin: tiene más de 1 permiso o tiene USUARIOS
          const esAdmin = permisos.length > 1 ||
            permisos.some(p => p.formulario === 'USUARIOS');

          if (esAdmin) {
            const user: DatosUsuario = {
              identificacion: '',
              nombre: 'Administrador',
              perfil: 1,
              rol: 'admin',
            };
            this._user.set(user);
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            return of(permisos);
          }

          // ✅ Propietario: carga perfil completo con manejo de error
          return this.cargarDatosPropietario().pipe(
            switchMap(() => of(permisos)),
            catchError(err => {
              console.warn('[AUTH] mi-perfil falló:', err);
              // Si falla, guarda usuario básico para que pueda entrar igual
              const user: DatosUsuario = {
                identificacion: '',
                nombre: 'Propietario',
                perfil: 2,
                rol: 'propietario',
              };
              this._user.set(user);
              localStorage.setItem(this.USER_KEY, JSON.stringify(user));
              return of(permisos);
            })
          );
        })
      );
  }

  // ──────────────────────────────────────────
  // DATOS DEL PROPIETARIO
  // ──────────────────────────────────────────
  cargarDatosPropietario(): Observable<any> {
    return this.http
      .get<any>(`${environment.apiUrl}/usuarios/mi-perfil/`)
      .pipe(
        tap(datos => {
          const user: DatosUsuario = {
            identificacion:  datos.identificacion,
            nombre:          `${datos.primer_nombre} ${datos.primer_apellido}`,
            perfil:          datos.perfil,
            rol:             'propietario',
            // ✅ Primer apartamento como principal
            apartamento:     datos.apartamento,
            piso:            datos.piso,
            edificio:        datos.edificio,
            edificio_nombre: datos.edificio_nombre,
            // ✅ Lista completa
            apartamentos:    datos.apartamentos ?? [],
          };
          this._user.set(user);
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        })
      );
  }

  // ──────────────────────────────────────────
  // UTILS
  // ──────────────────────────────────────────
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.PERMS_KEY);
    this._user.set(null);
    this._permisos.set([]);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken() && !!this._user();
  }

  getRedirectPath(): string {
    return this.isAdmin() ? '/admin/dashboard' : '/residente';
  }

  tienePermiso(
    formulario: string,
    accion: 'leer' | 'crear' | 'editar' | 'eliminar'
  ): boolean {
    const p = this._permisos().find(p => p.formulario === formulario);
    if (!p) return false;
    return p[accion] === 'S';
  }

  private loadUser(): DatosUsuario | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  private loadPermisos(): PermisoMenu[] {
    try {
      const raw = localStorage.getItem(this.PERMS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
}