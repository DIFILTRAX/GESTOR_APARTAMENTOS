import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PropiedadesService } from '../../../core/services/propiedades.service';
import { ToastService } from '../../../core/services/toast.service';
import { Piso, Edificio } from '../../../core/models/models';

@Component({
  selector: 'app-pisos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">

      <!-- CABECERA -->
      <section class="head">
        <div>
          <div class="kicker">Gestión de propiedades</div>
          <h2>Pisos</h2>
        </div>
        <button class="btn btn-primary" (click)="abrirCrear()">+ Nuevo piso</button>
      </section>

      <!-- BUSCADOR -->
      <div class="toolbar">
        <input class="search" [(ngModel)]="busqueda"
               placeholder="Buscar por número o edificio..." />
        <span class="count">{{ filtrados().length }} registros</span>
      </div>

      <!-- TABLA -->
      <div class="table-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>ID Piso</th>
              <th>Edificio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (p of filtrados(); track p.id_piso) {
              <tr>
                <td class="bold">Piso {{ p.id_piso }}</td>
                <td>{{ p.edificio_nombre ?? p.edificio }}</td>
                <td>
                  <div class="actions">
                    <button class="btn btn-sm btn-ghost" (click)="abrirEditar(p)">Editar</button>
                    <button class="btn btn-sm btn-danger" (click)="confirmarEliminar(p)">Eliminar</button>
                  </div>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="3" class="empty">No hay pisos registrados.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- MODAL CREAR / EDITAR -->
      @if (modalAbierto()) {
        <div class="backdrop" (click)="cerrarModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h3>{{ modoEditar() ? 'Editar piso' : 'Nuevo piso' }}</h3>
              <button class="close" (click)="cerrarModal()">✕</button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label>Número de piso *</label>
                <input [(ngModel)]="form.id_piso"
                       type="number" min="1"
                       [disabled]="modoEditar()"
                       placeholder="Ej: 1" />
              </div>
              <div class="field">
                <label>Edificio *</label>
                <select [(ngModel)]="form.edificio">
                  <option value="">Seleccionar...</option>
                  @for (e of edificios(); track e.id_edificio) {
                    <option [value]="e.id_edificio">{{ e.nombre }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" (click)="cerrarModal()">Cancelar</button>
              <button class="btn btn-primary"
                      [disabled]="guardando()"
                      (click)="guardar()">
                {{ guardando() ? 'Guardando...' : (modoEditar() ? 'Guardar cambios' : 'Crear piso') }}
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
              <p>¿Eliminar el <strong>Piso {{ eliminarTarget()!.id_piso }}</strong>
                 del edificio <strong>{{ eliminarTarget()!.edificio_nombre ?? eliminarTarget()!.edificio }}</strong>?</p>
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
    .head {
      display: flex; justify-content: space-between; align-items: flex-end;
      flex-wrap: wrap; gap: 12px;
      background: linear-gradient(145deg, #0a2f20, #0f4a33);
      color: #fff; border-radius: 14px; padding: 18px 20px;
    }
    .kicker { font-size: 10px; text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.65); font-weight: 700; }
    .head h2 { margin: 6px 0 0; font-size: 24px; }
    .toolbar {
      display: flex; align-items: center; gap: 12px;
      background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 14px;
    }
    .search { flex: 1; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; }
    .search:focus { border-color: #0f4a33; }
    .count { font-size: 12px; color: #6b7280; white-space: nowrap; }
    .table-wrap { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: auto; }
    .tabla { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tabla th { background: #f9fafb; padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
    .tabla td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
    .tabla tr:last-child td { border-bottom: none; }
    .tabla tr:hover td { background: #f9fafb; }
    .bold { font-weight: 700; }
    .empty { text-align: center; padding: 32px !important; color: #9ca3af; }
    .actions { display: flex; gap: 6px; }
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
    .modal { background: #fff; border-radius: 14px; width: min(480px, 100%); box-shadow: 0 24px 60px rgba(0,0,0,.2); display: grid; overflow: hidden; }
    .modal-sm { width: min(360px, 100%); }
    .modal-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
    .modal-head h3 { margin: 0; font-size: 17px; color: #111827; }
    .close { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; }
    .modal-body { padding: 20px; display: grid; gap: 14px; }
    .modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid #e5e7eb; background: #f9fafb; }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: 13px; font-weight: 600; color: #374151; }
    .field input, .field select { border: 1px solid #d1d5db; border-radius: 8px; padding: 9px 12px; font-size: 14px; outline: none; }
    .field input:focus, .field select:focus { border-color: #0f4a33; }
    .field input:disabled { background: #f3f4f6; color: #9ca3af; }
    .warn-text { color: #dc2626; font-size: 13px; margin: 4px 0 0; }
    p { margin: 0; font-size: 14px; color: #374151; }
  `]
})
export class PisosComponent implements OnInit {
  private svc   = inject(PropiedadesService);
  private toast = inject(ToastService);

  pisos          = this.svc.pisos;
  edificios      = this.svc.edificios;
  busqueda       = signal('');
  modalAbierto   = signal(false);
  modoEditar     = signal(false);
  guardando      = signal(false);
  eliminarTarget = signal<Piso | null>(null);

  form: Partial<Piso> = {};

  filtrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    return this.pisos().filter(p =>
      !q ||
      String(p.id_piso).includes(q) ||
      (p.edificio_nombre ?? p.edificio).toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.svc.cargarEdificios().subscribe({
      error: () => this.toast.error('Error al cargar edificios')
    });
    this.svc.cargarPisos().subscribe({
      error: () => this.toast.error('Error al cargar pisos')
    });
  }

  abrirCrear(): void {
    this.form = { id_piso: undefined, edificio: '' };
    this.modoEditar.set(false);
    this.modalAbierto.set(true);
  }

  abrirEditar(p: Piso): void {
    this.form = { ...p };
    this.modoEditar.set(true);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.form = {};
  }

  guardar(): void {
    if (!this.form.id_piso || !this.form.edificio) {
      this.toast.warn('Completa todos los campos obligatorios.');
      return;
    }

    this.guardando.set(true);

    if (this.modoEditar()) {
      this.svc.actualizarPiso(this.form.id_piso!, this.form).subscribe({
        next: () => {
          this.toast.success('Piso actualizado correctamente.');
          this.cerrarModal();
          this.guardando.set(false);
        },
        error: () => {
          this.toast.error('Error al actualizar el piso.');
          this.guardando.set(false);
        }
      });
    } else {
      this.svc.crearPiso(this.form).subscribe({
        next: () => {
          this.toast.success('Piso creado correctamente.');
          this.cerrarModal();
          this.guardando.set(false);
        },
        error: (err) => {
          const msg = err?.error?.non_field_errors?.[0] || 'Error al crear el piso.';
          this.toast.error(msg);
          this.guardando.set(false);
        }
      });
    }
  }

  confirmarEliminar(p: Piso): void {
    this.eliminarTarget.set(p);
  }

  eliminar(): void {
    const target = this.eliminarTarget();
    if (!target) return;
    this.guardando.set(true);
    // ✅ pasa el edificio para identificar el piso exacto
    this.svc.eliminarPiso(target.id_piso, target.edificio).subscribe({
      next: () => {
        this.toast.success('Piso eliminado.');
        this.eliminarTarget.set(null);
        this.guardando.set(false);
      },
      error: () => {
        this.toast.error('Error al eliminar. Puede tener apartamentos asociados.');
        this.guardando.set(false);
      }
    });
  }
}