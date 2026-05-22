//layout.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { PropiedadesService } from '../../../core/services/propiedades.service';
import { PaymentService } from '../../../core/services/payment.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { SeguridadService } from '../../../core/services/seguridad.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="shell">
      <aside class="sidebar" [class.collapsed]="collapsed()">
        <div class="sidebar-top">
          <div class="brand">
            <img class="brand-logo" src="/assets/fyl.png" alt="F&L Aliados con Propiedad" />
            @if (!collapsed()) {
              <div class="brand-copy">
                <span class="brand-name">F&L</span>
                <span class="brand-sub">Aliados con Propiedad</span>
              </div>
            }
          </div>
          <button class="collapse-btn" (click)="collapsed.set(!collapsed())">
            {{ collapsed() ? '→' : '←' }}
          </button>
        </div>

        <nav class="sidebar-nav">
          <a class="nav-item" routerLink="/admin/dashboard" routerLinkActive="active">
            <span class="nav-icon">📊</span>
            @if (!collapsed()) { <span class="nav-label">Dashboard</span> }
          </a>
          <a class="nav-item" routerLink="/admin/residentes" routerLinkActive="active">
            <span class="nav-icon">🏘️</span>
            @if (!collapsed()) { <span class="nav-label">Residentes</span> }
          </a>

          @for (item of menuItems(); track item.formulario) {
            <a class="nav-item" [routerLink]="item.redirect" routerLinkActive="active" [title]="item.formulario">
              <span class="nav-icon">{{ iconoParaFormulario(item.formulario) }}</span>
              @if (!collapsed()) {
                <span class="nav-label">{{ labelParaFormulario(item.formulario) }}</span>
              }
            </a>
          }
        </nav>
        
        <div class="sidebar-bottom">
          <button class="logout-btn" (click)="logout()">
            <span>🚪</span>
            @if (!collapsed()) { <span>Cerrar sesión</span> }
          </button>
        </div>
      </aside>

      <div class="main-wrap">
        <header class="topbar">
          <div class="topbar-left">
            <div class="topbar-copy">
              <span class="page-title">{{ paginaActual() }}</span>
              <span class="page-subtitle">Administración central de la copropiedad</span>
            </div>
          </div>
          <div class="topbar-right">
            @if (cargando()) {
              <span class="loading-pill">⏳ Cargando datos...</span>
            }
            <span class="user-pill">👤 Admin</span>
          </div>
        </header>

        <main class="main-content">
          <div class="content-shell">
            @if (!cargando()) {
              <router-outlet />
            } @else {
              <div class="loading-screen">
                <div class="loading-card">
                  <div class="loading-spinner"></div>
                  <p>Cargando información del sistema...</p>
                </div>
              </div>
            }
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .shell {
      display: grid;
      grid-template-columns: auto 1fr;
      min-height: 100vh;
      background:
        radial-gradient(circle at top right, rgba(201,168,76,0.08), transparent 24%),
        linear-gradient(180deg, #eef2ef 0%, #f5f7f4 100%);
    }

    .sidebar {
      width: 236px;
      background: linear-gradient(180deg, rgba(10,47,32,0.98) 0%, rgba(8,36,25,0.98) 100%);
      color: #fff;
      display: flex;
      flex-direction: column;
      transition: width 0.2s ease;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: hidden;
      box-shadow: 12px 0 30px rgba(10,47,32,0.12);
    }
    .sidebar.collapsed { width: 72px; }

    .sidebar-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      min-height: 76px;
    }

    .brand { display: flex; align-items: center; gap: 12px; overflow: hidden; }
    .brand-logo {
      width: 42px;
      height: 42px;
      object-fit: contain;
      border-radius: 12px;
      background: rgba(255,255,255,0.06);
      padding: 4px;
      flex-shrink: 0;
    }
    .brand-copy { display: grid; gap: 2px; min-width: 0; }
    .brand-name {
      font-size: 16px;
      font-weight: 900;
      color: #fff;
      white-space: nowrap;
      letter-spacing: 0.02em;
    }
    .brand-sub {
      font-size: 10px;
      color: rgba(255,255,255,0.58);
      white-space: nowrap;
    }

    .collapse-btn {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      color: #fff;
      border-radius: 10px;
      width: 30px;
      height: 30px;
      cursor: pointer;
      font-size: 12px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .collapse-btn:hover { background: rgba(255,255,255,0.2); }

    .sidebar-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 14px 10px;
      gap: 6px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 14px;
      color: rgba(255,255,255,0.74);
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      transition: transform 0.15s, background 0.15s, color 0.15s;
      white-space: nowrap;
      overflow: hidden;
      border-radius: 12px;
    }
    .nav-item:hover {
      background: rgba(255,255,255,0.08);
      color: #fff;
      transform: translateX(2px);
    }
    .nav-item.active {
      background: linear-gradient(90deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08));
      color: #f1d88a;
      border: 1px solid rgba(201,168,76,0.22);
    }
    .nav-icon {
      font-size: 16px;
      width: 22px;
      text-align: center;
      flex-shrink: 0;
    }
    .nav-label { overflow: hidden; text-overflow: ellipsis; }

    .sidebar-bottom {
      padding: 12px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .logout-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.14);
      color: rgba(255,255,255,0.86);
      border-radius: 10px;
      padding: 10px 12px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
    }
    .logout-btn:hover { background: rgba(220,38,38,0.3); color: #fff; }

    .main-wrap {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      overflow: hidden;
      background:
        radial-gradient(circle at top left, rgba(201,168,76,0.05), transparent 28%),
        linear-gradient(180deg, rgba(245,247,244,0.98), rgba(238,242,239,0.98));
    }

    .topbar {
      background: rgba(255,255,255,0.72);
      backdrop-filter: blur(18px);
      border-bottom: 1px solid rgba(15,74,51,0.08);
      padding: 0 24px;
      min-height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: 0 10px 30px rgba(15,23,42,0.04);
    }
    .topbar-left { min-width: 0; }
    .topbar-copy { display: grid; gap: 2px; }
    .page-title { font-size: 16px; font-weight: 900; color: #0f172a; }
    .page-subtitle { font-size: 12px; color: #64748b; }
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .user-pill {
      background: linear-gradient(180deg, #ffffff, #f5f7f5);
      border: 1px solid rgba(15,74,51,0.12);
      border-radius: 999px;
      padding: 7px 14px;
      font-size: 12px;
      font-weight: 700;
      color: #374151;
      box-shadow: 0 8px 20px rgba(15,74,51,0.06);
    }
    .loading-pill {
      background: #fef9c3;
      border: 1px solid #fcd34d;
      border-radius: 999px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 600;
      color: #854d0e;
    }

    .main-content {
      flex: 1;
      padding: 22px;
      overflow-y: auto;
    }
    .content-shell {
      min-height: calc(100vh - 120px);
      width: min(100%, 1680px);
      margin: 0 auto;
    }

    .loading-screen {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 180px);
    }
    .loading-card {
      background: rgba(255,255,255,0.78);
      border: 1px solid rgba(15,74,51,0.08);
      border-radius: 20px;
      min-width: 260px;
      min-height: 160px;
      display: grid;
      place-items: center;
      gap: 14px;
      box-shadow: 0 18px 50px rgba(15,23,42,0.08);
    }
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #0f4a33;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) {
      .topbar { padding: 0 18px; }
      .main-content { padding: 18px; }
    }

    @media (max-width: 768px) {
      .sidebar { width: 72px; }
      .topbar { padding: 12px 16px; min-height: auto; gap: 10px; align-items: flex-start; }
      .main-content { padding: 16px; }
      .page-subtitle { display: none; }
      .content-shell { min-height: calc(100vh - 96px); }
      .loading-screen { min-height: calc(100vh - 140px); }
    }
  `]
})
export class LayoutComponent implements OnInit {
  private authSvc  = inject(AuthService);
  private propSvc  = inject(PropiedadesService);
  private paySvc   = inject(PaymentService);
  private usuSvc   = inject(UsuariosService);
  private router   = inject(Router);
  private notifSvc = inject(NotificacionesService);
  private segSvc   = inject(SeguridadService);

  menuItems = this.authSvc.menuItems;
  collapsed = signal(false);
  cargando  = signal(true);

  ngOnInit(): void {
    forkJoin({
      edificios:         this.propSvc.cargarEdificios(),
      pisos:             this.propSvc.cargarPisos(),
      apartamentos:      this.propSvc.cargarApartamentos(),
      propietarios:      this.propSvc.cargarPropietarios(),
      tipos:             this.paySvc.cargarTipos(),
      estados:           this.paySvc.cargarEstados(),
      usuarios:          this.usuSvc.cargarUsuarios(),
      tiposNotificacion: this.notifSvc.cargarTipos(),
      notificaciones:    this.notifSvc.cargarNotificaciones(),
      roles:             this.segSvc.cargarRoles(),
      perfiles:          this.segSvc.cargarPerfiles(),
      formularios:       this.segSvc.cargarFormularios(),
      permisos:          this.segSvc.cargarPermisos(),
    }).subscribe({
      next:  () => this.cargando.set(false),
      error: () => this.cargando.set(false)
    });
  }

  paginaActual(): string {
    const url = this.router.url;
    const segmento = url.split('/').pop() ?? '';
    return this.labelParaFormulario(segmento.toUpperCase());
  }

  iconoParaFormulario(formulario: string): string {
    const iconos: Record<string, string> = {
      'USUARIOS': '👥', 'ROLES': '🛡️', 'PERFILES': '🎭',
      'FORMULARIOS': '📋', 'PERMISOS': '🔐', 'EDIFICIOS': '🏢',
      'PISOS': '🏬', 'APARTAMENTOS': '🏠', 'PROPIETARIOS': '👤',
      'PAGOS': '💰', 'NOTIFICACIONES': '🔔',
      'TIPOS_PAGOS': '🏷️', 'ESTADOS_PAGOS': '📊',
    };
    return iconos[formulario] ?? '📄';
  }

  labelParaFormulario(formulario: string): string {
    const labels: Record<string, string> = {
      'USUARIOS': 'Usuarios', 'ROLES': 'Roles', 'PERFILES': 'Perfiles',
      'FORMULARIOS': 'Formularios', 'PERMISOS': 'Permisos',
      'EDIFICIOS': 'Edificios', 'PISOS': 'Pisos',
      'APARTAMENTOS': 'Apartamentos', 'PROPIETARIOS': 'Propietarios',
      'PAGOS': 'Pagos', 'NOTIFICACIONES': 'Notificaciones',
      'TIPOS_PAGOS': 'Tipos de Pago', 'ESTADOS_PAGOS': 'Estados de Pago',
    };
    return labels[formulario] ?? formulario;
  }

  logout(): void {
    this.authSvc.logout();
  }
}