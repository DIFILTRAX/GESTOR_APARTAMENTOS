import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Pago, TipoPago, EstadoPago } from '../models/models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);

  private _pagos   = signal<Pago[]>([]);
  private _tipos   = signal<TipoPago[]>([]);
  private _estados = signal<EstadoPago[]>([]);

  readonly pagos   = this._pagos.asReadonly();
  readonly tipos   = this._tipos.asReadonly();
  readonly estados = this._estados.asReadonly();

  readonly stats = computed(() => {
    const all = this._pagos();
    return {
      total:          all.length,
      pagados:        all.filter(p => p.estado_pago_nombre === 'Pagado').length,
      pendientes:     all.filter(p => p.estado_pago_nombre === 'Pendiente').length,
      vencidos:       all.filter(p => p.estado_pago_nombre === 'Vencido').length,
      totalRecaudado: all
        .filter(p => p.estado_pago_nombre === 'Pagado')
        .reduce((s, p) => s + Number(p.valor), 0),
    };
  });

  // ── PAGOS ──
  cargarPagos(): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${environment.apiUrl}/pagos/`)
      .pipe(tap(data => this._pagos.set(data)));
  }

  crearPago(pago: Partial<Pago>): Observable<Pago> {
    return this.http.post<Pago>(`${environment.apiUrl}/pagos/`, pago)
      .pipe(tap(n => this._pagos.update(list => [n, ...list])));
  }

  actualizarPago(id: number, cambios: Partial<Pago>): Observable<Pago> {
    return this.http.put<Pago>(`${environment.apiUrl}/pagos/${id}/`, cambios)
      .pipe(tap(u => this._pagos.update(list =>
        list.map(p => p.id_pago === id ? u : p)
      )));
  }

  eliminarPago(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/pagos/${id}/`)
      .pipe(tap(() => this._pagos.update(list =>
        list.filter(p => p.id_pago !== id)
      )));
  }

  // ── TIPOS ──
  cargarTipos(): Observable<TipoPago[]> {
    return this.http.get<TipoPago[]>(`${environment.apiUrl}/pagos/tipos-pagos/`)
      .pipe(tap(data => this._tipos.set(data)));
  }

  crearTipo(data: Partial<TipoPago>): Observable<TipoPago> {
    return this.http.post<TipoPago>(`${environment.apiUrl}/pagos/tipos-pagos/`, data)
      .pipe(tap(n => this._tipos.update(list => [...list, n])));
  }

  actualizarTipo(id: number, data: Partial<TipoPago>): Observable<TipoPago> {
    return this.http.put<TipoPago>(`${environment.apiUrl}/pagos/tipos-pagos/${id}/`, data)
      .pipe(tap(u => this._tipos.update(list =>
        list.map(t => t.id_tipo_pago === id ? u : t)
      )));
  }

  eliminarTipo(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/pagos/tipos-pagos/${id}/`)
      .pipe(tap(() => this._tipos.update(list =>
        list.filter(t => t.id_tipo_pago !== id)
      )));
  }

  // ── ESTADOS ──
  cargarEstados(): Observable<EstadoPago[]> {
    return this.http.get<EstadoPago[]>(`${environment.apiUrl}/pagos/estados-pagos/`)
      .pipe(tap(data => this._estados.set(data)));
  }

  crearEstado(data: Partial<EstadoPago>): Observable<EstadoPago> {
    return this.http.post<EstadoPago>(`${environment.apiUrl}/pagos/estados-pagos/`, data)
      .pipe(tap(n => this._estados.update(list => [...list, n])));
  }

  actualizarEstado(id: number, data: Partial<EstadoPago>): Observable<EstadoPago> {
    return this.http.put<EstadoPago>(`${environment.apiUrl}/pagos/estados-pagos/${id}/`, data)
      .pipe(tap(u => this._estados.update(list =>
        list.map(e => e.id_estado_pago === id ? u : e)
      )));
  }

  eliminarEstado(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/pagos/estados-pagos/${id}/`)
      .pipe(tap(() => this._estados.update(list =>
        list.filter(e => e.id_estado_pago !== id)
      )));
  }

  // ── UI helpers ──
  formatCurrency(val: number): string {
    return '$' + Number(val).toLocaleString('es-CO');
  }

  getBadgeClass(estadoNombre: string): string {
    return {
      'Pagado':    'badge-green',
      'Pendiente': 'badge-amber',
      'Vencido':   'badge-red'
    }[estadoNombre] ?? 'badge-blue';
  }

  getAll(): Pago[] { return this._pagos(); }
}