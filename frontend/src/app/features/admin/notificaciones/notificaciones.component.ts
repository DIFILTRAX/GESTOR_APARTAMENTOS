import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { Notificacion } from '../../../core/models/models';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">

      <!-- CABECERA -->
      <section class="head">
        <div>
          <div class="kicker">Módulo de notificaciones</div>
          <h2>Notificaciones</h2>
        </div>
        <button class="btn btn-primary" (click)="abrirCrear()">+ Nueva notificación</button>
      </section>

      <!-- PANEL DE CORREOS -->
      <div class="email-panel">
        <div class="email-panel-left">
          <div class="email-icon">📧</div>
          <div>
            <div class="email-title">Recordatorio automático mensual</div>
            <div class="email-desc">
              Se envía el último día de cada mes a todos los propietarios.
              Estado actual:
              <span class="estado-badge" [class.on]="schedulerActivo()">
                {{ schedulerActivo() ? '🟢 Activo' : '🔴 Inactivo' }}
              </span>
            </div>
          </div>
        </div>
        <div class="email-panel-right">
          <button class="btn btn-enviar"
                  [disabled]="enviando()"
                  (click)="enviarRecordatorioAhora()">
            {{ enviando() ? '⏳ Enviando...' : '📨 Enviar ahora a todos' }}
          </button>
          <button class="toggle-btn"
                  [class.on]="schedulerActivo()"
                  (click)="toggleScheduler()">
            {{ schedulerActivo() ? 'Desactivar automático' : 'Activar automático' }}
          </button>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="toolbar">
        <input class="search" [(ngModel)]="busqueda"
               placeholder="Buscar por descripción o tipo..." />
        <select class="filter" [(ngModel)]="filtroTipo">
          <option value="">Todos los tipos</option>
          @for (t of svc.tiposNotificacion(); track t.id_tipo_notificacion) {
            <option [value]="t.id_tipo_notificacion">{{ t.nombre }}</option>
          }
        </select>
        <span class="count">{{ filtrados().length }} registros</span>
      </div>

      <!-- TABLA -->
      <div class="table-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Pago</th>
              <th>Valor pago</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (n of filtrados(); track n.id_notificacion) {
              <tr>
                <td class="mono">{{ n.id_notificacion }}</td>
                <td class="bold">{{ n.descripcion }}</td>
                <td>
                  <span class="badge badge-blue">
                    {{ n.tipo_notificacion_nombre ?? n.tipo_notificacion }}
                  </span>
                </td>
                <td class="mono">#{{ n.pago }}</td>
                <td>{{ n.pago_valor ? paySvc.formatCurrency(n.pago_valor) : '-' }}</td>
                <td>
                  <div class="actions">
                    <button class="btn btn-sm btn-ghost" (click)="abrirEditar(n)">Editar</button>
                    <button class="btn btn-sm btn-danger" (click)="confirmarEliminar(n)">Eliminar</button>
                  </div>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="6" class="empty">No hay notificaciones registradas.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- MODAL CREAR / EDITAR -->
      @if (modalAbierto()) {
        <div class="backdrop" (click)="cerrarModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h3>{{ modoEditar() ? 'Editar notificación' : 'Nueva notificación' }}</h3>
              <button class="close" (click)="cerrarModal()">✕</button>
            </div>
            <div class="modal-body">

              <div class="field">
                <label>Tipo de notificación *</label>
                <select [(ngModel)]="form.tipo_notificacion">
                  <option [ngValue]="undefined">Seleccionar...</option>
                  @for (t of svc.tiposNotificacion(); track t.id_tipo_notificacion) {
                    <option [value]="t.id_tipo_notificacion">{{ t.nombre }}</option>
                  }
                </select>
              </div>

              <div class="field">
                <label>Pago asociado *</label>
                <select [(ngModel)]="form.pago">
                  <option [ngValue]="undefined">Seleccionar...</option>
                  @for (p of paySvc.pagos(); track p.id_pago) {
                    <option [value]="p.id_pago">
                      #{{ p.id_pago }} — {{ p.descripcion }} — {{ paySvc.formatCurrency(p.valor) }}
                    </option>
                  }
                </select>
              </div>

              <div class="field">
                <label>Descripción *</label>
                <textarea [(ngModel)]="form.descripcion"
                          rows="3"
                          placeholder="Ej: Se notifica al propietario sobre el vencimiento del pago">
                </textarea>
              </div>

              <div class="info-box">
                <span>💡</span>
                <span>Al crear la notificación se enviará automáticamente un correo al propietario del pago seleccionado.</span>
              </div>

            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" (click)="cerrarModal()">Cancelar</button>
              <button class="btn btn-primary"
                      [disabled]="guardando()"
                      (click)="guardar()">
                {{ guardando() ? 'Enviando correo...' : (modoEditar() ? 'Guardar cambios' : 'Crear y enviar correo') }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL CONFIRMAR ELIMINAR -->
      @if (eliminarTarget()) {
        <div class="backdrop" (click)="eliminarTarget.set(null)">
          <div class="modal modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h3>Confirmar eliminación</h3>
              <button class="close" (click)="eliminarTarget.set(null)">✕</button>
            </div>
            <div class="modal-body">
              <p>¿Eliminar la notificación <strong>#{{ eliminarTarget()!.id_notificacion }}</strong>?</p>
              <p class="warn-text">Esta acción no se puede deshacer.</p>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" (click)="eliminarTarget.set(null)">Cancelar</button>
              <button class="btn btn-danger"
                      [disabled]="guardando()"
                      (click)="eliminar()">
                {{ guardando() ? 'Eliminando...' : 'Eliminar' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL RESULTADO ENVÍO MASIVO -->
      @if (resultadoEnvio()) {
        <div class="backdrop" (click)="resultadoEnvio.set(null)">
          <div class="modal modal-resultado" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h3>Resultado del envío masivo</h3>
              <button class="close" (click)="resultadoEnvio.set(null)">✕</button>
            </div>
            <div class="modal-body">
              <div class="resultado-grid">
                <div class="resultado-item resultado-green">
                  <div class="resultado-num">{{ resultadoEnvio()!.enviados }}</div>
                  <div class="resultado-lbl">✅ Enviados</div>
                </div>
                <div class="resultado-item resultado-red">
                  <div class="resultado-num">{{ resultadoEnvio()!.fallidos }}</div>
                  <div class="resultado-lbl">❌ Fallidos</div>
                </div>
              </div>
              @if (resultadoEnvio()!.errores?.length) {
                <div class="errores-box">
                  <div class="errores-title">Correos con error:</div>
                  @for (e of resultadoEnvio()!.errores; track e) {
                    <div class="error-item">{{ e }}</div>
                  }
                </div>
              }
            </div>
            <div class="modal-foot">
              <button class="btn btn-primary" (click)="resultadoEnvio.set(null)">Cerrar</button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .page { display: grid; gap: 16px; }

    /* CABECERA */
    .head {
      display: flex; justify-content: space-between; align-items: flex-end;
      flex-wrap: wrap; gap: 12px;
      background: linear-gradient(145deg, #0a2f20, #0f4a33);
      color: #fff; border-radius: 14px; padding: 18px 20px;
    }
    .kicker { font-size: 10px; text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.65); font-weight: 700; }
    .head h2 { margin: 6px 0 0; font-size: 24px; }

    /* PANEL CORREOS */
    .email-panel {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 12px;
      background: #fff; border: 1px solid #e5e7eb;
      border-radius: 12px; padding: 16px 20px;
    }
    .email-panel-left { display: flex; align-items: center; gap: 14px; }
    .email-icon { font-size: 28px; }
    .email-title { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 4px; }
    .email-desc { font-size: 13px; color: #6b7280; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .estado-badge { font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #fee2e2; color: #991b1b; }
    .estado-badge.on { background: #dcfce7; color: #166534; }
    .email-panel-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    .btn-enviar {
      background: #0f4a33; color: #fff; border: none;
      border-radius: 8px; padding: 10px 18px;
      font-size: 13px; font-weight: 700; cursor: pointer;
      transition: background .15s;
    }
    .btn-enviar:hover:not(:disabled) { background: #0a2f20; }
    .btn-enviar:disabled { opacity: .6; cursor: not-allowed; }

    .toggle-btn {
      background: #fee2e2; color: #991b1b;
      border: 1px solid #fca5a5;
      border-radius: 8px; padding: 10px 16px;
      font-size: 13px; font-weight: 700; cursor: pointer;
      transition: all .15s;
    }
    .toggle-btn.on { background: #dcfce7; color: #166534; border-color: #86efac; }
    .toggle-btn:hover { opacity: .85; }

    /* TOOLBAR */
    .toolbar {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 14px;
    }
    .search { flex: 1; min-width: 200px; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; }
    .search:focus { border-color: #0f4a33; }
    .filter { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; background: #fff; }
    .count { font-size: 12px; color: #6b7280; white-space: nowrap; }

    /* TABLA */
    .table-wrap { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: auto; }
    .tabla { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tabla th { background: #f9fafb; padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
    .tabla td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; white-space: nowrap; }
    .tabla tr:last-child td { border-bottom: none; }
    .tabla tr:hover td { background: #f9fafb; }
    .mono { font-family: monospace; font-size: 12px; color: #6b7280; }
    .bold { font-weight: 700; }
    .empty { text-align: center; padding: 32px !important; color: #9ca3af; white-space: normal; }
    .actions { display: flex; gap: 6px; }

    .badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 700; }
    .badge-blue { background: #dbeafe; color: #1e40af; }

    /* BOTONES */
    .btn { display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: opacity .15s; }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
    .btn-primary { background: #0f4a33; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #0a2f20; }
    .btn-ghost { background: #f3f4f6; color: #374151; border-color: #e5e7eb; }
    .btn-ghost:hover:not(:disabled) { background: #e5e7eb; }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn-danger:hover:not(:disabled) { background: #b91c1c; }
    .btn-sm { padding: 6px 12px; font-size: 12px; }

    /* MODAL */
    .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(2px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .modal { background: #fff; border-radius: 14px; width: min(520px, 100%); box-shadow: 0 24px 60px rgba(0,0,0,.2); display: grid; overflow: hidden; }
    .modal-sm { width: min(360px, 100%); }
    .modal-resultado { width: min(420px, 100%); }
    .modal-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
    .modal-head h3 { margin: 0; font-size: 17px; color: #111827; }
    .close { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; }
    .modal-body { padding: 20px; display: grid; gap: 14px; }
    .modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid #e5e7eb; background: #f9fafb; }

    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: 13px; font-weight: 600; color: #374151; }
    .field input, .field select, .field textarea { border: 1px solid #d1d5db; border-radius: 8px; padding: 9px 12px; font-size: 14px; outline: none; background: #fff; font-family: inherit; }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: #0f4a33; }
    .field textarea { resize: vertical; }

    .info-box {
      display: flex; align-items: flex-start; gap: 8px;
      background: #eff6ff; border: 1px solid #bfdbfe;
      border-radius: 8px; padding: 10px 12px;
      font-size: 12px; color: #1e40af; line-height: 1.5;
    }

    /* RESULTADO ENVÍO */
    .resultado-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .resultado-item { border-radius: 10px; padding: 16px; text-align: center; }
    .resultado-green { background: #dcfce7; border: 1px solid #86efac; }
    .resultado-red   { background: #fee2e2; border: 1px solid #fca5a5; }
    .resultado-num { font-size: 36px; font-weight: 900; color: #111827; }
    .resultado-lbl { font-size: 13px; font-weight: 600; color: #374151; margin-top: 4px; }
    .errores-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; }
    .errores-title { font-size: 12px; font-weight: 700; color: #991b1b; margin-bottom: 8px; text-transform: uppercase; }
    .error-item { font-size: 13px; color: #dc2626; padding: 3px 0; }

    .warn-text { color: #dc2626; font-size: 13px; margin: 4px 0 0; }
    p { margin: 0; font-size: 14px; color: #374151; line-height: 1.5; }
  `]
})
export class NotificacionesComponent implements OnInit {
  svc    = inject(NotificacionesService);
  paySvc = inject(PaymentService);
  private toast = inject(ToastService);

  busqueda       = signal('');
  filtroTipo     = signal('');
  modalAbierto   = signal(false);
  modoEditar     = signal(false);
  guardando      = signal(false);
  enviando       = signal(false);
  schedulerActivo = signal(false);
  eliminarTarget  = signal<Notificacion | null>(null);
  resultadoEnvio  = signal<{ enviados: number; fallidos: number; errores: string[] } | null>(null);
  form: Partial<Notificacion> = {};

  filtrados = computed(() => {
    const q  = this.busqueda().toLowerCase();
    const ft = this.filtroTipo() ? Number(this.filtroTipo()) : null;
    return this.svc.notificaciones().filter(n =>
      (!ft || n.tipo_notificacion === ft) &&
      (!q  ||
        n.descripcion.toLowerCase().includes(q) ||
        (n.tipo_notificacion_nombre ?? '').toLowerCase().includes(q)
      )
    );
  });

  ngOnInit(): void {
    this.svc.cargarNotificaciones().subscribe({
      error: () => this.toast.error('Error al cargar notificaciones')
    });
    if (this.svc.tiposNotificacion().length === 0) {
      this.svc.cargarTipos().subscribe();
    }
    if (this.paySvc.pagos().length === 0) {
      this.paySvc.cargarPagos().subscribe();
    }
    // ✅ Carga estado del scheduler
    this.svc.obtenerEstadoScheduler().subscribe({
      next: (res) => this.schedulerActivo.set(res.activo),
      error: () => console.warn('No se pudo obtener estado del scheduler')
    });
  }

  // ── CRUD ──────────────────────────────────────────

  abrirCrear(): void {
    this.form = { descripcion: '', tipo_notificacion: undefined, pago: undefined };
    this.modoEditar.set(false);
    this.modalAbierto.set(true);
  }

  abrirEditar(n: Notificacion): void {
    this.form = { ...n };
    this.modoEditar.set(true);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.form = {};
  }

  guardar(): void {
    if (!this.form.descripcion?.trim() ||
        !this.form.tipo_notificacion   ||
        !this.form.pago) {
      this.toast.warn('Completa todos los campos obligatorios.');
      return;
    }
    this.guardando.set(true);
    if (this.modoEditar()) {
      this.svc.actualizarNotificacion(this.form.id_notificacion!, this.form).subscribe({
        next: () => {
          this.toast.success('Notificación actualizada.');
          this.cerrarModal();
          this.guardando.set(false);
        },
        error: () => {
          this.toast.error('Error al actualizar.');
          this.guardando.set(false);
        }
      });
    } else {
      this.svc.crearNotificacion(this.form).subscribe({
        next: () => {
          this.toast.success('Notificación creada y correo enviado.');
          this.cerrarModal();
          this.guardando.set(false);
        },
        error: () => {
          this.toast.error('Error al crear.');
          this.guardando.set(false);
        }
      });
    }
  }

  confirmarEliminar(n: Notificacion): void {
    this.eliminarTarget.set(n);
  }

  eliminar(): void {
    const target = this.eliminarTarget();
    if (!target) return;
    this.guardando.set(true);
    this.svc.eliminarNotificacion(target.id_notificacion).subscribe({
      next: () => {
        this.toast.success('Notificación eliminada.');
        this.eliminarTarget.set(null);
        this.guardando.set(false);
      },
      error: () => {
        this.toast.error('Error al eliminar.');
        this.guardando.set(false);
      }
    });
  }

  // ── CORREOS ───────────────────────────────────────

  enviarRecordatorioAhora(): void {
    if (!confirm('¿Enviar recordatorio de pago a todos los propietarios ahora?')) return;
    this.enviando.set(true);
    this.svc.enviarRecordatorio().subscribe({
      next: (res) => {
        this.enviando.set(false);
        this.resultadoEnvio.set(res.resultado);
      },
      error: () => {
        this.toast.error('Error al enviar recordatorio.');
        this.enviando.set(false);
      }
    });
  }

  toggleScheduler(): void {
    const nuevoEstado = !this.schedulerActivo();
    this.svc.toggleScheduler(nuevoEstado).subscribe({
      next: (res) => {
        this.schedulerActivo.set(res.activo);
        this.toast.success(res.mensaje);
      },
      error: () => this.toast.error('Error al cambiar el estado del scheduler.')
    });
  }
}