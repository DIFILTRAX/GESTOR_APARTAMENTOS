//compañero
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Pago, Propietario, Usuario } from '../../../core/models/models';
import { PaymentService } from '../../../core/services/payment.service';
import { PropiedadesService } from '../../../core/services/propiedades.service';
import { ToastService } from '../../../core/services/toast.service';
import { UsuariosService } from '../../../core/services/usuarios.service';

interface ResidenteView {
  identificacion: string;
  nombreCompleto: string;
  correo: string;
  celular: string;
  apartamento: number;
  piso: number;
  edificio: string;
  edificioNombre: string;
  pagosTotal: number;
  pagosPagados: number;
  pagosPendientes: number;
  pagosVencidos: number;
  valorTotal: number;
  valorPendiente: number;
  estadoGeneral: 'Al día' | 'Pendiente' | 'Vencido' | 'Sin pagos';
  iniciales: string;
  ultimoVencimiento?: string;
  pagosRecientes: Pago[];
}

@Component({
  selector: 'app-residentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <section class="hero">
        <div class="hero-copy">
          <div class="kicker">Módulo de residentes</div>
          <h2>Propietarios y apartamentos en una sola vista.</h2>
          <p>
            Administra propietarios, revisa su estado de cartera y abre su detalle sin salir del módulo.
            Todo se alimenta de los datos ya cargados en la aplicación.
          </p>
          <div class="hero-actions">
            <button class="btn btn-primary" type="button" (click)="vista.set('cards')">Vista tarjetas</button>
            <button class="btn btn-ghost" type="button" (click)="vista.set('table')">Vista tabla</button>
            <button class="btn btn-soft" type="button" (click)="irAPagos()">Ir a pagos</button>
          </div>
        </div>

        <div class="hero-stats">
          <article class="metric metric-total">
            <div class="metric-label">Propietarios</div>
            <div class="metric-value">{{ estadisticas().total }}</div>
            <div class="metric-sub">Registrados en el sistema</div>
          </article>
          <article class="metric metric-green">
            <div class="metric-label">Al día</div>
            <div class="metric-value">{{ estadisticas().alDia }}</div>
            <div class="metric-sub">Sin cartera pendiente</div>
          </article>
          <article class="metric metric-amber">
            <div class="metric-label">Pendientes</div>
            <div class="metric-value">{{ estadisticas().pendientes }}</div>
            <div class="metric-sub">Con pagos por resolver</div>
          </article>
          <article class="metric metric-red">
            <div class="metric-label">Vencidos</div>
            <div class="metric-value">{{ estadisticas().vencidos }}</div>
            <div class="metric-sub">Requieren revisión inmediata</div>
          </article>
        </div>
      </section>

      <section class="toolbar">
        <div class="searchbox">
          <span>🔎</span>
          <input
            [(ngModel)]="busqueda"
            type="text"
            placeholder="Buscar por nombre, identificación, edificio o apartamento..."
          />
        </div>

        <select [(ngModel)]="filtroEdificio" class="filter">
          <option value="todos">Todos los edificios</option>
          @for (edificio of edificios(); track edificio) {
            <option [value]="edificio">{{ edificio }}</option>
          }
        </select>

        <select [(ngModel)]="filtroEstado" class="filter">
          <option value="todos">Todos los estados</option>
          <option value="al-dia">Al día</option>
          <option value="pendiente">Pendiente</option>
          <option value="vencido">Vencido</option>
          <option value="sin-pagos">Sin pagos</option>
        </select>

        <span class="count">{{ residentesFiltrados().length }} registros</span>
      </section>

      @if (cargando()) {
        <section class="loading">
          <div class="spinner"></div>
          <p>Cargando propietarios, apartamentos y cartera...</p>
        </section>
      } @else if (residentesFiltrados().length === 0) {
        <section class="empty-state">
          <div class="empty-icon">🏠</div>
          <div class="empty-title">No hay residentes para mostrar</div>
          <div class="empty-desc">Prueba cambiar filtros o carga más datos desde el backend.</div>
        </section>
      } @else {
        <section class="content-grid">
          <div class="main-panel">
            @if (vista() === 'cards') {
              <div class="resident-grid">
                @for (residente of residentesFiltrados(); track residente.identificacion) {
                  <article
                    class="resident-card"
                    [class.active]="selectedId() === residente.identificacion"
                    (click)="seleccionar(residente.identificacion)"
                  >
                    <div class="avatar">{{ residente.iniciales }}</div>
                    <div class="resident-main">
                      <div class="resident-top">
                        <div>
                          <div class="resident-name">{{ residente.nombreCompleto }}</div>
                          <div class="resident-id">{{ residente.identificacion }}</div>
                        </div>
                        <span class="status-badge" [class]="badgeClass(residente.estadoGeneral)">
                          {{ residente.estadoGeneral }}
                        </span>
                      </div>

                      <div class="resident-meta">
                        {{ residente.edificioNombre }} · Apto {{ residente.apartamento }} · P{{ residente.piso }}
                      </div>

                      <div class="resident-contact">
                        <span>📧 {{ residente.correo || 'Sin correo' }}</span>
                        <span>📱 {{ residente.celular || 'Sin celular' }}</span>
                      </div>

                      <div class="resident-chips">
                        <span class="chip chip-green">Pagados {{ residente.pagosPagados }}</span>
                        <span class="chip chip-amber">Pendientes {{ residente.pagosPendientes }}</span>
                        <span class="chip chip-red">Vencidos {{ residente.pagosVencidos }}</span>
                      </div>

                      <div class="resident-footer">
                        <div>
                          <div class="footer-label">Saldo pendiente</div>
                          <div class="footer-value">{{ paySvc.formatCurrency(residente.valorPendiente) }}</div>
                        </div>
                        <button class="btn btn-mini btn-ghost" type="button" (click)="copiarContacto(residente, $event)">Copiar contacto</button>
                      </div>
                    </div>
                  </article>
                }
              </div>
            } @else {
              <div class="table-wrap">
                <table class="tabla">
                  <thead>
                    <tr>
                      <th>Residente</th>
                      <th>Apartamento</th>
                      <th>Estado</th>
                      <th>Pagados</th>
                      <th>Pendientes</th>
                      <th>Vencidos</th>
                      <th>Saldo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (residente of residentesFiltrados(); track residente.identificacion) {
                      <tr (click)="seleccionar(residente.identificacion)" [class.row-active]="selectedId() === residente.identificacion">
                        <td>
                          <div class="row-main">
                            <strong>{{ residente.nombreCompleto }}</strong>
                            <span>{{ residente.identificacion }}</span>
                          </div>
                        </td>
                        <td>
                          <div class="row-main">
                            <strong>Apto {{ residente.apartamento }}</strong>
                            <span>{{ residente.edificioNombre }} · P{{ residente.piso }}</span>
                          </div>
                        </td>
                        <td><span class="status-badge" [class]="badgeClass(residente.estadoGeneral)">{{ residente.estadoGeneral }}</span></td>
                        <td>{{ residente.pagosPagados }}</td>
                        <td>{{ residente.pagosPendientes }}</td>
                        <td>{{ residente.pagosVencidos }}</td>
                        <td>{{ paySvc.formatCurrency(residente.valorPendiente) }}</td>
                        <td>
                          <div class="actions">
                            <button class="btn btn-mini btn-ghost" type="button" (click)="copiarContacto(residente, $event)">Copiar</button>
                            <button class="btn btn-mini btn-soft" type="button" (click)="seleccionar(residente.identificacion)">Ver detalle</button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <aside class="detail-panel">
            @if (residenteSeleccionado(); as residente) {
              <div class="detail-head">
                <div class="detail-avatar">{{ residente.iniciales }}</div>
                <div>
                  <div class="detail-kicker">Propietario seleccionado</div>
                  <h3>{{ residente.nombreCompleto }}</h3>
                  <div class="detail-sub">{{ residente.edificioNombre }} · Apto {{ residente.apartamento }} · P{{ residente.piso }}</div>
                </div>
              </div>

              <div class="detail-grid">
                <div class="detail-box">
                  <span>Correo</span>
                  <strong>{{ residente.correo || 'No registrado' }}</strong>
                </div>
                <div class="detail-box">
                  <span>Celular</span>
                  <strong>{{ residente.celular || 'No registrado' }}</strong>
                </div>
                <div class="detail-box">
                  <span>Pagos totales</span>
                  <strong>{{ residente.pagosTotal }}</strong>
                </div>
                <div class="detail-box">
                  <span>Saldo pendiente</span>
                  <strong>{{ paySvc.formatCurrency(residente.valorPendiente) }}</strong>
                </div>
              </div>

              <div class="detail-actions">
                <button class="btn btn-primary" type="button" (click)="irAPagos()">Abrir cartera</button>
                <button class="btn btn-soft" type="button" (click)="copiarContacto(residente)">Copiar contacto</button>
              </div>

              <div class="detail-section">
                <div class="section-caption">Resumen de pagos</div>
                <div class="progress-list">
                  <div class="progress-row">
                    <div class="progress-top"><span>Pagados</span><strong>{{ residente.pagosPagados }}</strong></div>
                    <div class="progress-bar"><span class="fill-green" [style.width.%]="porcentaje(residente.pagosPagados, residente.pagosTotal)"></span></div>
                  </div>
                  <div class="progress-row">
                    <div class="progress-top"><span>Pendientes</span><strong>{{ residente.pagosPendientes }}</strong></div>
                    <div class="progress-bar"><span class="fill-amber" [style.width.%]="porcentaje(residente.pagosPendientes, residente.pagosTotal)"></span></div>
                  </div>
                  <div class="progress-row">
                    <div class="progress-top"><span>Vencidos</span><strong>{{ residente.pagosVencidos }}</strong></div>
                    <div class="progress-bar"><span class="fill-red" [style.width.%]="porcentaje(residente.pagosVencidos, residente.pagosTotal)"></span></div>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <div class="section-caption">Pagos recientes</div>
                @if (residente.pagosRecientes.length) {
                  <div class="recent-list">
                    @for (pago of residente.pagosRecientes; track pago.id_pago) {
                      <article class="recent-item">
                        <div class="recent-top">
                          <strong>{{ pago.tipo_pago_nombre ?? 'Pago #' + pago.id_pago }}</strong>
                          <span class="status-badge" [class]="badgeClass(pago.estado_pago_nombre ?? '')">{{ pago.estado_pago_nombre ?? 'Sin estado' }}</span>
                        </div>
                        <div class="recent-desc">{{ pago.descripcion }}</div>
                        <div class="recent-foot">
                          <span>Vence {{ pago.fecha_limite }}</span>
                          <strong>{{ paySvc.formatCurrency(pago.valor) }}</strong>
                        </div>
                      </article>
                    }
                  </div>
                } @else {
                  <div class="empty-inline">Este residente todavía no tiene pagos asociados.</div>
                }
              </div>
            }
          </aside>
        </section>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    * {
      box-sizing: border-box;
    }

    .page {
      display: grid;
      gap: 16px;
      color: #0f172a;
    }

    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(340px, 0.9fr);
      gap: 18px;
      padding: 22px;
      border-radius: 22px;
      background:
        radial-gradient(circle at top right, rgba(201, 168, 76, 0.12), transparent 24%),
        linear-gradient(135deg, #0a2f20 0%, #0f4a33 100%);
      color: #fff;
      box-shadow: 0 18px 46px rgba(10, 47, 32, 0.16);
    }

    .kicker {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: rgba(255, 255, 255, 0.68);
      font-weight: 800;
    }

    .hero-copy h2 {
      margin: 8px 0 10px;
      font-size: clamp(24px, 3vw, 38px);
      line-height: 1.05;
      letter-spacing: -0.03em;
    }

    .hero-copy p {
      margin: 0;
      max-width: 58ch;
      color: rgba(255, 255, 255, 0.78);
      line-height: 1.65;
      font-size: 14px;
    }

    .hero-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 18px;
    }

    .hero-stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      align-content: start;
    }

    .metric {
      border-radius: 16px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.09);
      border: 1px solid rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(10px);
    }

    .metric-total {
      background: rgba(255, 255, 255, 0.12);
    }

    .metric-green {
      background: rgba(34, 197, 94, 0.14);
      border-color: rgba(34, 197, 94, 0.22);
    }

    .metric-amber {
      background: rgba(251, 191, 36, 0.15);
      border-color: rgba(251, 191, 36, 0.22);
    }

    .metric-red {
      background: rgba(239, 68, 68, 0.16);
      border-color: rgba(239, 68, 68, 0.22);
    }

    .metric-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255, 255, 255, 0.68);
      font-weight: 700;
    }

    .metric-value {
      margin-top: 8px;
      font-size: 30px;
      font-weight: 900;
      line-height: 1;
    }

    .metric-sub {
      margin-top: 5px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.74);
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(15, 74, 51, 0.08);
      border-radius: 14px;
      padding: 12px 14px;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
    }

    .searchbox {
      flex: 1;
      min-width: 240px;
      display: flex;
      align-items: center;
      gap: 10px;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      padding: 10px 14px;
      background: #fff;
    }

    .searchbox input,
    .filter {
      width: 100%;
      border: 0;
      outline: none;
      background: transparent;
      color: #111827;
      font: inherit;
    }

    .filter {
      min-width: 180px;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      padding: 10px 14px;
      background: #fff;
      flex: 0 0 auto;
    }

    .count {
      font-size: 12px;
      color: #6b7280;
      white-space: nowrap;
      font-weight: 700;
    }

    .content-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.45fr) minmax(340px, 0.85fr);
      gap: 16px;
      align-items: start;
    }

    .main-panel,
    .detail-panel {
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(15, 74, 51, 0.08);
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
      overflow: hidden;
    }

    .main-panel {
      padding: 14px;
    }

    .resident-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .resident-card {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 14px;
      padding: 16px;
      border-radius: 18px;
      border: 1px solid #e5e7eb;
      background: linear-gradient(180deg, #ffffff, #f9fbf9);
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    }

    .resident-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
      border-color: rgba(15, 74, 51, 0.22);
    }

    .resident-card.active {
      border-color: rgba(201, 168, 76, 0.5);
      box-shadow: 0 16px 34px rgba(201, 168, 76, 0.12);
    }

    .avatar,
    .detail-avatar {
      width: 56px;
      height: 56px;
      border-radius: 18px;
      display: grid;
      place-items: center;
      font-weight: 900;
      color: #0a2f20;
      background: linear-gradient(135deg, #f5e3a4, #c9a84c);
      box-shadow: 0 10px 24px rgba(201, 168, 76, 0.25);
      flex-shrink: 0;
    }

    .resident-main {
      display: grid;
      gap: 10px;
      min-width: 0;
    }

    .resident-top,
    .detail-head,
    .recent-top,
    .recent-foot {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
    }

    .resident-name {
      font-size: 15px;
      font-weight: 900;
      color: #111827;
    }

    .resident-id,
    .resident-meta,
    .resident-contact,
    .footer-label,
    .section-caption,
    .detail-kicker,
    .detail-sub,
    .recent-desc,
    .empty-inline {
      color: #64748b;
      font-size: 12px;
    }

    .resident-meta {
      font-size: 13px;
      color: #0f4a33;
      font-weight: 700;
    }

    .resident-contact {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      color: #475569;
    }

    .resident-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 800;
    }

    .chip-green {
      background: #dcfce7;
      color: #166534;
    }

    .chip-amber {
      background: #fef9c3;
      color: #854d0e;
    }

    .chip-red {
      background: #fee2e2;
      color: #991b1b;
    }

    .resident-footer {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 2px;
    }

    .footer-value {
      font-size: 18px;
      font-weight: 900;
      color: #0f4a33;
    }

    .detail-panel {
      padding: 18px;
      display: grid;
      gap: 14px;
      position: sticky;
      top: 96px;
    }

    .detail-avatar {
      width: 72px;
      height: 72px;
      border-radius: 22px;
    }

    .detail-head h3 {
      margin: 3px 0 6px;
      font-size: 20px;
      color: #0f172a;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .detail-box {
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      background: #f9fbf9;
      padding: 12px;
      display: grid;
      gap: 6px;
    }

    .detail-box span {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      font-weight: 700;
    }

    .detail-box strong {
      font-size: 13px;
      color: #111827;
      line-height: 1.45;
    }

    .detail-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .detail-section {
      display: grid;
      gap: 10px;
    }

    .section-caption {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #c9a84c;
      font-weight: 900;
    }

    .progress-list {
      display: grid;
      gap: 10px;
    }

    .progress-row {
      display: grid;
      gap: 7px;
    }

    .progress-top {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      font-size: 12px;
      color: #334155;
      font-weight: 700;
    }

    .progress-bar {
      height: 10px;
      border-radius: 999px;
      background: #e5e7eb;
      overflow: hidden;
    }

    .progress-bar span {
      display: block;
      height: 100%;
      border-radius: 999px;
    }

    .fill-green { background: linear-gradient(90deg, #22c55e, #16a34a); }
    .fill-amber { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .fill-red { background: linear-gradient(90deg, #ef4444, #b91c1c); }

    .recent-list {
      display: grid;
      gap: 10px;
    }

    .recent-item {
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      background: #fff;
      padding: 12px;
      display: grid;
      gap: 8px;
    }

    .recent-top strong {
      color: #111827;
      font-size: 13px;
    }

    .recent-foot {
      font-size: 12px;
      color: #64748b;
      align-items: center;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 800;
      white-space: nowrap;
    }

    .badge-green { background: #dcfce7; color: #166534; }
    .badge-amber { background: #fef9c3; color: #854d0e; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-blue { background: #dbeafe; color: #1e40af; }

    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .table-wrap {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      overflow: auto;
    }

    .tabla {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .tabla th {
      background: #f9fafb;
      padding: 12px 14px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
    }

    .tabla td {
      padding: 12px 14px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: middle;
    }

    .tabla tr:last-child td {
      border-bottom: none;
    }

    .tabla tr:hover td,
    .tabla tr.row-active td {
      background: #f9fafb;
    }

    .row-main {
      display: grid;
      gap: 2px;
    }

    .loading,
    .empty-state {
      min-height: 280px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(15, 74, 51, 0.08);
      display: grid;
      place-items: center;
      gap: 12px;
      padding: 28px;
      text-align: center;
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
    }

    .loading p,
    .empty-desc,
    .empty-inline {
      margin: 0;
      color: #64748b;
      line-height: 1.6;
    }

    .empty-title {
      font-size: 18px;
      font-weight: 800;
      color: #111827;
    }

    .empty-icon {
      font-size: 48px;
    }

    .spinner {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: 3px solid #e5e7eb;
      border-top-color: #0f4a33;
      animation: spin 0.8s linear infinite;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid transparent;
      transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      text-decoration: none;
    }

    .btn:hover {
      transform: translateY(-1px);
    }

    .btn-primary {
      background: linear-gradient(135deg, #0a2f20, #0f4a33);
      color: #fff;
      box-shadow: 0 12px 24px rgba(15, 74, 51, 0.18);
    }

    .btn-ghost {
      background: #fff;
      color: #374151;
      border-color: #d1d5db;
    }

    .btn-soft {
      background: rgba(15, 74, 51, 0.08);
      color: #0f4a33;
      border-color: rgba(15, 74, 51, 0.12);
    }

    .btn-mini {
      padding: 8px 12px;
      font-size: 12px;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 1180px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      .detail-panel {
        position: static;
      }
    }

    @media (max-width: 960px) {
      .hero {
        grid-template-columns: 1fr;
      }

      .resident-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .hero,
      .main-panel,
      .detail-panel,
      .toolbar {
        padding: 14px;
      }

      .hero-stats,
      .detail-grid {
        grid-template-columns: 1fr;
      }

      .toolbar {
        gap: 10px;
      }

      .filter {
        width: 100%;
      }

      .searchbox {
        min-width: 0;
      }

      .resident-card {
        grid-template-columns: 1fr;
      }

      .resident-top,
      .detail-head,
      .recent-top,
      .recent-foot {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `]
})
export class ResidentesComponent implements OnInit {
  private usuariosSvc = inject(UsuariosService);
  private propiedadesSvc = inject(PropiedadesService);
  paySvc = inject(PaymentService);
  private toast = inject(ToastService);
  private router = inject(Router);

  cargando = signal(true);
  demoMode = signal(false);
  busqueda = signal('');
  filtroEdificio = signal('todos');
  filtroEstado = signal('todos');
  vista = signal<'cards' | 'table'>('cards');
  selectedId = signal<string | null>(null);

  private readonly demoUsuarios: Usuario[] = [
    {
      identificacion: '9001002001',
      id_tipo_documento: 1,
      correo: 'ana.gomez@correo.com',
      celular: '3001112233',
      primer_nombre: 'Ana',
      segundo_nombre: 'María',
      primer_apellido: 'Gómez',
      segundo_apellido: 'Ríos',
      perfil: 2,
      perfil_nombre: 'Propietario',
    },
    {
      identificacion: '9001002002',
      id_tipo_documento: 1,
      correo: 'carlos.perez@correo.com',
      celular: '3002223344',
      primer_nombre: 'Carlos',
      segundo_nombre: '',
      primer_apellido: 'Pérez',
      segundo_apellido: 'Luna',
      perfil: 2,
      perfil_nombre: 'Propietario',
    },
    {
      identificacion: '9001002003',
      id_tipo_documento: 1,
      correo: 'laura.fernandez@correo.com',
      celular: '3003334455',
      primer_nombre: 'Laura',
      segundo_nombre: 'Sofía',
      primer_apellido: 'Fernández',
      segundo_apellido: '',
      perfil: 2,
      perfil_nombre: 'Propietario',
    },
  ];

  private readonly demoPropietarios: Propietario[] = [
    {
      identificacion: '9001002001',
      nombre_usuario: 'Ana María Gómez Ríos',
      apartamento: 101,
      piso: 1,
      edificio: 'Torre A',
      edificio_nombre: 'Torre A',
    },
    {
      identificacion: '9001002002',
      nombre_usuario: 'Carlos Pérez Luna',
      apartamento: 305,
      piso: 3,
      edificio: 'Torre B',
      edificio_nombre: 'Torre B',
    },
    {
      identificacion: '9001002003',
      nombre_usuario: 'Laura Fernández',
      apartamento: 412,
      piso: 4,
      edificio: 'Torre A',
      edificio_nombre: 'Torre A',
    },
  ];

  private readonly demoPagos: Pago[] = [
    {
      id_pago: 1,
      fecha_pago: '2026-05-02',
      fecha_limite: '2026-05-10',
      valor: 320000,
      descripcion: 'Administración mayo 2026',
      estado_pago: 1,
      estado_pago_nombre: 'Pagado',
      tipo_pago: 1,
      tipo_pago_nombre: 'Administración',
      apartamento: 101,
      piso: 1,
      edificio: 'Torre A',
      edificio_nombre: 'Torre A',
    },
    {
      id_pago: 2,
      fecha_pago: '2026-05-12',
      fecha_limite: '2026-05-12',
      valor: 180000,
      descripcion: 'Multa por ruido',
      estado_pago: 2,
      estado_pago_nombre: 'Pendiente',
      tipo_pago: 2,
      tipo_pago_nombre: 'Multa',
      apartamento: 101,
      piso: 1,
      edificio: 'Torre A',
      edificio_nombre: 'Torre A',
    },
    {
      id_pago: 3,
      fecha_pago: '2026-04-28',
      fecha_limite: '2026-04-28',
      valor: 320000,
      descripcion: 'Administración abril 2026',
      estado_pago: 3,
      estado_pago_nombre: 'Vencido',
      tipo_pago: 1,
      tipo_pago_nombre: 'Administración',
      apartamento: 305,
      piso: 3,
      edificio: 'Torre B',
      edificio_nombre: 'Torre B',
    },
    {
      id_pago: 4,
      fecha_pago: '2026-05-05',
      fecha_limite: '2026-05-08',
      valor: 320000,
      descripcion: 'Administración mayo 2026',
      estado_pago: 1,
      estado_pago_nombre: 'Pagado',
      tipo_pago: 1,
      tipo_pago_nombre: 'Administración',
      apartamento: 412,
      piso: 4,
      edificio: 'Torre A',
      edificio_nombre: 'Torre A',
    },
  ];

  private readonly demoUsuariosBase = computed(() => this.demoMode() ? this.demoUsuarios : this.usuariosSvc.usuarios());
  private readonly demoPropietariosBase = computed(() => this.demoMode() ? this.demoPropietarios : this.propiedadesSvc.propietarios());
  private readonly demoPagosBase = computed(() => this.demoMode() ? this.demoPagos : this.paySvc.pagos());

  residentes = computed<ResidenteView[]>(() => {
    const usuarios = this.demoUsuariosBase();
    const propietarios = this.demoPropietariosBase();
    const pagos = this.demoPagosBase();

    return propietarios.map((propietario) => {
      const usuario = usuarios.find((item) => item.identificacion === propietario.identificacion);
      const pagosDelResidente = pagos.filter((pago) =>
        pago.apartamento === propietario.apartamento &&
        pago.piso === propietario.piso &&
        pago.edificio === propietario.edificio
      ).sort((a, b) => {
        const fechaA = new Date(a.fecha_limite).getTime() || 0;
        const fechaB = new Date(b.fecha_limite).getTime() || 0;
        return fechaB - fechaA || b.id_pago - a.id_pago;
      });

      const pagosPagados = pagosDelResidente.filter((pago) => pago.estado_pago_nombre === 'Pagado').length;
      const pagosPendientes = pagosDelResidente.filter((pago) => pago.estado_pago_nombre === 'Pendiente').length;
      const pagosVencidos = pagosDelResidente.filter((pago) => pago.estado_pago_nombre === 'Vencido').length;
      const valorTotal = pagosDelResidente.reduce((total, pago) => total + Number(pago.valor || 0), 0);
      const valorPendiente = pagosDelResidente
        .filter((pago) => pago.estado_pago_nombre !== 'Pagado')
        .reduce((total, pago) => total + Number(pago.valor || 0), 0);

      const estadoGeneral: ResidenteView['estadoGeneral'] = pagosDelResidente.length === 0
        ? 'Sin pagos'
        : pagosVencidos > 0
          ? 'Vencido'
          : pagosPendientes > 0
            ? 'Pendiente'
            : 'Al día';

      const nombreCompleto = this.nombreCompleto(usuario, propietario);

      return {
        identificacion: propietario.identificacion,
        nombreCompleto,
        correo: usuario?.correo ?? '',
        celular: usuario?.celular ?? '',
        apartamento: propietario.apartamento,
        piso: propietario.piso,
        edificio: propietario.edificio,
        edificioNombre: propietario.edificio_nombre ?? propietario.edificio,
        pagosTotal: pagosDelResidente.length,
        pagosPagados,
        pagosPendientes,
        pagosVencidos,
        valorTotal,
        valorPendiente,
        estadoGeneral,
        iniciales: this.iniciales(nombreCompleto, propietario.identificacion),
        ultimoVencimiento: pagosDelResidente[0]?.fecha_limite,
        pagosRecientes: pagosDelResidente.slice(0, 3),
      };
    }).sort((a, b) => {
      const ordenEstado = { 'Vencido': 0, 'Pendiente': 1, 'Sin pagos': 2, 'Al día': 3 } as const;
      return ordenEstado[a.estadoGeneral] - ordenEstado[b.estadoGeneral] || a.nombreCompleto.localeCompare(b.nombreCompleto);
    });
  });

  edificios = computed(() => {
    const items = this.residentes().map((residente) => residente.edificioNombre);
    return [...new Set(items)].filter(Boolean).sort((a, b) => a.localeCompare(b));
  });

  estadisticas = computed(() => {
    const residentes = this.residentes();
    return {
      total: residentes.length,
      alDia: residentes.filter((residente) => residente.estadoGeneral === 'Al día').length,
      pendientes: residentes.filter((residente) => residente.estadoGeneral === 'Pendiente').length,
      vencidos: residentes.filter((residente) => residente.estadoGeneral === 'Vencido').length,
      sinPagos: residentes.filter((residente) => residente.estadoGeneral === 'Sin pagos').length,
      saldoPendiente: residentes.reduce((total, residente) => total + residente.valorPendiente, 0),
    };
  });

  residentesFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const edificio = this.filtroEdificio();
    const estado = this.filtroEstado();

    return this.residentes().filter((residente) => {
      const coincideBusqueda = !q || [
        residente.nombreCompleto,
        residente.identificacion,
        residente.edificioNombre,
        `apto ${residente.apartamento}`,
        residente.correo,
        residente.celular,
      ].some((item) => item.toLowerCase().includes(q));

      const coincideEdificio = edificio === 'todos' || residente.edificioNombre === edificio;
      const coincideEstado = estado === 'todos' || (
        estado === 'al-dia' && residente.estadoGeneral === 'Al día'
      ) || (
        estado === 'pendiente' && residente.estadoGeneral === 'Pendiente'
      ) || (
        estado === 'vencido' && residente.estadoGeneral === 'Vencido'
      ) || (
        estado === 'sin-pagos' && residente.estadoGeneral === 'Sin pagos'
      );

      return coincideBusqueda && coincideEdificio && coincideEstado;
    });
  });

  residenteSeleccionado = computed(() => {
    const seleccionado = this.selectedId();
    const residentes = this.residentesFiltrados();
    return residentes.find((residente) => residente.identificacion === seleccionado) ?? residentes[0] ?? null;
  });

  ngOnInit(): void {
    forkJoin({
      usuarios: this.usuariosSvc.cargarUsuarios(),
      propietarios: this.propiedadesSvc.cargarPropietarios(),
      apartamentos: this.propiedadesSvc.cargarApartamentos(),
      pagos: this.paySvc.cargarPagos(),
    }).subscribe({
      next: () => {
        this.cargando.set(false);
        if (this.residentes().length === 0) {
          this.demoMode.set(true);
          this.toast.info('Mostrando datos de demostración del módulo de residentes.');
        }

        const primero = this.residentesFiltrados()[0];
        if (primero) {
          this.selectedId.set(primero.identificacion);
        }
      },
      error: () => {
        this.cargando.set(false);
        this.demoMode.set(true);
        this.toast.warn('Backend no disponible. Mostrando datos de demostración de residentes.');

        const primero = this.residentesFiltrados()[0] ?? this.residentes()[0];
        if (primero) {
          this.selectedId.set(primero.identificacion);
        }
      },
    });
  }

  seleccionar(identificacion: string): void {
    this.selectedId.set(identificacion);
  }

  irAPagos(): void {
    this.router.navigate(['/admin/pagos']);
  }

  copiarContacto(residente: ResidenteView, event?: Event): void {
    event?.stopPropagation();
    const texto = [
      `Nombre: ${residente.nombreCompleto}`,
      `Identificación: ${residente.identificacion}`,
      `Apto: ${residente.apartamento}`,
      `Edificio: ${residente.edificioNombre}`,
      `Correo: ${residente.correo || 'No registrado'}`,
      `Celular: ${residente.celular || 'No registrado'}`,
    ].join('\n');

    navigator.clipboard?.writeText(texto)
      .then(() => this.toast.success('Contacto copiado al portapapeles.'))
      .catch(() => this.toast.warn('No se pudo copiar el contacto.'));
  }

  porcentaje(parte: number, total: number): number {
    if (!total) return 0;
    return Math.max(6, Math.round((parte / total) * 100));
  }

  badgeClass(estado: string): string {
    return {
      'Al día': 'badge-green',
      'Pendiente': 'badge-amber',
      'Vencido': 'badge-red',
      'Sin pagos': 'badge-blue',
      'Pagado': 'badge-green',
    }[estado] ?? 'badge-blue';
  }

  private nombreCompleto(usuario: Usuario | undefined, propietario: Propietario): string {
    const nombres = [usuario?.primer_nombre, usuario?.segundo_nombre, usuario?.primer_apellido, usuario?.segundo_apellido]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (nombres) return nombres;
    if (propietario.nombre_usuario) return propietario.nombre_usuario;
    return propietario.identificacion;
  }

  private iniciales(nombre: string, fallback: string): string {
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    if (partes.length === 1) {
      return partes[0].slice(0, 2).toUpperCase();
    }
    return fallback.slice(-2).toUpperCase();
  }
}
