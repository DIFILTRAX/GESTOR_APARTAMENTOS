import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notificacion, TipoNotificacion } from '../models/models';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private http = inject(HttpClient);

  private _notificaciones      = signal<Notificacion[]>([]);
  private _tiposNotificacion   = signal<TipoNotificacion[]>([]);

  readonly notificaciones    = this._notificaciones.asReadonly();
  readonly tiposNotificacion = this._tiposNotificacion.asReadonly();

  // ── NOTIFICACIONES ──
  cargarNotificaciones(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${environment.apiUrl}/notificaciones/`)
      .pipe(tap(data => this._notificaciones.set(data)));
  }

  crearNotificacion(data: Partial<Notificacion>): Observable<Notificacion> {
    return this.http.post<Notificacion>(`${environment.apiUrl}/notificaciones/`, data)
      .pipe(tap(n => this._notificaciones.update(list => [n, ...list])));
  }

  actualizarNotificacion(id: number, data: Partial<Notificacion>): Observable<Notificacion> {
    return this.http.put<Notificacion>(`${environment.apiUrl}/notificaciones/${id}/`, data)
      .pipe(tap(u => this._notificaciones.update(list =>
        list.map(n => n.id_notificacion === id ? u : n)
      )));
  }

  eliminarNotificacion(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/notificaciones/${id}/`)
      .pipe(tap(() => this._notificaciones.update(list =>
        list.filter(n => n.id_notificacion !== id)
      )));
  }

  // ── TIPOS NOTIFICACION ──
  cargarTipos(): Observable<TipoNotificacion[]> {
    return this.http.get<TipoNotificacion[]>(`${environment.apiUrl}/notificaciones/tipos/`)
      .pipe(tap(data => this._tiposNotificacion.set(data)));
  }

  crearTipo(data: Partial<TipoNotificacion>): Observable<TipoNotificacion> {
    return this.http.post<TipoNotificacion>(`${environment.apiUrl}/notificaciones/tipos/`, data)
      .pipe(tap(n => this._tiposNotificacion.update(list => [...list, n])));
  }

  actualizarTipo(id: number, data: Partial<TipoNotificacion>): Observable<TipoNotificacion> {
    return this.http.put<TipoNotificacion>(`${environment.apiUrl}/notificaciones/tipos/${id}/`, data)
      .pipe(tap(u => this._tiposNotificacion.update(list =>
        list.map(t => t.id_tipo_notificacion === id ? u : t)
      )));
  }

  eliminarTipo(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/notificaciones/tipos/${id}/`)
      .pipe(tap(() => this._tiposNotificacion.update(list =>
        list.filter(t => t.id_tipo_notificacion !== id)
      )));
  }
  // ── SCHEDULER ──
  obtenerEstadoScheduler(): Observable<{ activo: boolean }> {
    return this.http.get<{ activo: boolean }>(
      `${environment.apiUrl}/notificaciones/scheduler/`
    );
  }

  toggleScheduler(activo: boolean): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/notificaciones/scheduler/`,
      { activo }
    );
  }

  // ── CORREO MASIVO ──
  enviarRecordatorio(): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/notificaciones/enviar-recordatorio/`,
      {}
    );
  }


}