import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { EstadoPago } from '../../../core/models/models';

@Component({
  selector: 'app-estados-pagos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">

      <section class="head">
        <div>
          <div class="kicker">Módulo financiero</div>
          <h2>Estados de Pago</h2>
        </div>
        <button class="btn btn-primary" (click)="abrirCrear()">+ Nuevo estado</button>
      </section>

      <div class="toolbar">
        <input class="search" [(ngModel)]="busqueda" placeholder="Buscar por nombre..." />
        <span class="count">{{ filtrados().length }} registros</span>
      </div>

      <div class="table-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Vista previa</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (e of filtrados(); track e.id_estado_pago) {
              <tr>
                <td class="mono">{{ e.id_estado_pago }}</td>
                <td class="bold">{{ e.nombre }}</td>
                <td>
                  <span class="badge" [class]="badgeClass(e.nombre)">{{ e.nombre }}</span>
                </td>
                <td>
                  <div class="actions">
                    <button class="btn btn-sm btn-ghost" (click)="abrirEditar(e)">Editar</button>
                    <button class="btn btn-sm btn-danger" (click)="confirmarEliminar(e)">Eliminar</button>
                  </div>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="4" class="empty">No hay estados de pago registrados.</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (modalAbierto()) {
        <div class="backdrop" (click)="cerrarModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h3>{{ modoEditar() ? 'Editar estado' : 'Nuevo estado de pago' }}</h3>
              <button class="close" (click)="cerrarModal()">✕</button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label>Nombre *</label>
                <input [(ngModel)]="form.nombre" placeholder="Ej: Pagado, Pendiente, Vencido" />
              </div>
              @if (form.nombre) {
                <div class="preview">
                  <span class="preview-label">Vista previa:</span>
                  <span class="badge" [class]="badgeClass(form.nombre)">{{ form.nombre }}</span>
                </div>
              }
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" (click)="cerrarModal()">Cancelar</button>
              <button class="btn btn-primary"
                      [disabled]="guardando()"
                      (click)="guardar()">
                {{ guardando() ? 'Guardando...' : (modoEditar() ? 'Guardar cambios' : 'Crear') }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (eliminarTarget()) {
        <div class="backdrop" (click)="eliminarTarget.set(null)">
          <div class="modal modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h3>Confirmar eliminación</h3>
              <button class="close" (click)="eliminarTarget.set(null)">✕</button>
            </div>
            <div class="modal-body">
              <p>¿Eliminar el estado <strong>{{ eliminarTarget()!.nombre }}</strong>?</p>
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

    </div>
  `,
  styles: [`
    .page { display: grid; gap: 16px; }
    .head { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; background: linear-gradient(145deg, #0a2f20, #0f4a33); color: #fff; border-radius: 14px; padding: 18px 20px; }
    .kicker { font-size: 10px; text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.65); font-weight: 700; }
    .head h2 { margin: 6px 0 0; font-size: 24px; }
    .toolbar { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 14px; }
    .search { flex: 1; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; }
    .search:focus { border-color: #0f4a33; }
    .count { font-size: 12px; color: #6b7280; white-space: nowrap; }
    .table-wrap { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: auto; }
    .tabla { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tabla th { background: #f9fafb; padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
    .tabla td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
    .tabla tr:last-child td { border-bottom: none; }
    .tabla tr:hover td { background: #f9fafb; }
    .mono { font-family: monospace; font-size: 12px; color: #6b7280; }
    .bold { font-weight: 700; }
    .empty { text-align: center; padding: 32px !important; color: #9ca3af; }
    .actions { display: flex; gap: 6px; }
    .badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 700; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-amber { background: #fef9c3; color: #854d0e; }
    .badge-red   { background: #fee2e2; color: #991b1b; }
    .badge-blue  { background: #dbeafe; color: #1e40af; }
    .btn { display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: opacity .15s; }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
    .btn-primary { background: #0f4a33; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #0a2f20; }
    .btn-ghost { background: #f3f4f6; color: #374151; border-color: #e5e7eb; }
    .btn-ghost:hover:not(:disabled) { background: #e5e7eb; }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn-danger:hover:not(:disabled) { background: #b91c1c; }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(2px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .modal { background: #fff; border-radius: 14px; width: min(420px, 100%); box-shadow: 0 24px 60px rgba(0,0,0,.2); display: grid; overflow: hidden; }
    .modal-sm { width: min(360px, 100%); }
    .modal-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
    .modal-head h3 { margin: 0; font-size: 17px; color: #111827; }
    .close { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; }
    .modal-body { padding: 20px; display: grid; gap: 14px; }
    .modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid #e5e7eb; background: #f9fafb; }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: 13px; font-weight: 600; color: #374151; }
    .field input { border: 1px solid #d1d5db; border-radius: 8px; padding: 9px 12px; font-size: 14px; outline: none; }
    .field input:focus { border-color: #0f4a33; }
    .preview { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
    .preview-label { font-size: 12px; color: #6b7280; font-weight: 600; }
    .warn-text { color: #dc2626; font-size: 13px; margin: 4px 0 0; }
    p { margin: 0; font-size: 14px; color: #374151; line-height: 1.5; }
  `]
})
export class EstadosPagosComponent implements OnInit {
  private svc   = inject(PaymentService);
  private toast = inject(ToastService);

  estados        = this.svc.estados;
  busqueda       = signal('');
  modalAbierto   = signal(false);
  modoEditar     = signal(false);
  guardando      = signal(false);
  eliminarTarget = signal<EstadoPago | null>(null);
  form: Partial<EstadoPago> = {};

  filtrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    return this.estados().filter(e => !q || e.nombre.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    if (this.svc.estados().length === 0) {
      this.svc.cargarEstados().subscribe({
        error: () => this.toast.error('Error al cargar estados')
      });
    }
  }

  abrirCrear(): void {
    this.form = { nombre: '' };
    this.modoEditar.set(false);
    this.modalAbierto.set(true);
  }

  abrirEditar(e: EstadoPago): void {
    this.form = { ...e };
    this.modoEditar.set(true);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.form = {};
  }

  guardar(): void {
    if (!this.form.nombre?.trim()) {
      this.toast.warn('El nombre es obligatorio.');
      return;
    }
    this.guardando.set(true);
    if (this.modoEditar()) {
      this.svc.actualizarEstado(this.form.id_estado_pago!, this.form).subscribe({
        next: () => { this.toast.success('Estado actualizado.'); this.cerrarModal(); this.guardando.set(false); },
        error: () => { this.toast.error('Error al actualizar.'); this.guardando.set(false); }
      });
    } else {
      this.svc.crearEstado(this.form).subscribe({
        next: () => { this.toast.success('Estado creado.'); this.cerrarModal(); this.guardando.set(false); },
        error: () => { this.toast.error('Error al crear.'); this.guardando.set(false); }
      });
    }
  }

  confirmarEliminar(e: EstadoPago): void { this.eliminarTarget.set(e); }

  eliminar(): void {
    const target = this.eliminarTarget();
    if (!target) return;
    this.guardando.set(true);
    this.svc.eliminarEstado(target.id_estado_pago).subscribe({
      next: () => { this.toast.success('Estado eliminado.'); this.eliminarTarget.set(null); this.guardando.set(false); },
      error: () => { this.toast.error('Error al eliminar. Puede tener pagos asociados.'); this.guardando.set(false); }
    });
  }

  badgeClass(nombre: string): string {
    return {
      'Pagado':    'badge-green',
      'Pendiente': 'badge-amber',
      'Vencido':   'badge-red',
    }[nombre] ?? 'badge-blue';
  }
}