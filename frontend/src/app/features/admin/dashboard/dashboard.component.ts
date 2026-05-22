import { Component, inject, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaymentService } from '../../../core/services/payment.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="dash-page">
      <section class="hero-card">
        <div class="hero-copy">
          <div class="hero-kicker">Tablero ejecutivo</div>
          <h2>Controla cartera, recaudo y actividad desde una sola vista.</h2>
          <p>
            Resume la operación diaria de la copropiedad con indicadores accionables,
            alertas activas y los movimientos más recientes.
          </p>
          <div class="hero-actions">
            <a class="btn btn-primary" routerLink="/admin/crear-pago">Registrar pago</a>
            <a class="btn btn-ghost" routerLink="/admin/pagos">Ver cartera</a>
          </div>
        </div>

        <div class="hero-metrics">
          @for (item of metricas(); track item.label) {
            <article class="metric-card"
              [class.total]="item.clase === 'total'"
              [class.green]="item.clase === 'green'"
              [class.amber]="item.clase === 'amber'"
              [class.red]="item.clase === 'red'">
              <div class="metric-label">{{ item.label }}</div>
              <div class="metric-value">{{ item.value }}</div>
              <div class="metric-sub">{{ item.sub }}</div>
            </article>
          }
        </div>
      </section>

      <div class="insight-grid">
        <article class="panel panel-wide">
          <div class="panel-head">
            <div>
              <div class="panel-kicker">Distribución</div>
              <h3>Estado de los pagos</h3>
            </div>
            <span class="pill">{{ stats().total }} registros</span>
          </div>

          <div class="state-list">
            @for (item of estadoCards(); track item.label) {
              <div class="state-row">
                <div class="state-top">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
                <div class="state-bar">
                  <span class="state-fill"
                    [class.green]="item.clase === 'green'"
                    [class.amber]="item.clase === 'amber'"
                    [class.red]="item.clase === 'red'"
                    [style.width.%]="item.porcentaje">
                  </span>
                </div>
                <div class="state-foot">{{ item.sub }}</div>
              </div>
            }
          </div>
        </article>

        <article class="panel">
          <div class="panel-head">
            <div>
              <div class="panel-kicker panel-kicker-dark">Alertas</div>
              <h3>Acciones inmediatas</h3>
            </div>
          </div>

          @if (alertas().length) {
            <div class="alert-list">
              @for (alerta of alertas(); track alerta.titulo) {
                <div class="alert-item"
                  [class.warning]="alerta.clase === 'warning'"
                  [class.danger]="alerta.clase === 'danger'">
                  <div class="alert-title">{{ alerta.titulo }}</div>
                  <div class="alert-text">{{ alerta.texto }}</div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-copy">No hay alertas activas por ahora.</div>
          }
        </article>

        <article class="panel">
          <div class="panel-head">
            <div>
              <div class="panel-kicker panel-kicker-dark">Recaudo</div>
              <h3>Por edificio</h3>
            </div>
          </div>

          <div class="building-list">
            @for (item of edificios(); track item.nombre) {
              <div class="building-item">
                <div class="building-top">
                  <span>{{ item.nombre }}</span>
                  <strong>{{ pSvc.formatCurrency(item.valor) }}</strong>
                </div>
                <div class="building-bar">
                  <span class="building-fill" [style.width.%]="item.porcentaje"></span>
                </div>
                <div class="building-foot">{{ item.cantidad }} pagos</div>
              </div>
            }
          </div>
        </article>

        <article class="panel panel-wide">
          <div class="panel-head">
            <div>
              <div class="panel-kicker panel-kicker-dark">Actividad reciente</div>
              <h3>Últimos movimientos</h3>
            </div>
            <span class="pill">{{ recientes().length }} visibles</span>
          </div>

          <div class="recent-list">
            @for (p of recientes(); track p.id_pago) {
              <div class="recent-row">
                <div class="recent-main">
                  <strong>#{{ p.id_pago }} · {{ p.tipo_pago_nombre ?? 'Pago' }}</strong>
                  <span>Apto {{ p.apartamento }} · P{{ p.piso }} · {{ p.edificio_nombre ?? p.edificio }}</span>
                </div>
                <div class="recent-meta">
                  <span>{{ p.fecha_pago }}</span>
                  <strong>{{ pSvc.formatCurrency(p.valor) }}</strong>
                  <span class="badge"
                    [class.badge-green]="(p.estado_pago_nombre ?? '') === 'Pagado'"
                    [class.badge-amber]="(p.estado_pago_nombre ?? '') === 'Pendiente'"
                    [class.badge-red]="(p.estado_pago_nombre ?? '') === 'Vencido'">
                    {{ p.estado_pago_nombre ?? 'Sin estado' }}
                  </span>
                </div>
              </div>
            }
          </div>
        </article>
      </div>
    </div>
  `,
  styles: [`
    .dash-page { display: grid; gap: 16px; color: #0f172a; }

    .hero-card {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
      gap: 18px; padding: 22px; border-radius: 20px;
      background:
        radial-gradient(circle at top right, rgba(201,168,76,0.12), transparent 28%),
        linear-gradient(135deg, #0a2f20 0%, #0f4a33 55%, #124d38 100%);
      color: #fff;
      box-shadow: 0 18px 46px rgba(10,47,32,0.16);
    }

    .hero-copy h2 {
      margin: 8px 0 10px;
      font-size: clamp(26px, 3vw, 38px);
      line-height: 1.05;
      letter-spacing: -0.03em;
    }
    .hero-copy p {
      margin: 0; max-width: 58ch;
      color: rgba(255,255,255,0.76);
      line-height: 1.65; font-size: 14px;
    }
    .hero-kicker {
      font-size: 10px; text-transform: uppercase;
      letter-spacing: 0.12em; color: rgba(255,255,255,0.64); font-weight: 800;
    }
    .panel-kicker {
      font-size: 10px; text-transform: uppercase;
      letter-spacing: 0.12em; color: #0f4a33; font-weight: 800;
    }
    .panel-kicker-dark { color: #0f4a33; }

    .hero-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }

    .hero-metrics {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px; align-content: start;
    }

    .metric-card {
      border-radius: 16px; padding: 16px;
      background: rgba(255,255,255,0.09);
      border: 1px solid rgba(255,255,255,0.12);
      backdrop-filter: blur(10px);
    }
    .metric-card.total  { background: rgba(255,255,255,0.12); }
    .metric-card.green  { background: rgba(34,197,94,0.14);  border-color: rgba(34,197,94,0.22); }
    .metric-card.amber  { background: rgba(251,191,36,0.15); border-color: rgba(251,191,36,0.22); }
    .metric-card.red    { background: rgba(239,68,68,0.16);  border-color: rgba(239,68,68,0.22); }

    .metric-label {
      font-size: 11px; text-transform: uppercase;
      letter-spacing: 0.08em; color: rgba(255,255,255,0.68); font-weight: 700;
    }
    .metric-value { margin-top: 8px; font-size: 30px; font-weight: 900; line-height: 1; }
    .metric-sub   { margin-top: 5px; font-size: 12px; color: rgba(255,255,255,0.74); }

    .insight-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }
    .panel {
      border-radius: 18px; background: #fff;
      border: 1px solid #e5e7eb;
      box-shadow: 0 14px 30px rgba(15,23,42,0.05);
      padding: 18px;
    }
    .panel-wide { grid-column: 1 / -1; }

    .panel-head {
      display: flex; justify-content: space-between;
      align-items: flex-start; gap: 12px; margin-bottom: 16px;
    }
    .panel-head h3 { margin: 6px 0 0; font-size: 18px; color: #0f172a; }

    .pill {
      display: inline-flex; align-items: center;
      border-radius: 999px; padding: 4px 10px;
      font-size: 11px; font-weight: 700;
      background: #f3f4f6; color: #6b7280; white-space: nowrap;
    }

    .state-list, .building-list, .recent-list, .alert-list { display: grid; gap: 12px; }
    .state-row, .building-item { display: grid; gap: 6px; }

    .state-top, .building-top {
      display: flex; justify-content: space-between;
      gap: 10px; font-size: 13px; color: #111827; font-weight: 700;
    }

    .state-bar, .building-bar {
      width: 100%; height: 10px;
      background: #eef2f7; border-radius: 999px; overflow: hidden;
    }
    .state-fill, .building-fill {
      display: block; height: 100%; border-radius: inherit;
      background: linear-gradient(90deg, #0f4a33, #c9a84c);
    }
    .state-fill.green { background: linear-gradient(90deg, #15803d, #22c55e); }
    .state-fill.amber { background: linear-gradient(90deg, #d97706, #f59e0b); }
    .state-fill.red   { background: linear-gradient(90deg, #dc2626, #ef4444); }

    .state-foot, .building-foot { font-size: 12px; color: #6b7280; }

    .alert-item {
      border-radius: 14px; padding: 14px 14px 14px 16px;
      border: 1px solid #e5e7eb; background: #f9fafb;
    }
    .alert-item.warning { background: #fffbeb; border-color: #fde68a; }
    .alert-item.danger  { background: #fef2f2; border-color: #fecaca; }
    .alert-title { font-size: 13px; font-weight: 800; color: #111827; margin-bottom: 4px; }
    .alert-text  { font-size: 13px; line-height: 1.5; color: #4b5563; }
    .empty-copy  { padding: 10px 0 2px; color: #6b7280; font-size: 13px; }

    .recent-row {
      display: flex; justify-content: space-between;
      gap: 12px; align-items: center;
      padding: 14px 16px; border-radius: 14px;
      background: #f9fafb; border: 1px solid #eef2f7;
    }
    .recent-main { display: grid; gap: 4px; min-width: 0; }
    .recent-main strong { font-size: 14px; color: #0f172a; }
    .recent-main span   { font-size: 12px; color: #6b7280; }
    .recent-meta {
      display: flex; flex-direction: column;
      align-items: flex-end; gap: 4px;
      font-size: 12px; color: #6b7280; white-space: nowrap;
    }

    .badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 800; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-amber { background: #fef9c3; color: #854d0e; }
    .badge-red   { background: #fee2e2; color: #991b1b; }

    .btn {
      display: inline-flex; align-items: center;
      border-radius: 10px; padding: 10px 16px;
      font-size: 13px; font-weight: 700; cursor: pointer;
      text-decoration: none; border: 1px solid transparent;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }
    .btn:hover { transform: translateY(-1px); }
    .btn-primary { background: #c9a84c; color: #0a2f20; }
    .btn-ghost   { background: rgba(255,255,255,0.08); color: #fff; border-color: rgba(255,255,255,0.24); }

    @media (max-width: 960px) {
      .hero-card, .insight-grid { grid-template-columns: 1fr; }
      .panel-wide { grid-column: auto; }
    }
    @media (max-width: 640px) {
      .hero-card { padding: 18px; }
      .hero-metrics { grid-template-columns: 1fr; }
      .recent-row { align-items: flex-start; flex-direction: column; }
      .recent-meta { align-items: flex-start; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  pSvc  = inject(PaymentService);
  stats = this.pSvc.stats;

  ngOnInit(): void {
    this.pSvc.cargarPagos().subscribe();
  }

  metricas = computed(() => {
    const r = this.stats();
    return [
      { label: 'Total pagos',  value: r.total,     sub: 'Registro consolidado del sistema', clase: 'total' },
      { label: 'Pagados',      value: r.pagados,    sub: this.pSvc.formatCurrency(r.totalRecaudado), clase: 'green' },
      { label: 'Pendientes',   value: r.pendientes, sub: 'Requieren seguimiento',            clase: 'amber' },
      { label: 'Vencidos',     value: r.vencidos,   sub: 'Casos críticos a priorizar',       clase: 'red'   },
    ];
  });

  estadoCards = computed(() => {
    const r = this.stats();
    const total = Math.max(r.total, 1);
    return [
      { label: 'Pagados',    value: r.pagados,    porcentaje: Math.round((r.pagados    / total) * 100), sub: `${Math.round((r.pagados    / total) * 100)}% del total`, clase: 'green' },
      { label: 'Pendientes', value: r.pendientes, porcentaje: Math.round((r.pendientes / total) * 100), sub: `${Math.round((r.pendientes / total) * 100)}% del total`, clase: 'amber' },
      { label: 'Vencidos',   value: r.vencidos,   porcentaje: Math.round((r.vencidos   / total) * 100), sub: `${Math.round((r.vencidos   / total) * 100)}% del total`, clase: 'red'   },
    ];
  });

  edificios = computed(() => {
    const acumulado = new Map<string, { nombre: string; cantidad: number; valor: number }>();
    for (const pago of this.pSvc.pagos()) {
      const nombre = pago.edificio_nombre ?? pago.edificio ?? 'Sin edificio';
      const actual = acumulado.get(nombre) ?? { nombre, cantidad: 0, valor: 0 };
      actual.cantidad += 1;
      actual.valor += Number(pago.valor) || 0;
      acumulado.set(nombre, actual);
    }
    const ordenados = [...acumulado.values()].sort((a, b) => b.valor - a.valor).slice(0, 4);
    const maximo = Math.max(...ordenados.map(i => i.valor), 1);
    return ordenados.map(i => ({ ...i, porcentaje: Math.round((i.valor / maximo) * 100) }));
  });

  recientes = computed(() =>
    [...this.pSvc.pagos()].sort((a, b) => b.id_pago - a.id_pago).slice(0, 6)
  );

  alertas = computed(() => {
    const r = this.stats();
    const lista: Array<{ titulo: string; texto: string; clase: string }> = [];
    if (r.vencidos > 0)   lista.push({ titulo: 'Pagos vencidos',   texto: `${r.vencidos} pagos requieren contacto inmediato con los propietarios.`,                           clase: 'danger'  });
    if (r.pendientes > 0) lista.push({ titulo: 'Pagos pendientes', texto: `${r.pendientes} pagos siguen abiertos y pueden disparar recordatorios automáticos.`,               clase: 'warning' });
    if (r.total === 0)    lista.push({ titulo: 'Sin información',   texto: 'Aún no hay pagos sincronizados. Carga la cartera para activar el tablero.',                       clase: 'warning' });
    return lista;
  });
}