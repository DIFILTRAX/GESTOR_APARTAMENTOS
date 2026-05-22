//login.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UsuariosService } from '../../../core/services/usuarios.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="login-page">
      <div class="login-shell">
        <section class="hero-panel">
          <div class="logo-block">
            <div class="brand-pill">Portal corporativo</div>
            <img
              class="company-logo"
              src="/assets/fyl.png"
              alt="F&L Aliados con Propiedad"
            />
          </div>

          <div class="hero-copy">
            <h1>Acceso profesional para tu equipo.</h1>
            <p>Acceso seguro para la administración de copropiedad.</p>
          </div>
        </section>

        <section class="form-panel">
          <div class="form-head">
            <div class="form-badge">Acceso seguro</div>
            <h2>Iniciar sesión</h2>
            <p>Ingresa con tu identificación y contraseña para continuar.</p>
          </div>

          <form class="login-form" (ngSubmit)="submit()" novalidate>
            <div class="field">
              <label for="identificacion">Identificación</label>
              <input
                id="identificacion"
                name="identificacion"
                [(ngModel)]="identificacion"
                type="text"
                inputmode="numeric"
                autocomplete="username"
                maxlength="30"
                placeholder="Ingresa tu identificación"
                (input)="onIdentificacionInput($event)"
              />
            </div>

            <div class="field">
              <label for="contrasenna">Contraseña</label>
              <div class="inp-wrap">
                <input
                  id="contrasenna"
                  name="contrasenna"
                  [(ngModel)]="contrasenna"
                  [type]="showPass() ? 'text' : 'password'"
                  autocomplete="current-password"
                  maxlength="15"
                  placeholder="Ingresa tu contraseña"
                  (input)="onContrasennaInput($event)"
                />
                <button
                  type="button"
                  class="inp-icon clickable"
                  (click)="showPass.set(!showPass())">
                  {{ showPass() ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
            </div>

            <div class="row-between">
              <label class="remember remember-pill">
                <input type="checkbox" [(ngModel)]="recordarSesion" name="recordarSesion" />
                <span>Recordarme</span>
              </label>
              <button type="button" class="link-btn" (click)="toggleRecovery()">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <div class="row-between">
              <span class="remember">¿No tienes usuario?</span>
              <button type="button" class="link-btn" (click)="toggleRegister()">
                {{ registerOpen() ? 'Cerrar registro' : 'Crear usuario' }}
              </button>
            </div>

            @if (error()) {
              <div class="error-msg">{{ error() }}</div>
            }

            <button class="btn-login" type="submit" [disabled]="loading()">
              {{ loading() ? 'Ingresando...' : 'Ingresar al sistema' }}
            </button>

            @if (registerOpen()) {
              <div class="recovery-box">
                <div class="recovery-title">Crear usuario</div>
                <p>
                  Este registro crea un usuario propietario con acceso al portal.
                  Completa los datos básicos para continuar.
                </p>

                <div class="login-form">
                  <div class="field">
                    <label for="registro-identificacion">Identificación *</label>
                    <input
                      id="registro-identificacion"
                      name="registro-identificacion"
                      [(ngModel)]="registro.identificacion"
                      type="text"
                      inputmode="numeric"
                      autocomplete="off"
                      maxlength="30"
                      placeholder="Ingresa tu identificación"
                      (input)="onRegistroIdentificacionInput($event)"
                    />
                  </div>

                  <div class="field">
                    <label for="registro-id-tipo-documento">Tipo de documento *</label>
                    <select
                      id="registro-id-tipo-documento"
                      name="registro-id-tipo-documento"
                      [(ngModel)]="registro.id_tipo_documento">
                      <option [ngValue]="null">Seleccionar...</option>
                      <option [ngValue]="1">Cédula de Ciudadanía</option>
                      <option [ngValue]="2">Cédula de Extranjería</option>
                      <option [ngValue]="3">Pasaporte</option>
                      <option [ngValue]="4">NIT</option>
                    </select>
                  </div>

                  <div class="field">
                    <label for="registro-primer-nombre">Primer nombre *</label>
                    <input
                      id="registro-primer-nombre"
                      name="registro-primer-nombre"
                      [(ngModel)]="registro.primer_nombre"
                      type="text" autocomplete="off" maxlength="50" placeholder="Ej: Juan"
                      (input)="onRegistroNombreInput($event, 'primer_nombre')"
                    />
                  </div>

                  <div class="field">
                    <label for="registro-segundo-nombre">Segundo nombre</label>
                    <input
                      id="registro-segundo-nombre"
                      name="registro-segundo-nombre"
                      [(ngModel)]="registro.segundo_nombre"
                      type="text" autocomplete="off" maxlength="50" placeholder="Opcional"
                      (input)="onRegistroNombreInput($event, 'segundo_nombre')"
                    />
                  </div>

                  <div class="field">
                    <label for="registro-primer-apellido">Primer apellido *</label>
                    <input
                      id="registro-primer-apellido"
                      name="registro-primer-apellido"
                      [(ngModel)]="registro.primer_apellido"
                      type="text" autocomplete="off" maxlength="50" placeholder="Ej: Pérez"
                      (input)="onRegistroNombreInput($event, 'primer_apellido')"
                    />
                  </div>

                  <div class="field">
                    <label for="registro-segundo-apellido">Segundo apellido</label>
                    <input
                      id="registro-segundo-apellido"
                      name="registro-segundo-apellido"
                      [(ngModel)]="registro.segundo_apellido"
                      type="text" autocomplete="off" maxlength="50" placeholder="Opcional"
                      (input)="onRegistroNombreInput($event, 'segundo_apellido')"
                    />
                  </div>

                  <div class="field">
                    <label for="registro-correo">Correo *</label>
                    <input
                      id="registro-correo"
                      name="registro-correo"
                      [(ngModel)]="registro.correo"
                      type="email" autocomplete="off" maxlength="254"
                      placeholder="Ej: juan@correo.com"
                      (input)="onRegistroCorreoInput($event)"
                    />
                  </div>

                  <div class="field">
                    <label for="registro-celular">Celular *</label>
                    <input
                      id="registro-celular"
                      name="registro-celular"
                      [(ngModel)]="registro.celular"
                      type="text" inputmode="numeric" autocomplete="off"
                      maxlength="10" placeholder="Ej: 3001234567"
                      (input)="onRegistroCelularInput($event)"
                    />
                  </div>

                  <div class="field">
                    <label for="registro-contrasenna">Contraseña *</label>
                    <input
                      id="registro-contrasenna"
                      name="registro-contrasenna"
                      [(ngModel)]="registro.contrasenna"
                      type="password" autocomplete="new-password"
                      maxlength="15" placeholder="Mínimo 4 caracteres"
                    />
                  </div>
                </div>

                <div class="recovery-actions">
                  <button type="button" class="btn-ghost" (click)="toggleRegister()">Cerrar</button>
                  <button type="button" class="btn-secondary"
                    (click)="crearUsuario()" [disabled]="registerLoading()">
                    {{ registerLoading() ? 'Creando...' : 'Crear usuario' }}
                  </button>
                </div>

                @if (registerError()) {
                  <div class="error-msg">{{ registerError() }}</div>
                }
                @if (registerSuccess()) {
                  <div class="recovery-ok">{{ registerSuccess() }}</div>
                }
              </div>
            }

            @if (recoveryOpen()) {
              <div class="recovery-box">
                <div class="recovery-title">Recuperación de acceso</div>
                <p>
                  El sistema no tiene un envío automático de restablecimiento todavía.
                  Puedes copiar esta solicitud y enviarla al administrador:
                </p>
                <div class="recovery-message">{{ recoveryText }}</div>
                <div class="recovery-actions">
                  <button type="button" class="btn-secondary" (click)="copyRecoveryRequest()">
                    Copiar solicitud
                  </button>
                  <button type="button" class="btn-ghost" (click)="toggleRecovery()">
                    Cerrar
                  </button>
                </div>
                @if (recoveryCopied()) {
                  <div class="recovery-ok">Solicitud copiada al portapapeles.</div>
                }
              </div>
            }

            <div class="form-footer">
              FYL ALIADOS CON PROPIEDAD &copy; 2025
            </div>
          </form>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      height: 100dvh;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      background:
        radial-gradient(circle at top left, rgba(201, 168, 76, 0.18), transparent 30%),
        radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.08), transparent 28%),
        linear-gradient(135deg, #06150f 0%, #0a2a1f 46%, #123d2b 100%);
    }

    .login-shell {
      display: grid;
      grid-template-columns: minmax(0, 1.06fr) minmax(0, 0.94fr);
      max-width: 1120px;
      width: 100%;
      height: min(680px, calc(100dvh - 36px));
      border-radius: 28px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 32px 90px rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(18px);
      animation: shellEnter 700ms ease both;
    }

    .hero-panel {
      padding: 40px;
      color: #fff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 28px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.04)),
        rgba(8, 29, 21, 0.8);
      position: relative;
      animation: panelRise 700ms ease 90ms both;
    }

    .hero-panel::before {
      content: '';
      position: absolute;
      inset: 18px;
      border-radius: 22px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      pointer-events: none;
    }

    .hero-panel::after {
      content: '';
      position: absolute;
      inset: auto -90px -120px auto;
      width: 260px;
      height: 260px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(201, 168, 76, 0.22), transparent 70%);
      pointer-events: none;
      animation: glowDrift 8s ease-in-out infinite alternate;
    }

    .logo-block {
      display: grid;
      justify-items: center;
      gap: 14px;
      position: relative;
      z-index: 1;
      animation: contentFadeUp 650ms ease 140ms both;
    }

    .company-logo {
      width: min(100%, 360px);
      height: auto;
      display: block;
      object-fit: contain;
      filter: drop-shadow(0 18px 24px rgba(0, 0, 0, 0.18));
      animation: logoFloat 5s ease-in-out infinite;
    }

    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(201, 168, 76, 0.14);
      color: #f3d78b;
      border: 1px solid rgba(201, 168, 76, 0.28);
      border-radius: 999px;
      padding: 6px 14px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      width: fit-content;
      order: -1;
    }

    .hero-copy h1 {
      margin: 0 0 10px;
      font-size: clamp(26px, 3.3vw, 40px);
      line-height: 1.02;
      letter-spacing: -0.04em;
    }

    .hero-copy p {
      margin: 0;
      max-width: 34rem;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.7;
    }

    .hero-copy {
      animation: contentFadeUp 650ms ease 220ms both;
    }

    .form-panel {
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 248, 0.98));
      padding: 38px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 16px;
      color: #1f2937;
      overflow-y: auto;
      animation: panelRise 700ms ease 180ms both;
    }

    .form-head {
      display: grid;
      gap: 10px;
      margin-bottom: 4px;
    }

    .form-badge {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      border-radius: 999px;
      background: rgba(15, 74, 51, 0.09);
      color: #0f4a33;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 6px 12px;
    }

    .form-head h2 {
      margin: 0;
      font-size: 28px;
      color: #0a2f20;
      letter-spacing: -0.03em;
    }

    .form-head p {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
      line-height: 1.6;
    }

    .login-form {
      display: grid;
      gap: 14px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .field label {
      font-size: 13px;
      font-weight: 700;
      color: #374151;
    }

    .field input, .field select {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #d1d5db;
      border-radius: 14px;
      padding: 13px 14px;
      font-size: 14px;
      outline: none;
      color: #111827;
      background: #fff;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .field input:focus, .field select:focus {
      border-color: #0f4a33;
      box-shadow: 0 0 0 4px rgba(15, 74, 51, 0.12);
    }

    .inp-wrap {
      position: relative;
    }

    .inp-wrap input {
      padding-right: 74px;
    }

    .inp-icon {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      border: 0;
      background: transparent;
      padding: 8px 10px;
      font-size: 12px;
      color: #0f4a33;
    }

    .inp-icon.clickable {
      cursor: pointer;
      font-weight: 700;
    }

    .row-between {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .remember {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }

    .remember-pill {
      gap: 12px;
      padding: 10px 14px;
      border-radius: 999px;
      background: linear-gradient(180deg, rgba(15, 74, 51, 0.05), rgba(201, 168, 76, 0.06));
      border: 1px solid rgba(15, 74, 51, 0.12);
      box-shadow: 0 8px 24px rgba(15, 74, 51, 0.06);
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    }

    .remember-pill:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 28px rgba(15, 74, 51, 0.09);
      border-color: rgba(15, 74, 51, 0.2);
    }

    .remember input {
      width: 18px;
      height: 18px;
      margin: 0;
      accent-color: #0f4a33;
      cursor: pointer;
    }

    .remember span {
      line-height: 1;
      color: #0f172a;
    }

    .link-btn {
      border: 0;
      background: transparent;
      padding: 0;
      font-size: 13px;
      font-weight: 700;
      color: #0f4a33;
      cursor: pointer;
    }

    .link-btn:hover { text-decoration: underline; }

    .error-msg {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      border-radius: 14px;
      padding: 12px 14px;
      font-size: 13px;
      line-height: 1.5;
    }

    .btn-login {
      background: linear-gradient(135deg, #0a2f20, #0f4a33);
      color: #fff;
      border: none;
      border-radius: 14px;
      padding: 14px 16px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.2s ease, opacity 0.2s ease;
      box-shadow: 0 14px 30px rgba(15, 74, 51, 0.2);
    }

    .btn-login:hover:not(:disabled) { transform: translateY(-1px); }
    .btn-login:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .recovery-box {
      display: grid;
      gap: 12px;
      padding: 16px;
      border-radius: 18px;
      background: #f8fbf9;
      border: 1px solid #d7e6de;
    }

    .recovery-title {
      font-size: 14px;
      font-weight: 800;
      color: #0a2f20;
    }

    .recovery-box p {
      margin: 0;
      color: #4b5563;
      font-size: 13px;
      line-height: 1.6;
    }

    .recovery-message {
      padding: 12px 14px;
      border-radius: 14px;
      background: #fff;
      border: 1px solid #d1d5db;
      color: #111827;
      font-size: 13px;
      line-height: 1.6;
      word-break: break-word;
    }

    .recovery-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .btn-secondary, .btn-ghost {
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid transparent;
    }

    .btn-secondary { background: #0f4a33; color: #fff; }
    .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-ghost { background: transparent; color: #0f4a33; border-color: #cde0d7; }

    .recovery-ok {
      font-size: 12px;
      color: #0f4a33;
      font-weight: 700;
    }

    .form-footer {
      margin-top: 4px;
      font-size: 11px;
      color: #9ca3af;
      text-align: center;
      letter-spacing: 0.04em;
    }

    @keyframes shellEnter {
      from { opacity: 0; transform: translateY(14px) scale(0.985); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes panelRise {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes contentFadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes logoFloat {
      0%, 100% { transform: translateY(0) scale(1); }
      50%       { transform: translateY(-4px) scale(1.01); }
    }

    @keyframes glowDrift {
      from { transform: translate3d(0, 0, 0) scale(1); opacity: 0.78; }
      to   { transform: translate3d(-12px, -10px, 0) scale(1.08); opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .login-shell, .hero-panel, .logo-block,
      .hero-copy, .form-panel, .company-logo, .hero-panel::after {
        animation: none !important;
        transition: none !important;
      }
    }

    @media (max-width: 960px) {
      .login-shell {
        grid-template-columns: 1fr;
        height: auto;
        min-height: calc(100dvh - 36px);
      }
      .hero-panel { min-height: 300px; }
      .form-panel { padding: 30px 22px 32px; }
    }

    @media (max-width: 640px) {
      .login-page { padding: 12px; }
      .login-shell { border-radius: 22px; height: calc(100dvh - 24px); }
      .hero-panel, .form-panel { padding: 24px 20px; }
      .company-logo { width: min(100%, 280px); }
      .hero-copy h1 { font-size: 24px; }
    }
  `]
})
export class LoginComponent implements OnInit {
  private authSvc     = inject(AuthService);
  private usuariosSvc = inject(UsuariosService);
  private router      = inject(Router);

  private readonly rememberKey = 'fyl_login_identificacion';

  identificacion = '';
  contrasenna    = '';
  recordarSesion = false;

  showPass        = signal(false);
  loading         = signal(false);
  error           = signal('');
  recoveryOpen    = signal(false);
  recoveryCopied  = signal(false);
  registerOpen    = signal(false);
  registerLoading = signal(false);
  registerError   = signal('');
  registerSuccess = signal('');

  registro = {
    identificacion:    '',
    id_tipo_documento: null as number | null,
    primer_nombre:     '',
    segundo_nombre:    '',
    primer_apellido:   '',
    segundo_apellido:  '',
    correo:            '',
    celular:           '',
    contrasenna:       '',
  };

  ngOnInit(): void {
    try {
      const saved = localStorage.getItem(this.rememberKey);
      if (saved) {
        this.identificacion = saved;
        this.recordarSesion = true;
      }
    } catch { /* storage bloqueado */ }
  }

  get recoveryText(): string {
    const id = this.soloDigitos(this.identificacion, 30) || 'tu identificación';
    return `Hola, solicito restablecer mi contraseña para la identificación ${id}. Gracias.`;
  }

  /* ── INPUT HANDLERS ── */
  onIdentificacionInput(e: Event): void {
    const el = e.target as HTMLInputElement;
    const v  = this.soloDigitos(el.value, 30);
    el.value = v;
    this.identificacion = v;
  }

  onContrasennaInput(e: Event): void {
    const el = e.target as HTMLInputElement;
    el.value = el.value.slice(0, 15);
    this.contrasenna = el.value;
  }

  onRegistroIdentificacionInput(e: Event): void {
    const el = e.target as HTMLInputElement;
    const v  = this.soloDigitos(el.value, 30);
    el.value = v;
    this.registro.identificacion = v;
  }

  onRegistroCelularInput(e: Event): void {
    const el = e.target as HTMLInputElement;
    const v  = this.soloDigitos(el.value, 10);
    el.value = v;
    this.registro.celular = v;
  }

  onRegistroNombreInput(
    e: Event,
    field: 'primer_nombre' | 'segundo_nombre' | 'primer_apellido' | 'segundo_apellido'
  ): void {
    const el = e.target as HTMLInputElement;
    const v  = this.soloNombre(el.value, 50);
    el.value = v;
    this.registro[field] = v;
  }

  onRegistroCorreoInput(e: Event): void {
    const el = e.target as HTMLInputElement;
    const v  = el.value.trimStart().slice(0, 254);
    el.value = v;
    this.registro.correo = v;
  }

  /* ── TOGGLES ── */
  toggleRecovery(): void {
    this.recoveryOpen.update(v => !v);
    this.recoveryCopied.set(false);
    if (this.recoveryOpen()) this.registerOpen.set(false);
  }

  toggleRegister(): void {
    this.registerOpen.update(v => !v);
    this.registerError.set('');
    this.registerSuccess.set('');
    if (this.registerOpen()) this.recoveryOpen.set(false);
  }

  /* ── CREAR USUARIO ── */
  crearUsuario(): void {
    this.registerError.set('');
    this.registerSuccess.set('');

    const id        = this.soloDigitos(this.registro.identificacion, 30);
    const nombre1   = this.soloNombre(this.registro.primer_nombre, 50);
    const nombre2   = this.soloNombre(this.registro.segundo_nombre, 50);
    const apellido1 = this.soloNombre(this.registro.primer_apellido, 50);
    const apellido2 = this.soloNombre(this.registro.segundo_apellido, 50);
    const correo    = this.registro.correo.trim().slice(0, 254);
    const celular   = this.soloDigitos(this.registro.celular, 10);
    const tipoDoc   = this.registro.id_tipo_documento;

    if (!id || !tipoDoc || !nombre1 || !apellido1 || !correo || !celular || !this.registro.contrasenna) {
      this.registerError.set('Completa todos los campos obligatorios.');
      return;
    }
    if (!this.esNombreValido(nombre1) || !this.esNombreValido(apellido1)) {
      this.registerError.set('Nombre y apellido solo pueden contener letras y espacios.');
      return;
    }
    if (nombre2 && !this.esNombreValido(nombre2)) {
      this.registerError.set('El segundo nombre contiene caracteres no válidos.');
      return;
    }
    if (apellido2 && !this.esNombreValido(apellido2)) {
      this.registerError.set('El segundo apellido contiene caracteres no válidos.');
      return;
    }
    if (!this.esCorreoValido(correo)) {
      this.registerError.set('Ingresa un correo válido.');
      return;
    }
    if (!/^\d{10}$/.test(celular)) {
      this.registerError.set('El celular debe tener exactamente 10 dígitos.');
      return;
    }
    if (this.registro.contrasenna.length < 4) {
      this.registerError.set('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    this.registerLoading.set(true);

    const payload: any = {
      identificacion:    id,
      id_tipo_documento: tipoDoc,
      primer_nombre:     nombre1.trim(),
      segundo_nombre:    nombre2.trim(),
      primer_apellido:   apellido1.trim(),
      segundo_apellido:  apellido2.trim(),
      correo,
      celular,
      perfil:            2,
      contrasenna:       this.registro.contrasenna,
    };

    this.usuariosSvc.crearUsuario(payload).subscribe({
      next: () => {
        this.registerLoading.set(false);
        this.registerSuccess.set('Usuario creado correctamente. Ya puedes iniciar sesión.');
        this.identificacion = id;
        this.registro = {
          identificacion: '', id_tipo_documento: null,
          primer_nombre: '', segundo_nombre: '',
          primer_apellido: '', segundo_apellido: '',
          correo: '', celular: '', contrasenna: '',
        };
      },
      error: (err) => {
        const msg = err?.error?.correo?.[0]
          || err?.error?.identificacion?.[0]
          || 'No se pudo crear el usuario.';
        this.registerError.set(msg);
        this.registerLoading.set(false);
      }
    });
  }

  /* ── COPIAR RECUPERACIÓN ── */
  async copyRecoveryRequest(): Promise<void> {
    try {
      if (navigator?.clipboard) await navigator.clipboard.writeText(this.recoveryText);
      this.recoveryCopied.set(true);
    } catch {
      this.error.set('No se pudo copiar. Selecciónalo manualmente.');
    }
  }

  /* ── LOGIN (tu lógica original) ── */
  submit(): void {
    this.error.set('');

    if (!this.identificacion.trim() || !this.contrasenna.trim()) {
      this.error.set('Completa todos los campos.');
      return;
    }

    this.loading.set(true);
    console.log('1. Intentando login con:', this.identificacion.trim());

    this.authSvc.login({
      identificacion: this.identificacion.trim(),
      contrasenna: this.contrasenna
    }).subscribe({
      next: (res) => {
        console.log('2. Login OK, token recibido:', !!res.access);
        this.authSvc.cargarPermisos().subscribe({
          next: (permisos) => {
            console.log('3. Permisos cargados:', permisos.length);
            console.log('4. isLoggedIn:', this.authSvc.isLoggedIn());
            console.log('5. isAdmin:', this.authSvc.isAdmin());
            console.log('6. redirectPath:', this.authSvc.getRedirectPath());
            this.loading.set(false);
            this.router.navigate([this.authSvc.getRedirectPath()]);
          },
          error: (err) => {
            console.log('ERROR en permisos:', err);
            this.loading.set(false);
            this.error.set('Error al cargar permisos.');
          }
        });
      },
      error: (err) => {
        console.log('ERROR en login:', err);
        this.loading.set(false);
        this.error.set(err?.error?.error || 'Credenciales incorrectas.');
      }
    });
  }

  /* ── HELPERS ── */
  private soloDigitos(v: string, max: number): string {
    return v.replace(/\D/g, '').slice(0, max);
  }

  private soloNombre(v: string, max: number): string {
    return v
      .normalize('NFC')
      .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max);
  }

  private esNombreValido(v: string): boolean {
    return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[\s'-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(v.trim());
  }

  private esCorreoValido(v: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
}