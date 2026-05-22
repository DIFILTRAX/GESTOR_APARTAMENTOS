import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EdificioService {

  private apiUrl = 'http://127.0.0.1:8000/api/propiedades/edificios/';

  constructor(private http: HttpClient) {}

  getEdificios(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  crearEdificio(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
}