import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SeguridadService, Permiso } from '../../../core/services/seguridad.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">
      <section class="head">
        <div>
          <div class="kicker">Gestión de accesos</div>
          <h2>Permisos</h2>
        </div>
        <button class="btn btn-primary" (click)="abrirCrear()">+ Nuevo permiso</button>
      </section>

      <div class="toolbar">
        <input class="search" [(ngModel)]="busqueda" placeholder="Buscar por perfil o formulario..." />
        <select class="filter" [(ngModel)]="filtroPerfil">
          <option value="">Todos los perfiles</option>
          @for (p of svc.perfiles(); track p.id_perfil) {
            <option [value]="p.id_perfil">{{ p.nombre }}</option>
          }
        </select>
        <span class="count">{{ filtrados().length }} registros</span>
      </div>

      <div class="table-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Perfil</th><th>Formulario</th>
              <th>Crear</th><th>Editar</th><th>Leer</th><th>Eliminar</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (p of filtrados(); track p.perfil + '-' + p.formulario) {
              <tr>
                <td class="bold">{{ p.perfil_nombre ?? p.perfil }}</td>
                <td>{{ p.formulario_nombre ?? p.formulario }}</td>
                <td><span class="dot" [class]="p.crear === 'S' ? 'dot-green' : 'dot-red'">{{ p.crear }}</span></td>
                <td><span class="dot" [class]="p.editar === 'S' ? 'dot-green' : 'dot-red'">{{ p.editar }}</span></td>
                <td><span class="dot" [class]="p.leer === 'S' ? 'dot-green' : 'dot-red'">{{ p.leer }}</span></td>
                <td><span class="dot" [class]="p.eliminar === 'S' ? 'dot-green' : 'dot-red'">{{ p.eliminar }}</span></td>
                <td>
                  <div class="actions">
                    <button class="btn btn-sm btn-ghost" (click)="abrirEditar(p)">Editar</button>
                    <button class="btn btn-sm btn-danger" (click)="confirmarEliminar(p)">Eliminar</button>
                  </div>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="7" class="empty">No hay permisos registrados.</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (modalAbierto()) {
        <div class="backdrop" (click)="cerrarModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h3>{{ modoEditar() ? 'Editar permiso' : 'Nuevo permiso' }}</h3>
              <button class="close" (click)="cerrarModal()">✕</button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label>Perfil *</label>
                <select [(ngModel)]="form.perfil" [disabled]="modoEditar()">
                  <option [ngValue]="undefined">Seleccionar...</option>
                  @for (p of svc.perfiles(); track p.id_perfil) {
                    <option [value]="p.id_perfil">{{ p.nombre }}</option>
                  }
                </select>
              </div>
              <div class="field">
                <label>Formulario *</label>
                <select [(ngModel)]="form.formulario" [disabled]="modoEditar()">
                  <option [ngValue]="undefined">Seleccionar...</option>
                  @for (f of svc.formularios(); track f.id_formulario) {
                    <option [value]="f.id_formulario">{{ f.nombre_formulario }}</option>
                  }
                </select>
              </div>
              <div class="perms-grid">
                <label class="perm-item">
                  <span>Crear</span>
                  <select [(ngModel)]="form.crear">
                    <option value="S">✅ Sí</option>
                    <option value="N">❌ No</option>
                  </select>
                </label>
                <label class="perm-item">
                  <span>Editar</span>
                  <select [(ngModel)]="form.editar">
                    <option value="S">✅ Sí</option>
                    <option value="N">❌ No</option>
                  </select>
                </label>
                <label class="perm-item">
                  <span>Leer</span>
                  <select [(ngModel)]="form.leer">
                    <option value="S">✅ Sí</option>
                    <option value="N">❌ No</option>
                  </select>
                </label>
                <label class="perm-item">
                  <span>Eliminar</span>
                  <select [(ngModel)]="form.eliminar">
                    <option value="S">✅ Sí</option>
                    <option value="N">❌ No</option>
                  </select>
                </label>
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
              <p>¿Eliminar el permiso de
                <strong>{{ eliminarTarget()!.perfil_nombre ?? eliminarTarget()!.perfil }}</strong>
                sobre <strong>{{ eliminarTarget()!.formulario_nombre ?? eliminarTarget()!.formulario }}</strong>?
              </p>
              <p class="warn-text">Esta acción no se puede deshacer.</p>
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
    .toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 14px; }
    .search { flex: 1; min-width: 180px; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; }
    .search:focus { border-color: #0f4a33; }
    .filter { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; background: #fff; }
    .count { font-size: 12px; color: #6b7280; white-space: nowrap; }
    .table-wrap { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: auto; }
    .tabla { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tabla th { background: #f9fafb; padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
    .tabla td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
    .tabla tr:last-child td { border-bottom: none; }
    .tabla tr:hover td { background: #f9fafb; }
    .bold { font-weight: 700; }
    .empty { text-align: center; padding: 32px !important; color: #9ca3af; }
    .dot { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 2px 8px; font-size: 11px; font-weight: 800; }
    .dot-green { background: #dcfce7; color: #166534; }
    .dot-red   { background: #fee2e2; color: #991b1b; }
    .actions { display: flex; gap: 6px; }
    .perms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .perm-item { display: flex; flex-direction: column; gap: 5px; }
    .perm-item span { font-size: 13px; font-weight: 600; color: #374151; }
    .perm-item select { border: 1px solid #d1d5db; border-radius: 8px; padding: 9px 12px; font-size: 14px; outline: none; background: #fff; }
    .perm-item select:focus { border-color: #0f4a33; }
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
    .modal-sm { width: min(380px, 100%); }
    .modal-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
    .modal-head h3 { margin: 0; font-size: 17px; color: #111827; }
    .close { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; }
    .modal-body { padding: 20px; display: grid; gap: 14px; }
    .modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid #e5e7eb; background: #f9fafb; }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: 13px; font-weight: 600; color: #374151; }
    .field input, .field select { border: 1px solid #d1d5db; border-radius: 8px; padding: 9px 12px; font-size: 14px; outline: none; background: #fff; }
    .field select:disabled { background: #f3f4f6; color: #9ca3af; }
    .warn-text { color: #dc2626; font-size: 13px; margin: 4px 0 0; }
    p { margin: 0; font-size: 14px; color: #374151; line-height: 1.5; }
  `]
})
export class PermisosComponent implements OnInit {
  svc   = inject(SeguridadService);
  private toast = inject(ToastService);

  permisos       = this.svc.permisos;
  busqueda       = signal('');
  filtroPerfil   = signal('');
  modalAbierto   = signal(false);
  modoEditar     = signal(false);
  guardando      = signal(false);
  eliminarTarget = signal<Permiso | null>(null);
  form: Partial<Permiso> = {};

  filtrados = computed(() => {
    const q  = this.busqueda().toLowerCase();
    const fp = this.filtroPerfil() ? Number(this.filtroPerfil()) : null;
    return this.permisos().filter(p =>
      (!fp || p.perfil === fp) &&
      (!q  ||
        (p.perfil_nombre ?? '').toLowerCase().includes(q) ||
        (p.formulario_nombre ?? '').toLowerCase().includes(q)
      )
    );
  });

  ngOnInit(): void {
    if (this.svc.permisos().length === 0) {
      this.svc.cargarPermisos().subscribe({ error: () => this.toast.error('Error al cargar permisos') });
    }
    if (this.svc.perfiles().length === 0) {
      this.svc.cargarPerfiles().subscribe();
    }
    if (this.svc.formularios().length === 0) {
      this.svc.cargarFormularios().subscribe();
    }
  }

  abrirCrear(): void {
    this.form = { perfil: undefined, formulario: undefined, crear: 'N', editar: 'N', leer: 'S', eliminar: 'N' };
    this.modoEditar.set(false);
    this.modalAbierto.set(true);
  }

  abrirEditar(p: Permiso): void {
    this.form = { ...p };
    this.modoEditar.set(true);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.form = {};
  }

  guardar(): void {
    if (!this.form.perfil || !this.form.formulario) {
      this.toast.warn('Selecciona perfil y formulario.');
      return;
    }
    this.guardando.set(true);
    if (this.modoEditar()) {
      this.svc.actualizarPermiso(this.form.perfil!, this.form.formulario!, this.form).subscribe({
        next: () => { this.toast.success('Permiso actualizado.'); this.cerrarModal(); this.guardando.set(false); },
        error: () => { this.toast.error('Error al actualizar.'); this.guardando.set(false); }
      });
    } else {
      this.svc.crearPermiso(this.form).subscribe({
        next: () => { this.toast.success('Permiso creado.'); this.cerrarModal(); this.guardando.set(false); },
        error: (err) => {
          const msg = err?.error?.non_field_errors?.[0] || 'Error al crear permiso.';
          this.toast.error(msg);
          this.guardando.set(false);
        }
      });
    }
  }

  confirmarEliminar(p: Permiso): void { this.eliminarTarget.set(p); }

  eliminar(): void {
    const target = this.eliminarTarget();
    if (!target) return;
    this.guardando.set(true);
    this.svc.eliminarPermiso(target.perfil, target.formulario).subscribe({
      next: () => { this.toast.success('Permiso eliminado.'); this.eliminarTarget.set(null); this.guardando.set(false); },
      error: () => { this.toast.error('Error al eliminar.'); this.guardando.set(false); }
    });
  }
}