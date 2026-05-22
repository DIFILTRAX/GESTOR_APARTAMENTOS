import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/models';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private _usuarios = signal<Usuario[]>([]);
  readonly usuarios = this._usuarios.asReadonly();

  cargarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${environment.apiUrl}/usuarios/usuarios/`)
      .pipe(tap(data => this._usuarios.set(data)));
  }
  crearUsuario(data: Partial<Usuario>): Observable<Usuario> {
    return this.http.post<Usuario>(`${environment.apiUrl}/usuarios/usuarios/`, data)
      .pipe(tap(n => this._usuarios.update(list => [...list, n])));
  }
  actualizarUsuario(id: string, data: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${environment.apiUrl}/usuarios/usuarios/${id}/`, data)
      .pipe(tap(u => this._usuarios.update(list => list.map(u2 => u2.identificacion === id ? u : u2))));
  }
  eliminarUsuario(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/usuarios/usuarios/${id}/`)
      .pipe(tap(() => this._usuarios.update(list => list.filter(u => u.identificacion !== id))));
  }
}