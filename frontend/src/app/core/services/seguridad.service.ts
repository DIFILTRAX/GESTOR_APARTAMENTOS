import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Rol {
  id_rol: number;
  nombre: string;
}

export interface Perfil {
  id_perfil: number;
  rol: number;
  rol_nombre?: string;
  nombre: string;
}

export interface Formulario {
  id_formulario: number;
  nombre_formulario: string;
  nodo_principal: string;
  dependencia: number | null;
  dependencia_nombre?: string;
  orden: number;
  icono: string | null;
  redirect: string;
}

export interface Permiso {
  perfil: number;
  perfil_nombre?: string;
  formulario: number;
  formulario_nombre?: string;
  crear: 'S' | 'N';
  editar: 'S' | 'N';
  leer: 'S' | 'N';
  eliminar: 'S' | 'N';
}

@Injectable({ providedIn: 'root' })
export class SeguridadService {
  private http = inject(HttpClient);

  private _roles       = signal<Rol[]>([]);
  private _perfiles    = signal<Perfil[]>([]);
  private _formularios = signal<Formulario[]>([]);
  private _permisos    = signal<Permiso[]>([]);

  readonly roles       = this._roles.asReadonly();
  readonly perfiles    = this._perfiles.asReadonly();
  readonly formularios = this._formularios.asReadonly();
  readonly permisos    = this._permisos.asReadonly();

  // ── ROLES ──
  cargarRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${environment.apiUrl}/usuarios/roles/`)
      .pipe(tap(data => this._roles.set(data)));
  }
  crearRol(data: Partial<Rol>): Observable<Rol> {
    return this.http.post<Rol>(`${environment.apiUrl}/usuarios/roles/`, data)
      .pipe(tap(n => this._roles.update(list => [...list, n])));
  }
  actualizarRol(id: number, data: Partial<Rol>): Observable<Rol> {
    return this.http.put<Rol>(`${environment.apiUrl}/usuarios/roles/${id}/`, data)
      .pipe(tap(u => this._roles.update(list => list.map(r => r.id_rol === id ? u : r))));
  }
  eliminarRol(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/usuarios/roles/${id}/`)
      .pipe(tap(() => this._roles.update(list => list.filter(r => r.id_rol !== id))));
  }

  // ── PERFILES ──
  cargarPerfiles(): Observable<Perfil[]> {
    return this.http.get<Perfil[]>(`${environment.apiUrl}/usuarios/perfiles/`)
      .pipe(tap(data => this._perfiles.set(data)));
  }
  crearPerfil(data: Partial<Perfil>): Observable<Perfil> {
    return this.http.post<Perfil>(`${environment.apiUrl}/usuarios/perfiles/`, data)
      .pipe(tap(n => this._perfiles.update(list => [...list, n])));
  }
  actualizarPerfil(id: number, data: Partial<Perfil>): Observable<Perfil> {
    return this.http.put<Perfil>(`${environment.apiUrl}/usuarios/perfiles/${id}/`, data)
      .pipe(tap(u => this._perfiles.update(list => list.map(p => p.id_perfil === id ? u : p))));
  }
  eliminarPerfil(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/usuarios/perfiles/${id}/`)
      .pipe(tap(() => this._perfiles.update(list => list.filter(p => p.id_perfil !== id))));
  }

  // ── FORMULARIOS ──
  cargarFormularios(): Observable<Formulario[]> {
    return this.http.get<Formulario[]>(`${environment.apiUrl}/usuarios/formularios/`)
      .pipe(tap(data => this._formularios.set(data)));
  }
  crearFormulario(data: Partial<Formulario>): Observable<Formulario> {
    return this.http.post<Formulario>(`${environment.apiUrl}/usuarios/formularios/`, data)
      .pipe(tap(n => this._formularios.update(list => [...list, n])));
  }
  actualizarFormulario(id: number, data: Partial<Formulario>): Observable<Formulario> {
    return this.http.put<Formulario>(`${environment.apiUrl}/usuarios/formularios/${id}/`, data)
      .pipe(tap(u => this._formularios.update(list => list.map(f => f.id_formulario === id ? u : f))));
  }
  eliminarFormulario(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/usuarios/formularios/${id}/`)
      .pipe(tap(() => this._formularios.update(list => list.filter(f => f.id_formulario !== id))));
  }

  // ── PERMISOS ──
  cargarPermisos(): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${environment.apiUrl}/usuarios/permisos/`)
      .pipe(tap(data => this._permisos.set(data)));
  }
  crearPermiso(data: Partial<Permiso>): Observable<Permiso> {
    return this.http.post<Permiso>(`${environment.apiUrl}/usuarios/permisos/`, data)
      .pipe(tap(n => this._permisos.update(list => [...list, n])));
  }
  actualizarPermiso(perfilId: number, formularioId: number, data: Partial<Permiso>): Observable<Permiso> {
    return this.http.put<Permiso>(
      `${environment.apiUrl}/usuarios/permisos/${perfilId}/${formularioId}/`, data
    ).pipe(tap(u => this._permisos.update(list =>
      list.map(p => p.perfil === perfilId && p.formulario === formularioId ? u : p)
    )));
  }
  eliminarPermiso(perfilId: number, formularioId: number): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/usuarios/permisos/${perfilId}/${formularioId}/`
    ).pipe(tap(() => this._permisos.update(list =>
      list.filter(p => !(p.perfil === perfilId && p.formulario === formularioId))
    )));
  }
}