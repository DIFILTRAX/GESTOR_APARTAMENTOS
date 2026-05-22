import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as ExcelJS from 'exceljs';
import { PaymentService } from '../../../core/services/payment.service';
import { PropiedadesService } from '../../../core/services/propiedades.service';
import { ToastService } from '../../../core/services/toast.service';
import { Pago } from '../../../core/models/models';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">

      <!-- CABECERA -->
      <section class="head">
        <div>
          <div class="kicker">Módulo financiero</div>
          <h2>Gestión de Pagos</h2>
        </div>
        <button class="btn btn-primary" (click)="abrirCrear()">+ Nuevo pago</button>
      </section>

      <!-- KPIs -->
      <div class="kpis">
        <div class="kpi">
          <div class="kpi-label">Total</div>
          <div class="kpi-value">{{ stats().total }}</div>
        </div>
        <div class="kpi kpi-green">
          <div class="kpi-label">Pagados</div>
          <div class="kpi-value">{{ stats().pagados }}</div>
          <div class="kpi-sub">{{ pSvc.formatCurrency(stats().totalRecaudado) }}</div>
        </div>
        <div class="kpi kpi-amber">
          <div class="kpi-label">Pendientes</div>
          <div class="kpi-value">{{ stats().pendientes }}</div>
        </div>
        <div class="kpi kpi-red">
          <div class="kpi-label">Vencidos</div>
          <div class="kpi-value">{{ stats().vencidos }}</div>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="toolbar">
        <input class="search" [(ngModel)]="busqueda"
               placeholder="Buscar por descripción o apartamento..." />
        <select class="filter" [(ngModel)]="filtroEstado">
          <option value="">Todos los estados</option>
          @for (e of pSvc.estados(); track e.id_estado_pago) {
            <option [value]="e.id_estado_pago">{{ e.nombre }}</option>
          }
        </select>
        <select class="filter" [(ngModel)]="filtroTipo">
          <option value="">Todos los tipos</option>
          @for (t of pSvc.tipos(); track t.id_tipo_pago) {
            <option [value]="t.id_tipo_pago">{{ t.nombre }}</option>
          }
        </select>
        <button class="btn btn-export" type="button"
                (click)="exportarExcel()"
                [disabled]="exportandoExcel()">
          {{ exportandoExcel() ? 'Exportando...' : '📊 Exportar Excel' }}
        </button>
        <span class="count">{{ filtrados().length }} registros</span>
      </div>

      <!-- TABLA -->
      <div class="table-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tipo</th>
              <th>Apartamento</th>
              <th>Edificio</th>
              <th>Valor</th>
              <th>Fecha pago</th>
              <th>Fecha límite</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (p of filtrados(); track p.id_pago) {
              <tr>
                <td class="mono">{{ p.id_pago }}</td>
                <td>{{ p.tipo_pago_nombre ?? p.tipo_pago }}</td>
                <td class="bold">Apto {{ p.apartamento }} · P{{ p.piso }}</td>
                <td>{{ p.edificio_nombre ?? p.edificio }}</td>
                <td class="bold">{{ pSvc.formatCurrency(p.valor) }}</td>
                <td>{{ p.fecha_pago }}</td>
                <td>{{ p.fecha_limite }}</td>
                <td>
                  <span class="badge" [class]="pSvc.getBadgeClass(p.estado_pago_nombre ?? '')">
                    {{ p.estado_pago_nombre ?? p.estado_pago }}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <button class="btn btn-sm btn-ghost" (click)="abrirEditar(p)">Editar</button>
                    <button class="btn btn-sm btn-danger" (click)="confirmarEliminar(p)">Eliminar</button>
                  </div>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="9" class="empty">No hay pagos registrados.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- MODAL CREAR / EDITAR -->
      @if (modalAbierto()) {
        <div class="backdrop" (click)="cerrarModal()">
          <div class="modal modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h3>{{ modoEditar() ? 'Editar pago' : 'Nuevo pago' }}</h3>
              <button class="close" (click)="cerrarModal()">✕</button>
            </div>
            <div class="modal-body grid2">

              <div class="field">
                <label>Tipo de pago *</label>
                <select [(ngModel)]="form.tipo_pago">
                  <option [ngValue]="undefined">Seleccionar...</option>
                  @for (t of pSvc.tipos(); track t.id_tipo_pago) {
                    <option [value]="t.id_tipo_pago">{{ t.nombre }}</option>
                  }
                </select>
              </div>

              <div class="field">
                <label>Estado *</label>
                <select [(ngModel)]="form.estado_pago">
                  <option [ngValue]="undefined">Seleccionar...</option>
                  @for (e of pSvc.estados(); track e.id_estado_pago) {
                    <option [value]="e.id_estado_pago">{{ e.nombre }}</option>
                  }
                </select>
              </div>

              <div class="field">
                <label>Valor *</label>
                <input [(ngModel)]="form.valor" type="number" min="0"
                       placeholder="Ej: 320000" />
              </div>

              <div class="field">
                <label>Fecha de pago *</label>
                <input [(ngModel)]="form.fecha_pago" type="date" />
              </div>

              <div class="field">
                <label>Fecha límite *</label>
                <input [(ngModel)]="form.fecha_limite" type="date" />
              </div>

              <div class="field">
                <label>Edificio *</label>
                <select [(ngModel)]="form.edificio" (ngModelChange)="onEdificioChange()">
                  <option value="">Seleccionar...</option>
                  @for (e of propSvc.edificios(); track e.id_edificio) {
                    <option [value]="e.id_edificio">{{ e.nombre }}</option>
                  }
                </select>
              </div>

              <div class="field">
                <label>Piso *</label>
                <select [(ngModel)]="form.piso" (ngModelChange)="onPisoChange()">
                  <option [ngValue]="undefined">Seleccionar...</option>
                  @for (p of pisosDelEdificio(); track p.id_piso) {
                    <option [ngValue]="p.id_piso">Piso {{ p.id_piso }}</option>
                  }
                </select>
              </div>

              <div class="field">
                <label>Apartamento *</label>
                <select [(ngModel)]="form.apartamento">
                  <option [ngValue]="undefined">Seleccionar...</option>
                  @for (a of apartamentosDelPiso(); track a.id_apartamento) {
                    <option [ngValue]="a.id_apartamento">Apto {{ a.id_apartamento }}</option>
                  }
                </select>
              </div>

              <div class="field full">
                <label>Descripción *</label>
                <textarea [(ngModel)]="form.descripcion" rows="3"
                          placeholder="Ej: Cuota de administración febrero 2025">
                </textarea>
              </div>

            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" (click)="cerrarModal()">Cancelar</button>
              <button class="btn btn-primary"
                      [disabled]="guardando()"
                      (click)="guardar()">
                {{ guardando() ? 'Guardando...' : (modoEditar() ? 'Guardar cambios' : 'Crear pago') }}
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
              <p>¿Eliminar el pago <strong>#{{ eliminarTarget()!.id_pago }}</strong>
                 por <strong>{{ pSvc.formatCurrency(eliminarTarget()!.valor) }}</strong>?</p>
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

    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .kpi { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 16px; }
    .kpi-green { background: #f0fdf4; border-color: #86efac; }
    .kpi-amber { background: #fffbeb; border-color: #fcd34d; }
    .kpi-red   { background: #fef2f2; border-color: #fca5a5; }
    .kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; font-weight: 700; }
    .kpi-value { font-size: 28px; font-weight: 800; color: #111827; margin-top: 6px; }
    .kpi-sub   { font-size: 11px; color: #6b7280; margin-top: 2px; }

    .toolbar {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 14px;
    }
    .search { flex: 1; min-width: 200px; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; }
    .search:focus { border-color: #0f4a33; }
    .filter { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; background: #fff; }
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
    .btn-export { background: #1d4ed8; color: #fff; border: none; }
    .btn-export:hover:not(:disabled) { background: #1e40af; }
    .btn-sm { padding: 6px 12px; font-size: 12px; }

    .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(2px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .modal { background: #fff; border-radius: 14px; width: min(480px, 100%); box-shadow: 0 24px 60px rgba(0,0,0,.2); display: grid; overflow: hidden; }
    .modal-sm { width: min(360px, 100%); }
    .modal-lg { width: min(700px, 100%); }
    .modal-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
    .modal-head h3 { margin: 0; font-size: 17px; color: #111827; }
    .close { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; }
    .modal-body { padding: 20px; display: grid; gap: 14px; }
    .modal-body.grid2 { grid-template-columns: 1fr 1fr; }
    .modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid #e5e7eb; background: #f9fafb; }

    .field { display: flex; flex-direction: column; gap: 5px; }
    .field.full { grid-column: 1 / -1; }
    .field label { font-size: 13px; font-weight: 600; color: #374151; }
    .field input, .field select, .field textarea { border: 1px solid #d1d5db; border-radius: 8px; padding: 9px 12px; font-size: 14px; outline: none; background: #fff; font-family: inherit; }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: #0f4a33; }
    .field textarea { resize: vertical; }

    .warn-text { color: #dc2626; font-size: 13px; margin: 4px 0 0; }
    p { margin: 0; font-size: 14px; color: #374151; line-height: 1.5; }

    @media (max-width: 768px) {
      .kpis { grid-template-columns: repeat(2, 1fr); }
      .modal-body.grid2 { grid-template-columns: 1fr; }
    }
  `]
})
export class PagosComponent implements OnInit {
  pSvc    = inject(PaymentService);
  propSvc = inject(PropiedadesService);
  private toast = inject(ToastService);

  exportandoExcel = signal(false);
  busqueda        = signal('');
  filtroEstado    = signal('');
  filtroTipo      = signal('');
  modalAbierto    = signal(false);
  modoEditar      = signal(false);
  guardando       = signal(false);
  eliminarTarget  = signal<Pago | null>(null);

  // ✅ Signals reactivos para evitar que computed use objetos no reactivos
  formEdificio = signal<string>('');
  formPiso     = signal<number | undefined>(undefined);

  form: Partial<Pago> = {};
  stats = this.pSvc.stats;

  filtrados = computed(() => {
    const q  = this.busqueda().toLowerCase();
    const fe = this.filtroEstado() ? Number(this.filtroEstado()) : null;
    const ft = this.filtroTipo()   ? Number(this.filtroTipo())   : null;
    return this.pSvc.pagos().filter(p =>
      (!fe || p.estado_pago === fe) &&
      (!ft || p.tipo_pago   === ft) &&
      (!q  ||
        (p.descripcion ?? '').toLowerCase().includes(q) ||
        String(p.apartamento).includes(q) ||
        (p.edificio_nombre ?? '').toLowerCase().includes(q)
      )
    );
  });

  // ✅ Usa signals reactivos + deduplicación por Set
  pisosDelEdificio = computed(() => {
    const edificio = this.formEdificio();
    if (!edificio) return [];
    const vistos = new Set<number>();
    return this.propSvc.pisos()
      .filter(p => String(p.edificio) === String(edificio))
      .filter(p => {
        if (vistos.has(p.id_piso)) return false;
        vistos.add(p.id_piso);
        return true;
      });
  });

  apartamentosDelPiso = computed(() => {
    const edificio = this.formEdificio();
    const piso     = this.formPiso();
    if (!edificio || !piso) return [];
    const vistos = new Set<number>();
    return this.propSvc.apartamentos()
      .filter(a =>
        String(a.edificio) === String(edificio) &&
        Number(a.piso)     === Number(piso)
      )
      .filter(a => {
        if (vistos.has(a.id_apartamento)) return false;
        vistos.add(a.id_apartamento);
        return true;
      });
  });

  ngOnInit(): void {
    this.pSvc.cargarPagos().subscribe({
      error: () => this.toast.error('Error al cargar pagos')
    });
    if (this.pSvc.tipos().length === 0) {
      this.pSvc.cargarTipos().subscribe();
    }
    if (this.pSvc.estados().length === 0) {
      this.pSvc.cargarEstados().subscribe();
    }
    if (this.propSvc.edificios().length === 0) {
      this.propSvc.cargarEdificios().subscribe();
    }
    if (this.propSvc.pisos().length === 0) {
      this.propSvc.cargarPisos().subscribe();
    }
    if (this.propSvc.apartamentos().length === 0) {
      this.propSvc.cargarApartamentos().subscribe();
    }
  }

  abrirCrear(): void {
    const hoy = new Date().toISOString().split('T')[0];
    this.form = {
      fecha_pago:   hoy,
      fecha_limite: hoy,
      valor:        0,
      descripcion:  '',
      tipo_pago:    undefined,
      estado_pago:  undefined,
      edificio:     '',
      piso:         undefined,
      apartamento:  undefined,
    };
    this.formEdificio.set('');
    this.formPiso.set(undefined);
    this.modoEditar.set(false);
    this.modalAbierto.set(true);
  }

  abrirEditar(p: Pago): void {
    this.form = { ...p };
    this.formEdificio.set(String(p.edificio ?? ''));
    this.formPiso.set(p.piso);
    this.modoEditar.set(true);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.form = {};
    this.formEdificio.set('');
    this.formPiso.set(undefined);
  }

  onEdificioChange(): void {
    this.formEdificio.set(this.form.edificio ?? '');
    this.formPiso.set(undefined);
    this.form.piso        = undefined;
    this.form.apartamento = undefined;
  }

  onPisoChange(): void {
    this.formPiso.set(this.form.piso);
    this.form.apartamento = undefined;
  }

  guardar(): void {
    if (!this.form.tipo_pago    || !this.form.estado_pago ||
        !this.form.valor        || !this.form.fecha_pago  ||
        !this.form.fecha_limite || !this.form.edificio    ||
        !this.form.piso         || !this.form.apartamento ||
        !this.form.descripcion) {
      this.toast.warn('Completa todos los campos obligatorios.');
      return;
    }
    this.guardando.set(true);

    if (this.modoEditar()) {
      this.pSvc.actualizarPago(this.form.id_pago!, this.form).subscribe({
        next: () => {
          this.toast.success('Pago actualizado correctamente.');
          this.cerrarModal();
          this.guardando.set(false);
        },
        error: () => {
          this.toast.error('Error al actualizar el pago.');
          this.guardando.set(false);
        }
      });
    } else {
      this.pSvc.crearPago(this.form).subscribe({
        next: () => {
          this.toast.success('Pago creado correctamente.');
          this.cerrarModal();
          this.guardando.set(false);
        },
        error: (err) => {
          const msg = err?.error?.error || err?.error?.non_field_errors?.[0] || 'Error al crear el pago.';
          this.toast.error(msg);
          this.guardando.set(false);
        }
      });
    }
  }

  confirmarEliminar(p: Pago): void {
    this.eliminarTarget.set(p);
  }

  eliminar(): void {
    const target = this.eliminarTarget();
    if (!target) return;
    this.guardando.set(true);
    this.pSvc.eliminarPago(target.id_pago).subscribe({
      next: () => {
        this.toast.success('Pago eliminado.');
        this.eliminarTarget.set(null);
        this.guardando.set(false);
      },
      error: () => {
        this.toast.error('Error al eliminar el pago.');
        this.guardando.set(false);
      }
    });
  }

  // ── EXCEL EXPORT ──────────────────────────────────────
  async exportarExcel(): Promise<void> {
    const pagos       = this.filtrados();
    const sinRegistros = pagos.length === 0;
    this.exportandoExcel.set(true);

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator  = 'F&L Aliados con Propiedad';
      workbook.created  = new Date();
      workbook.modified = new Date();

      // ── Hoja resumen ──
      const resumenMap = new Map<string, {
        apartamento: number; piso: number; edificio: string;
        totalRegistros: number; pagados: number;
        pendientes: number; vencidos: number; valorTotal: number;
      }>();

      for (const pago of pagos) {
        const key = `${pago.edificio}|${pago.piso}|${pago.apartamento}`;
        if (!resumenMap.has(key)) {
          resumenMap.set(key, {
            apartamento: pago.apartamento,
            piso: pago.piso,
            edificio: pago.edificio_nombre ?? String(pago.edificio),
            totalRegistros: 0, pagados: 0, pendientes: 0,
            vencidos: 0, valorTotal: 0,
          });
        }
        const r = resumenMap.get(key)!;
        r.totalRegistros += 1;
        r.valorTotal     += Number(pago.valor || 0);
        const estado = pago.estado_pago_nombre ?? '';
        if (estado === 'Pagado')    r.pagados    += 1;
        if (estado === 'Pendiente') r.pendientes += 1;
        if (estado === 'Vencido')   r.vencidos   += 1;
      }

      const resumenSheet = workbook.addWorksheet('Multas por apartamento');
      resumenSheet.mergeCells('A1:H1');
      resumenSheet.getCell('A1').value = 'F&L Aliados con Propiedad';
      resumenSheet.getCell('A1').font  = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
      resumenSheet.getCell('A1').fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F4A33' } };
      resumenSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

      resumenSheet.mergeCells('A2:H2');
      resumenSheet.getCell('A2').value = 'Resumen de multas / cartera por apartamento';
      resumenSheet.getCell('A2').font  = { bold: true, size: 12, color: { argb: 'C9A84C' } };
      resumenSheet.getCell('A2').alignment = { horizontal: 'center' };

      resumenSheet.addRow(['Apartamento', 'Piso', 'Edificio', 'Registros', 'Pagados', 'Pendientes', 'Vencidos', 'Valor total']);
      resumenSheet.getRow(3).eachCell(cell => {
        cell.font      = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: '174E39' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border    = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      if (sinRegistros) {
        resumenSheet.mergeCells('A4:H4');
        resumenSheet.getCell('A4').value = 'No hay registros para exportar.';
        resumenSheet.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };
        resumenSheet.getCell('A4').font = { italic: true, color: { argb: '6B7280' } };
      } else {
        [...resumenMap.values()].forEach(item => {
          resumenSheet.addRow([
            `Apto ${item.apartamento}`, item.piso, item.edificio,
            item.totalRegistros, item.pagados, item.pendientes,
            item.vencidos, item.valorTotal,
          ]);
        });
      }

      resumenSheet.columns = [
        { width: 14 }, { width: 10 }, { width: 24 }, { width: 12 },
        { width: 10 }, { width: 12 }, { width: 10 }, { width: 16 },
      ];
      resumenSheet.getColumn(8).numFmt = '$#,##0';
      resumenSheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 3) return;
        row.eachCell(cell => {
          cell.border    = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
      });

      // ── Hoja detalle ──
      const detalleSheet = workbook.addWorksheet('Detalle multas');
      detalleSheet.addRow([
        'ID', 'Tipo', 'Apartamento', 'Piso', 'Edificio',
        'Descripción', 'Valor', 'Fecha pago', 'Fecha límite', 'Estado'
      ]);
      detalleSheet.getRow(1).eachCell(cell => {
        cell.font      = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F4A33' } };
        cell.alignment = { horizontal: 'center' };
      });

      if (sinRegistros) {
        detalleSheet.mergeCells('A2:J2');
        detalleSheet.getCell('A2').value = 'No hay registros para mostrar.';
        detalleSheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
        detalleSheet.getCell('A2').font = { italic: true, color: { argb: '6B7280' } };
      } else {
        pagos.forEach(pago => {
          detalleSheet.addRow([
            pago.id_pago,
            pago.tipo_pago_nombre ?? pago.tipo_pago,
            pago.apartamento,
            pago.piso,
            pago.edificio_nombre ?? pago.edificio,
            pago.descripcion,
            Number(pago.valor || 0),
            pago.fecha_pago,
            pago.fecha_limite,
            pago.estado_pago_nombre ?? pago.estado_pago,
          ]);
        });
      }

      detalleSheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        row.eachCell(cell => {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
      });
      detalleSheet.columns = [
        { width: 10 }, { width: 18 }, { width: 14 }, { width: 10 }, { width: 22 },
        { width: 34 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },
      ];
      detalleSheet.getColumn(7).numFmt = '$#,##0';

      // ── Descarga ──
      const buffer = await workbook.xlsx.writeBuffer();
      const blob   = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `pagos_fyl_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      this.toast.success(
        sinRegistros
          ? 'Excel generado (sin registros activos en el filtro).'
          : `Excel exportado — ${pagos.length} registros.`
      );
    } catch (err) {
      console.error(err);
      this.toast.error('No se pudo generar el Excel.');
    } finally {
      this.exportandoExcel.set(false);
    }
  }
}