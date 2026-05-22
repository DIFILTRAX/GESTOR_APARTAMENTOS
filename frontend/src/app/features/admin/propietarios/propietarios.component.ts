import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PropiedadesService } from '../../../core/services/propiedades.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { ToastService } from '../../../core/services/toast.service';
import { Propietario } from '../../../core/models/models';

@Component({
  selector: 'app-propietarios',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">

      <!-- CABECERA -->
      <section class="head">
        <div>
          <div class="kicker">Gestión de propiedades</div>
          <h2>Propietarios</h2>
        </div>
        <button class="btn btn-primary" (click)="abrirCrear()">+ Asignar propietario</button>
      </section>

      <!-- FILTROS -->
      <div class="toolbar">
        <input class="search" [(ngModel)]="busqueda"
               placeholder="Buscar por identificación, nombre o apartamento..." />
        <select class="filter" [(ngModel)]="filtroEdificio"
                (ngModelChange)="filtroEdificio = $event">
          <option value="">Todos los edificios</option>
          @for (e of edificios(); track e.id_edificio) {
            <option [value]="e.id_edificio">{{ e.nombre }}</option>
          }
        </select>
        <span class="count">{{ filtrados().length }} registros</span>
      </div>

      <!-- TABLA -->
      <div class="table-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Identificación</th>
              <th>Nombre</th>
              <th>Apartamento</th>
              <th>Piso</th>
              <th>Edificio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (p of filtrados(); track p.identificacion) {
              <tr>
                <td class="mono">{{ p.identificacion }}</td>
                <td class="bold">{{ p.nombre_usuario ?? '-' }}</td>
                <td>Apto {{ p.apartamento }}</td>
                <td>Piso {{ p.piso }}</td>
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
              <tr><td colspan="6" class="empty">No hay propietarios registrados.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- MODAL CREAR / EDITAR -->
      @if (modalAbierto()) {
        <div class="backdrop" (click)="cerrarModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h3>{{ modoEditar() ? 'Editar propietario' : 'Asignar propietario' }}</h3>
              <button class="close" (click)="cerrarModal()">✕</button>
            </div>
            <div class="modal-body">

              <div class="field">
                <label>Usuario (Identificación) *</label>
                <select [(ngModel)]="form.identificacion"
                        [disabled]="modoEditar()">
                  <option value="">Seleccionar usuario...</option>
                  @for (u of usuarios(); track u.identificacion) {
                    <option [value]="u.identificacion">
                      {{ u.primer_nombre }} {{ u.primer_apellido }} — {{ u.identificacion }}
                    </option>
                  }
                </select>
              </div>

              <div class="field">
                <label>Edificio *</label>
                <select [(ngModel)]="form.edificio"
                        (ngModelChange)="onEdificioChange()">
                  <option value="">Seleccionar...</option>
                  @for (e of edificios(); track e.id_edificio) {
                    <option [value]="e.id_edificio">{{ e.nombre }}</option>
                  }
                </select>
              </div>

              <div class="field">
                <label>Piso *</label>
                <select [(ngModel)]="form.piso"
                        (ngModelChange)="onPisoChange()">
                  <option [ngValue]="undefined">Seleccionar...</option>
                  @for (p of pisosFiltrados; track p.id_piso) {
                    <option [value]="p.id_piso">Piso {{ p.id_piso }}</option>
                  }
                </select>
                @if (form.edificio && pisosFiltrados.length === 0) {
                  <small class="hint-warn">Este edificio no tiene pisos.</small>
                }
              </div>

              <div class="field">
                <label>Apartamento *</label>
                <select [(ngModel)]="form.apartamento">
                  <option [ngValue]="undefined">Seleccionar...</option>
                  @for (a of apartamentosFiltrados; track a.id_apartamento) {
                    <option [value]="a.id_apartamento">Apto {{ a.id_apartamento }}</option>
                  }
                </select>
                @if (form.piso && apartamentosFiltrados.length === 0) {
                  <small class="hint-warn">Este piso no tiene apartamentos.</small>
                }
              </div>

            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" (click)="cerrarModal()">Cancelar</button>
              <button class="btn btn-primary"
                      [disabled]="guardando()"
                      (click)="guardar()">
                {{ guardando() ? 'Guardando...' : (modoEditar() ? 'Guardar cambios' : 'Asignar') }}
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
              <p>¿Eliminar la asignación de
                <strong>{{ eliminarTarget()!.nombre_usuario ?? eliminarTarget()!.identificacion }}</strong>
                en el Apto {{ eliminarTarget()!.apartamento }}?
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
    .filter { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; background: #fff; }
    .filter:focus { border-color: #0f4a33; }
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
    .modal { background: #fff; border-radius: 14px; width: min(520px, 100%); box-shadow: 0 24px 60px rgba(0,0,0,.2); display: grid; overflow: hidden; }
    .modal-sm { width: min(360px, 100%); }
    .modal-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
    .modal-head h3 { margin: 0; font-size: 17px; color: #111827; }
    .close { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; }
    .modal-body { padding: 20px; display: grid; gap: 14px; }
    .modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid #e5e7eb; background: #f9fafb; }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: 13px; font-weight: 600; color: #374151; }
    .field input, .field select { border: 1px solid #d1d5db; border-radius: 8px; padding: 9px 12px; font-size: 14px; outline: none; background: #fff; }
    .field input:focus, .field select:focus { border-color: #0f4a33; }
    .field select:disabled { background: #f3f4f6; color: #9ca3af; }
    .field small { font-size: 11px; color: #9ca3af; }
    .hint-warn { font-size: 11px; color: #d97706; }
    .warn-text { color: #dc2626; font-size: 13px; margin: 4px 0 0; }
    p { margin: 0; font-size: 14px; color: #374151; line-height: 1.5; }
  `]
})
export class PropietariosComponent implements OnInit {
  private svc      = inject(PropiedadesService);
  private usuSvc   = inject(UsuariosService);
  private toast    = inject(ToastService);

  propietarios   = this.svc.propietarios;
  edificios      = this.svc.edificios;
  pisos          = this.svc.pisos;
  apartamentos   = this.svc.apartamentos;
  usuarios       = this.usuSvc.usuarios;

  busqueda       = signal('');
  filtroEdificio = signal('');
  modalAbierto   = signal(false);
  modoEditar     = signal(false);
  guardando      = signal(false);
  eliminarTarget = signal<Propietario | null>(null);

  form: Partial<Propietario> = {};
  formOriginal: { apartamento?: number; piso?: number; edificio?: string } = {};

  filtrados = computed(() => {
    const q  = this.busqueda().toLowerCase();
    const fe = this.filtroEdificio();
    return this.propietarios().filter(p =>
      (!fe || p.edificio === fe) &&
      (!q  ||
        p.identificacion.toLowerCase().includes(q) ||
        (p.nombre_usuario ?? '').toLowerCase().includes(q) ||
        String(p.apartamento).includes(q)
      )
    );
  });
    /*
  pisosDelEdificio = computed(() => {
    if (!this.form.edificio) return [];
    return this.pisos().filter(p => p.edificio === this.form.edificio);
  });

  apartamentosDelPiso = computed(() => {
    if (!this.form.edificio || !this.form.piso) return [];
    return this.apartamentos().filter(a =>
      a.edificio === this.form.edificio && a.piso === this.form.piso
    );
  });
  */

    get pisosFiltrados() {
    const edificio = String(this.form.edificio ?? '');

    if (!edificio) {
        return [];
    }

    return this.pisos().filter(
        (p: any) => String(p.edificio) === edificio
    );
    }

    get apartamentosFiltrados() {
    const edificio = String(this.form.edificio ?? '');
    const piso = String(this.form.piso ?? '');

    if (!edificio || !piso) {
        return [];
    }

    return this.apartamentos().filter(
        (a: any) =>
        String(a.edificio) === edificio &&
        String(a.piso) === piso
    );
    }


  ngOnInit(): void {
    this.svc.cargarEdificios().subscribe();
    this.svc.cargarPisos().subscribe();
    this.svc.cargarApartamentos().subscribe();
    this.svc.cargarPropietarios().subscribe({
      error: () => this.toast.error('Error al cargar propietarios')
    });
    this.usuSvc.cargarUsuarios().subscribe({
      error: () => this.toast.error('Error al cargar usuarios')
    });
  }

  abrirCrear(): void {
    this.form = {
      identificacion: '',
      edificio: '',
      piso: undefined,
      apartamento: undefined
    };
    this.modoEditar.set(false);
    this.modalAbierto.set(true);
  }
  //abrir editar -------------------------------
  abrirEditar(p: Propietario): void {
  this.form = { ...p };
  // ✅ Guarda los valores originales para el PUT
  this.formOriginal = {
    apartamento: p.apartamento,
    piso:        p.piso,
    edificio:    p.edificio,
  };
  this.modoEditar.set(true);
  this.modalAbierto.set(true);
  }
  /*
  abrirEditar(p: Propietario): void {
    this.form = { ...p };
    this.modoEditar.set(true);
    this.modalAbierto.set(true);
  }
  */
  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.form = {};
  }

  onEdificioChange(): void {
    this.form.piso = undefined;
    this.form.apartamento = undefined;
  }

  onPisoChange(): void {
    this.form.apartamento = undefined;
  }

  guardar(): void {
    if (!this.form.identificacion || !this.form.edificio ||
        !this.form.piso || !this.form.apartamento) {
      this.toast.warn('Completa todos los campos obligatorios.');
      return;
    }

    this.guardando.set(true);

    if (this.modoEditar()) {
      this.svc.actualizarPropietario(
        this.form.identificacion!,
        this.form,
        this.formOriginal.apartamento!,
        this.formOriginal.piso!,
        this.formOriginal.edificio!
      ).subscribe({
        next: () => {
          this.toast.success('Propietario actualizado correctamente.');
          this.cerrarModal();
          this.guardando.set(false);
        },
        error: () => {
          this.toast.error('Error al actualizar.');
          this.guardando.set(false);
        }
      });
    } else {
      this.svc.crearPropietario(this.form).subscribe({
        next: () => {
          this.toast.success('Propietario asignado correctamente.');
          this.cerrarModal();
          this.guardando.set(false);
        },
        error: (err) => {
          const msg = err?.error?.non_field_errors?.[0]
            || err?.error?.identificacion?.[0]
            || 'Error al asignar propietario.';
          this.toast.error(msg);
          this.guardando.set(false);
        }
      });
    }
  }
  
  confirmarEliminar(p: Propietario): void {
    this.eliminarTarget.set(p);
  }

  eliminar(): void {
    const target = this.eliminarTarget();
    if (!target) return;
    this.guardando.set(true);
    this.svc.eliminarPropietario(
      target.identificacion,
      target.apartamento,
      target.piso,
      target.edificio
    ).subscribe({
      next: () => {
        this.toast.success('Propietario eliminado.');
        this.eliminarTarget.set(null);
        this.guardando.set(false);
      },
      error: () => {
        this.toast.error('Error al eliminar el propietario.');
        this.guardando.set(false);
      }
    });
  }
  

  /*
  eliminar(): void {
    const target = this.eliminarTarget();
    if (!target) return;
    this.guardando.set(true);
    this.svc.eliminarPropietario(target.identificacion).subscribe({
      next: () => {
        this.toast.success('Propietario eliminado.');
        this.eliminarTarget.set(null);
        this.guardando.set(false);
      },
      error: () => {
        this.toast.error('Error al eliminar el propietario.');
        this.guardando.set(false);
      }
    });
  }
  */
}