import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SeguridadService, Formulario } from '../../../core/services/seguridad.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-formularios',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">
      <section class="head">
        <div>
          <div class="kicker">Gestión de accesos</div>
          <h2>Formularios</h2>
        </div>
        <button class="btn btn-primary" (click)="abrirCrear()">+ Nuevo formulario</button>
      </section>

      <div class="toolbar">
        <input class="search" [(ngModel)]="busqueda" placeholder="Buscar por nombre o redirect..." />
        <span class="count">{{ filtrados().length }} registros</span>
      </div>

      <div class="table-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>ID</th><th>Nombre</th><th>Nodo</th>
              <th>Orden</th><th>Icono</th><th>Redirect</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (f of filtrados(); track f.id_formulario) {
              <tr>
                <td class="mono">{{ f.id_formulario }}</td>
                <td class="bold">{{ f.nombre_formulario }}</td>
                <td>
                  <span class="badge" [class]="f.nodo_principal === 'S' ? 'badge-green' : 'badge-blue'">
                    {{ f.nodo_principal === 'S' ? 'Principal' : 'Hijo' }}
                  </span>
                </td>
                <td>{{ f.orden }}</td>
                <td>{{ f.icono ?? '-' }}</td>
                <td class="mono">{{ f.redirect }}</td>
                <td>
                  <div class="actions">
                    <button class="btn btn-sm btn-ghost" (click)="abrirEditar(f)">Editar</button>
                    <button class="btn btn-sm btn-danger" (click)="confirmarEliminar(f)">Eliminar</button>
                  </div>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="7" class="empty">No hay formularios registrados.</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (modalAbierto()) {
        <div class="backdrop" (click)="cerrarModal()">
          <div class="modal modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h3>{{ modoEditar() ? 'Editar formulario' : 'Nuevo formulario' }}</h3>
              <button class="close" (click)="cerrarModal()">✕</button>
            </div>
            <div class="modal-body grid2">
              <div class="field">
                <label>Nombre *</label>
                <input [(ngModel)]="form.nombre_formulario" placeholder="Ej: EDIFICIOS" />
              </div>
              <div class="field">
                <label>Nodo principal *</label>
                <select [(ngModel)]="form.nodo_principal">
                  <option value="S">Principal</option>
                  <option value="N">Hijo</option>
                </select>
              </div>
              <div class="field">
                <label>Orden *</label>
                <input [(ngModel)]="form.orden" type="number" min="1" placeholder="Ej: 1" />
              </div>
              <div class="field">
                <label>Redirect *</label>
                <input [(ngModel)]="form.redirect" placeholder="Ej: /admin/edificios" />
              </div>
              <div class="field">
                <label>Icono</label>
                <input [(ngModel)]="form.icono" placeholder="Ej: 🏢" />
              </div>
              <div class="field">
                <label>Dependencia (formulario padre)</label>
                <select [(ngModel)]="form.dependencia">
                  <option [ngValue]="null">Sin dependencia</option>
                  @for (f of svc.formularios(); track f.id_formulario) {
                    <option [value]="f.id_formulario">{{ f.nombre_formulario }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" (click)="cerrarModal()">Cancelar</button>
              <button class="btn btn-primary" [disabled]="guardando()" (click)="guardar()">
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
              <p>¿Eliminar el formulario <strong>{{ eliminarTarget()!.nombre_formulario }}</strong>?</p>
              <p class="warn-text">Esto eliminará también sus permisos asociados.</p>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" (click)="eliminarTarget.set(null)">Cancelar</button>
              <button class="btn btn-danger" [disabled]="guardando()" (click)="eliminar()">
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
    .tabla td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; white-space: nowrap; }
    .tabla tr:last-child td { border-bottom: none; }
    .tabla tr:hover td { background: #f9fafb; }
    .mono { font-family: monospace; font-size: 12px; color: #6b7280; }
    .bold { font-weight: 700; }
    .empty { text-align: center; padding: 32px !important; color: #9ca3af; white-space: normal; }
    .actions { display: flex; gap: 6px; }
    .badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 700; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
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
    .modal-lg { width: min(640px, 100%); }
    .modal-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
    .modal-head h3 { margin: 0; font-size: 17px; color: #111827; }
    .close { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; }
    .modal-body { padding: 20px; display: grid; gap: 14px; }
    .modal-body.grid2 { grid-template-columns: 1fr 1fr; }
    .modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid #e5e7eb; background: #f9fafb; }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: 13px; font-weight: 600; color: #374151; }
    .field input, .field select { border: 1px solid #d1d5db; border-radius: 8px; padding: 9px 12px; font-size: 14px; outline: none; background: #fff; }
    .field input:focus, .field select:focus { border-color: #0f4a33; }
    .warn-text { color: #dc2626; font-size: 13px; margin: 4px 0 0; }
    p { margin: 0; font-size: 14px; color: #374151; line-height: 1.5; }
    @media (max-width: 560px) { .modal-body.grid2 { grid-template-columns: 1fr; } }
  `]
})
export class FormulariosComponent implements OnInit {
  svc   = inject(SeguridadService);
  private toast = inject(ToastService);

  formularios    = this.svc.formularios;
  busqueda       = signal('');
  modalAbierto   = signal(false);
  modoEditar     = signal(false);
  guardando      = signal(false);
  eliminarTarget = signal<Formulario | null>(null);
  form: Partial<Formulario> = {};

  filtrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    return this.formularios().filter(f =>
      !q ||
      f.nombre_formulario.toLowerCase().includes(q) ||
      f.redirect.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    if (this.svc.formularios().length === 0) {
      this.svc.cargarFormularios().subscribe({ error: () => this.toast.error('Error al cargar formularios') });
    }
  }

  abrirCrear(): void {
    this.form = { nombre_formulario: '', nodo_principal: 'S', orden: 1, redirect: '', icono: '', dependencia: null };
    this.modoEditar.set(false);
    this.modalAbierto.set(true);
  }

  abrirEditar(f: Formulario): void {
    this.form = { ...f };
    this.modoEditar.set(true);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.form = {};
  }

  guardar(): void {
    if (!this.form.nombre_formulario?.trim() || !this.form.redirect?.trim() || !this.form.orden) {
      this.toast.warn('Completa los campos obligatorios.');
      return;
    }
    this.guardando.set(true);
    if (this.modoEditar()) {
      this.svc.actualizarFormulario(this.form.id_formulario!, this.form).subscribe({
        next: () => { this.toast.success('Formulario actualizado.'); this.cerrarModal(); this.guardando.set(false); },
        error: () => { this.toast.error('Error al actualizar.'); this.guardando.set(false); }
      });
    } else {
      this.svc.crearFormulario(this.form).subscribe({
        next: () => { this.toast.success('Formulario creado.'); this.cerrarModal(); this.guardando.set(false); },
        error: () => { this.toast.error('Error al crear.'); this.guardando.set(false); }
      });
    }
  }

  confirmarEliminar(f: Formulario): void { this.eliminarTarget.set(f); }

  eliminar(): void {
    const target = this.eliminarTarget();
    if (!target) return;
    this.guardando.set(true);
    this.svc.eliminarFormulario(target.id_formulario).subscribe({
      next: () => { this.toast.success('Formulario eliminado.'); this.eliminarTarget.set(null); this.guardando.set(false); },
      error: () => { this.toast.error('Error al eliminar.'); this.guardando.set(false); }
    });
  }
}