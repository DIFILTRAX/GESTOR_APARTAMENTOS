/*
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable, tap } from 'rxjs';

export interface Edificio {
  id_edificio: string;
  nombre: string;
  direccion: string;
}

@Injectable({
  providedIn: 'root'
})
export class EdificiosService {

  private http = inject(HttpClient);

  private _edificios = signal<Edificio[]>([]);

  readonly edificios = this._edificios.asReadonly();

  private apiUrl = `${environment.apiUrl}/propiedades/edificios/`;

  // ─────────────────────────────
  // GET
  // ─────────────────────────────
  cargar(): Observable<Edificio[]> {
    return this.http.get<Edificio[]>(this.apiUrl)
      .pipe(
        tap(data => this._edificios.set(data))
      );
  }

  // ─────────────────────────────
  // POST
  // ─────────────────────────────
  crear(data: Edificio): Observable<Edificio> {
    return this.http.post<Edificio>(this.apiUrl, data)
      .pipe(
        tap(nuevo => {
          this._edificios.update(list => [nuevo, ...list]);
        })
      );
  }

  // ─────────────────────────────
  // PUT
  // ─────────────────────────────
  actualizar(id: string, data: Edificio): Observable<Edificio> {
    return this.http.put<Edificio>(
      `${this.apiUrl}${id}/`,
      data
    ).pipe(
      tap(editado => {
        this._edificios.update(list =>
          list.map(e =>
            e.id_edificio === id ? editado : e
          )
        );
      })
    );
  }

  // ─────────────────────────────
  // DELETE
  // ─────────────────────────────
  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`)
      .pipe(
        tap(() => {
          this._edificios.update(list =>
            list.filter(e => e.id_edificio !== id)
          );
        })
      );
  }
}
*/