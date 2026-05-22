import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

//import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Edificio, Piso, Apartamento, Propietario } from '../models/models';


@Injectable({ providedIn: 'root' })
export class PropiedadesService {
  private http = inject(HttpClient);

  private _edificios    = signal<Edificio[]>([]);
  private _pisos        = signal<Piso[]>([]);
  private _apartamentos = signal<Apartamento[]>([]);
  private _propietarios = signal<Propietario[]>([]);

  readonly edificios    = this._edificios.asReadonly();
  readonly pisos        = this._pisos.asReadonly();
  readonly apartamentos = this._apartamentos.asReadonly();
  readonly propietarios = this._propietarios.asReadonly();

  // ── EDIFICIOS ──
  cargarEdificios(): Observable<Edificio[]> {
    return this.http.get<Edificio[]>(`${environment.apiUrl}/propiedades/edificios/`)
      .pipe(tap(data => this._edificios.set(data)));
  }
  crearEdificio(data: Partial<Edificio>): Observable<Edificio> {
    return this.http.post<Edificio>(`${environment.apiUrl}/propiedades/edificios/`, data)
      .pipe(tap(n => this._edificios.update(list => [...list, n])));
  }
  actualizarEdificio(id: string, data: Partial<Edificio>): Observable<Edificio> {
    return this.http.put<Edificio>(`${environment.apiUrl}/propiedades/edificios/${id}/`, data)
      .pipe(tap(u => this._edificios.update(list => list.map(e => e.id_edificio === id ? u : e))));
  }
  eliminarEdificio(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/propiedades/edificios/${id}/`)
      .pipe(tap(() => this._edificios.update(list => list.filter(e => e.id_edificio !== id))));
  }

  // ── PISOS ──
  cargarPisos(): Observable<Piso[]> {
    return this.http.get<Piso[]>(`${environment.apiUrl}/propiedades/pisos/`)
      .pipe(tap(data => {
        // Deduplicación: mantener solo un piso por (id_piso, edificio)
        const vistos = new Set<string>();
        const unicos = data.filter(p => {
          const key = `${p.id_piso}-${p.edificio}`;
          if (vistos.has(key)) return false;
          vistos.add(key);
          return true;
        });
        this._pisos.set(unicos);
      }));
  }
  crearPiso(data: Partial<Piso>): Observable<Piso> {
    return this.http.post<Piso>(`${environment.apiUrl}/propiedades/pisos/`, data)
      .pipe(tap(n => this._pisos.update(list => [...list, n])));
  }
  actualizarPiso(id: number, data: Partial<Piso>): Observable<Piso> {
    return this.http.put<Piso>(`${environment.apiUrl}/propiedades/pisos/${id}/`, data)
      .pipe(tap(u => this._pisos.update(list => list.map(p => p.id_piso === id ? u : p))));
  }
  eliminarPiso(id: number, edificio: string): Observable<void> {
    const params = new HttpParams().set('edificio', edificio);
    return this.http.delete<void>(
      `${environment.apiUrl}/propiedades/pisos/${id}/`,
      { params }
    ).pipe(tap(() => this._pisos.update(list =>
      list.filter(p => !(p.id_piso === id && p.edificio === edificio))
    )));
  }

  // ── APARTAMENTOS ──
  cargarApartamentos(): Observable<Apartamento[]> {
    return this.http.get<Apartamento[]>(`${environment.apiUrl}/propiedades/apartamentos/`)
      .pipe(tap(data => {
        // Deduplicación: mantener solo un apartamento por (id_apartamento, piso, edificio)
        const vistos = new Set<string>();
        const unicos = data.filter(a => {
          const key = `${a.id_apartamento}-${a.piso}-${a.edificio}`;
          if (vistos.has(key)) return false;
          vistos.add(key);
          return true;
        });
        this._apartamentos.set(unicos);
      }));
  }
  crearApartamento(data: Partial<Apartamento>): Observable<Apartamento> {
    return this.http.post<Apartamento>(`${environment.apiUrl}/propiedades/apartamentos/`, data)
      .pipe(tap(n => this._apartamentos.update(list => [...list, n])));
  }
  actualizarApartamento(id: number, data: Partial<Apartamento>): Observable<Apartamento> {
    return this.http.put<Apartamento>(`${environment.apiUrl}/propiedades/apartamentos/${id}/`, data)
      .pipe(tap(u => this._apartamentos.update(list => list.map(a => a.id_apartamento === id ? u : a))));
  }
  eliminarApartamento(id: number, edificio?: string): Observable<void> {
    let params = new HttpParams();
    if (edificio) {
      params = params.set('edificio', edificio);
    }
    return this.http.delete<void>(
      `${environment.apiUrl}/propiedades/apartamentos/${id}/`,
      { params }
    ).pipe(tap(() => this._apartamentos.update(list =>
      list.filter(a => a.id_apartamento !== id)
    )));
  }

  // ── PROPIETARIOS ──
  cargarPropietarios(): Observable<Propietario[]> {
    return this.http.get<Propietario[]>(`${environment.apiUrl}/propiedades/propietarios/`)
      .pipe(tap(data => this._propietarios.set(data)));
  }

  crearPropietario(data: Partial<Propietario>): Observable<Propietario> {
    return this.http.post<Propietario>(
      `${environment.apiUrl}/propiedades/propietarios/`, data
    ).pipe(
      tap(() => {
        // ✅ Recarga la lista completa para tener datos frescos con nombres
        this.cargarPropietarios().subscribe();
      })
    );
  }

  actualizarPropietario(
    identificacion: string,
    data: Partial<Propietario>,
    apartamentoActual: number,
    pisoActual: number,
    edificioActual: string
  ): Observable<Propietario> {
    // ✅ Envía los valores actuales para encontrar el registro exacto
    const payload = {
      ...data,
      apartamento_actual: apartamentoActual,
      piso_actual:        pisoActual,
      edificio_actual:    edificioActual,
    };
    return this.http.put<Propietario>(
      `${environment.apiUrl}/propiedades/propietarios/${identificacion}/`, payload
    ).pipe(tap(u => this._propietarios.update(list =>
      list.map(p =>
        p.identificacion === identificacion &&
        p.apartamento    === apartamentoActual &&
        p.piso           === pisoActual &&
        p.edificio       === edificioActual
          ? u : p
      )
    )));
  }

  eliminarPropietario(
    identificacion: string,
    apartamento: number,
    piso: number,
    edificio: string
  ): Observable<void> {
    const params = new HttpParams()
      .set('apartamento', apartamento.toString())
      .set('piso', piso.toString())
      .set('edificio', edificio);

    return this.http.delete<void>(
      `${environment.apiUrl}/propiedades/propietarios/${identificacion}/`,
      { params }
    ).pipe(tap(() => this._propietarios.update(list =>
      list.filter(p => !(
        p.identificacion === identificacion &&
        p.apartamento    === apartamento &&
        p.piso           === piso &&
        p.edificio       === edificio
      ))
    )));
  }
  
}

/*
// ── PROPIETARIOS ──
  cargarPropietarios(): Observable<Propietario[]> {
    return this.http.get<Propietario[]>(`${environment.apiUrl}/propiedades/propietarios/`)
      .pipe(tap(data => this._propietarios.set(data)));
  }
  crearPropietario(data: Partial<Propietario>): Observable<Propietario> {
    return this.http.post<Propietario>(`${environment.apiUrl}/propiedades/propietarios/`, data)
      .pipe(tap(n => this._propietarios.update(list => [...list, n])));
  }
  actualizarPropietario(id: string, data: Partial<Propietario>, p0: number, p1: number, p2: string): Observable<Propietario> {
    return this.http.put<Propietario>(`${environment.apiUrl}/propiedades/propietarios/${id}/`, data)
      .pipe(tap(u => this._propietarios.update(list => list.map(p => p.identificacion === id ? u : p))));
  }
  eliminarPropietario(id: string, apartamento: number, piso: number, edificio: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/propiedades/propietarios/${id}/`)
      .pipe(tap(() => this._propietarios.update(list => list.filter(p => p.identificacion !== id))));
  }
*/