import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { ToastService } from '../../../core/services/toast.service';
import { Usuario } from '../../../core/models/models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">

      <!-- CABECERA -->
      <section class="head">
        <div>
          <div class="kicker">Gestión de accesos</div>
          <h2>Usuarios</h2>
        </div>
        <button class="btn btn-primary" (click)="abrirCrear()">+ Nuevo usuario</button>
      </section>

      <!-- FILTROS -->
      <div class="toolbar">
        <input class="search" [(ngModel)]="busqueda"
               placeholder="Buscar por nombre, identificación o correo..." />
        <span class="count">{{ filtrados().length }} registros</span>
      </div>

      <!-- TABLA -->
      <div class="table-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Identificación</th>
              <th>Nombre completo</th>
              <th>Correo</th>
              <th>Celular</th>
              <th>Perfil</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (u of filtrados(); track u.identificacion) {
              <tr>
                <td class="mono">{{ u.identificacion }}</td>
                <td class="bold">{{ u.primer_nombre }} {{ u.primer_apellido }}</td>
                <td>{{ u.correo }}</td>
                <td>{{ u.celular }}</td>
                <td>
                  <span class="badge badge-blue">{{ u.perfil_nombre ?? u.perfil }}</span>
                </td>
                <td>
                  <div class="actions">
                    <button class="btn btn-sm btn-ghost" (click)="abrirEditar(u)">Editar</button>
                    <button class="btn btn-sm btn-danger" (click)="confirmarEliminar(u)">Eliminar</button>
                  </div>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="6" class="empty">No hay usuarios registrados.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- MODAL CREAR / EDITAR -->
      @if (modalAbierto()) {
        <div class="backdrop" (click)="cerrarModal()">
          <div class="modal modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h3>{{ modoEditar() ? 'Editar usuario' : 'Nuevo usuario' }}</h3>
              <button class="close" (click)="cerrarModal()">✕</button>
            </div>
            <div class="modal-body grid2">

              <div class="field">
                <label>Identificación *</label>
                <input [(ngModel)]="form.identificacion"
                       [disabled]="modoEditar()"
                       placeholder="Ej: 123456789"
                       maxlength="30" />
              </div>

              <div class="field">
                <label>Tipo documento *</label>
                <select [(ngModel)]="form.id_tipo_documento">
                  <option [ngValue]="undefined">Seleccionar...</option>
                  <option [value]="1">Cédula de Ciudadanía</option>
                  <option [value]="2">Cédula de Extranjería</option>
                  <option [value]="3">Pasaporte</option>
                  <option [value]="4">NIT</option>
                </select>
              </div>

              <div class="field">
                <label>Primer nombre *</label>
                <input [(ngModel)]="form.primer_nombre" placeholder="Ej: Juan" />
              </div>

              <div class="field">
                <label>Segundo nombre</label>
                <input [(ngModel)]="form.segundo_nombre" placeholder="Opcional" />
              </div>

              <div class="field">
                <label>Primer apellido *</label>
                <input [(ngModel)]="form.primer_apellido" placeholder="Ej: Pérez" />
              </div>

              <div class="field">
                <label>Segundo apellido</label>
                <input [(ngModel)]="form.segundo_apellido" placeholder="Opcional" />
              </div>

              <div class="field">
                <label>Correo *</label>
                <input [(ngModel)]="form.correo" type="email" placeholder="Ej: juan@correo.com" />
              </div>

              <div class="field">
                <label>Celular *</label>
                <input [(ngModel)]="form.celular" placeholder="Ej: 3001234567" maxlength="10" />
              </div>

              <div class="field">
                <label>Contraseña {{ modoEditar() ? '(dejar vacío para no cambiar)' : '*' }}</label>
                <div class="inp-wrap">
                  <input [(ngModel)]="contrasenna"
                         [type]="showPass() ? 'text' : 'password'"
                         placeholder="Mínimo 4 caracteres" />
                  <span class="inp-eye" (click)="showPass.set(!showPass())">
                    {{ showPass() ? '🙈' : '👁️' }}
                  </span>
                </div>
              </div>

              <div class="field">
                <label>Perfil *</label>
                <select [(ngModel)]="form.perfil">
                  <option [ngValue]="undefined">Seleccionar...</option>
                  <option [value]="1">Admin</option>
                  <option [value]="2">Propietario</option>
                </select>
              </div>

            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" (click)="cerrarModal()">Cancelar</button>
              <button class="btn btn-primary"
                      [disabled]="guardando()"
                      (click)="guardar()">
                {{ guardando() ? 'Guardando...' : (modoEditar() ? 'Guardar cambios' : 'Crear usuario') }}
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
              <p>¿Eliminar al usuario
                <strong>{{ eliminarTarget()!.primer_nombre }}
                {{ eliminarTarget()!.primer_apellido }}</strong>?
              </p>
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
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 14px;
    }
    .search { flex: 1; min-width: 200px; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; }
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
    .modal-lg { width: min(680px, 100%); }
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
    .field input:disabled { background: #f3f4f6; color: #9ca3af; }
    .inp-wrap { position: relative; }
    .inp-wrap input { width: 100%; box-sizing: border-box; padding-right: 40px; }
    .inp-eye { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; font-size: 16px; }
    .warn-text { color: #dc2626; font-size: 13px; margin: 4px 0 0; }
    p { margin: 0; font-size: 14px; color: #374151; line-height: 1.5; }
    @media (max-width: 640px) { .modal-body.grid2 { grid-template-columns: 1fr; } }
  `]
})
export class UsuariosComponent implements OnInit {
  private svc   = inject(UsuariosService);
  private toast = inject(ToastService);

  usuarios       = this.svc.usuarios;
  busqueda       = signal('');
  modalAbierto   = signal(false);
  modoEditar     = signal(false);
  guardando      = signal(false);
  showPass       = signal(false);
  eliminarTarget = signal<Usuario | null>(null);
  contrasenna    = '';

  form: Partial<Usuario> = {};

  filtrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    return this.usuarios().filter(u =>
      !q ||
      u.identificacion.toLowerCase().includes(q) ||
      u.primer_nombre.toLowerCase().includes(q) ||
      u.primer_apellido.toLowerCase().includes(q) ||
      u.correo.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    if (this.svc.usuarios().length === 0) {
      this.svc.cargarUsuarios().subscribe({
        error: () => this.toast.error('Error al cargar usuarios')
      });
    }
  }

  abrirCrear(): void {
    this.form = {
      identificacion: '',
      id_tipo_documento: undefined,
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      correo: '',
      celular: '',
      perfil: undefined,
    };
    this.contrasenna = '';
    this.modoEditar.set(false);
    this.modalAbierto.set(true);
  }

  abrirEditar(u: Usuario): void {
    this.form = { ...u };
    this.contrasenna = '';
    this.modoEditar.set(true);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.form = {};
    this.contrasenna = '';
  }

  guardar(): void {
    if (!this.form.identificacion || !this.form.primer_nombre ||
        !this.form.primer_apellido || !this.form.correo ||
        !this.form.celular || !this.form.perfil ||
        !this.form.id_tipo_documento) {
      this.toast.warn('Completa todos los campos obligatorios.');
      return;
    }

    if (!this.modoEditar() && !this.contrasenna) {
      this.toast.warn('La contraseña es obligatoria para nuevos usuarios.');
      return;
    }

    const payload: any = { ...this.form };
    if (this.contrasenna) {
      payload.contrasenna = this.contrasenna;
    }

    this.guardando.set(true);

    if (this.modoEditar()) {
      this.svc.actualizarUsuario(this.form.identificacion!, payload).subscribe({
        next: () => {
          this.toast.success('Usuario actualizado correctamente.');
          this.cerrarModal();
          this.guardando.set(false);
        },
        error: (err) => {
          const msg = err?.error?.correo?.[0] || 'Error al actualizar usuario.';
          this.toast.error(msg);
          this.guardando.set(false);
        }
      });
    } else {
      this.svc.crearUsuario(payload).subscribe({
        next: () => {
          this.toast.success('Usuario creado correctamente.');
          this.cerrarModal();
          this.guardando.set(false);
        },
        error: (err) => {
          const msg = err?.error?.correo?.[0]
            || err?.error?.identificacion?.[0]
            || 'Error al crear usuario.';
          this.toast.error(msg);
          this.guardando.set(false);
        }
      });
    }
  }

  confirmarEliminar(u: Usuario): void {
    this.eliminarTarget.set(u);
  }

  eliminar(): void {
    const target = this.eliminarTarget();
    if (!target) return;
    this.guardando.set(true);
    this.svc.eliminarUsuario(target.identificacion).subscribe({
      next: () => {
        this.toast.success('Usuario eliminado.');
        this.eliminarTarget.set(null);
        this.guardando.set(false);
      },
      error: () => {
        this.toast.error('Error al eliminar. El usuario puede tener datos asociados.');
        this.guardando.set(false);
      }
    });
  }
}