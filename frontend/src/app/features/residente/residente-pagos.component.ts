// residente-pagos.component.ts
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import { Pago } from '../../core/models/models';

@Component({
  selector: 'app-residente-pagos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="res-page">

      <!-- NAV -->
      <nav class="res-nav">
        <div class="nav-brand">
          <img class="nav-logo" src="/assets/fyl.png" alt="F&L Aliados con Propiedad" />
          <div>
            <div class="n1">FYL ALIADOS EN PROPIEDAD</div>
            <div class="n2">Mis pagos</div>
          </div>
        </div>
        <div class="nav-right">
          <span class="greeting">Hola, <strong>{{ auth.user()?.nombre }}</strong></span>
          <button class="btn-out" (click)="goToPortfolio()">← Volver</button>
          <button class="btn-out btn-red" (click)="auth.logout()">⏻ Salir</button>
        </div>
      </nav>

      <div class="res-content">

        <!-- TÍTULO -->
        <div class="section-head" id="historial">
          <div class="section-title">Historial de pagos</div>
          <span class="count-pill">{{ misPagos().length }} registros</span>
        </div>

        <!-- SUMMARY CARDS -->
        <div class="summary-grid">
          @for (item of summaryCards(); track item.label) {
            <article class="summary-card"
              [class.tone-green]="item.tone === 'green'"
              [class.tone-amber]="item.tone === 'amber'"
              [class.tone-blue]="item.tone === 'blue'">
              <div class="summary-label">{{ item.label }}</div>
              <div class="summary-value">{{ item.value }}</div>
              <div class="summary-sub">{{ item.sub }}</div>
            </article>
          }
        </div>

        <!-- PAGO PRIORITARIO -->
        @if (pagoPrioritario()) {
          <div class="priority-card"
            [class.danger]="pagoPrioritario()!.estado_pago_nombre === 'Vencido'"
            [class.warning]="pagoPrioritario()!.estado_pago_nombre === 'Pendiente'">
            <div>
              <div class="priority-kicker">Pago prioritario</div>
              <div class="priority-title">#{{ pagoPrioritario()!.id_pago }} · {{ pagoPrioritario()!.tipo_pago_nombre ?? 'Pago' }}</div>
              <div class="priority-sub">
                Vence {{ pagoPrioritario()!.fecha_limite }} · {{ paySvc.formatCurrency(pagoPrioritario()!.valor) }}
              </div>
            </div>
            <button class="btn-pay-priority" type="button" (click)="onPay(pagoPrioritario())">Pagar ahora</button>
          </div>
        }

        <!-- CARGANDO -->
        @if (cargando()) {
          <div class="loading">
            <div class="spinner"></div>
            <p>Cargando tus pagos...</p>
          </div>
        }

        <!-- SIN APARTAMENTO -->
        @else if (!auth.user()?.apartamento) {
          <div class="empty-state">
            <div class="empty-icon">🏠</div>
            <div class="empty-title">Sin apartamento asignado</div>
            <div class="empty-desc">Contacta al administrador para que asigne tu unidad.</div>
          </div>
        }

        <!-- SIN PAGOS -->
        @else if (misPagos().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <div class="empty-title">No tienes pagos registrados</div>
            <div class="empty-desc">Cuando el administrador registre pagos para tu apartamento aparecerán aquí.</div>
          </div>
        }

        <!-- LISTA DE PAGOS -->
        @else {
          <div class="pagos-list">
            @for (p of misPagosOrdenados(); track p.id_pago) {
              <div class="pago-card"
                [class.pendiente]="p.estado_pago_nombre === 'Pendiente'"
                [class.vencido]="p.estado_pago_nombre === 'Vencido'">
                <div class="pago-left">
                  <div class="pago-dot" [class]="dotClass(p.estado_pago_nombre ?? '')"></div>
                </div>
                <div class="pago-info">
                  <div class="pago-tipo">{{ p.tipo_pago_nombre ?? 'Pago #' + p.id_pago }}</div>
                  <div class="pago-desc">{{ p.descripcion }}</div>
                  <div class="pago-meta">Vence: {{ p.fecha_limite }} · Pago: {{ p.fecha_pago }}</div>
                  <span class="badge" [class]="badgeClass(p.estado_pago_nombre ?? '')">
                    {{ badgeLabel(p.estado_pago_nombre ?? '') }}
                  </span>
                </div>
                <div class="pago-right">
                  <div class="pago-valor">{{ paySvc.formatCurrency(p.valor) }}</div>
                  @if (p.estado_pago_nombre === 'Pendiente' || p.estado_pago_nombre === 'Vencido') {
                    <button class="btn-pay" (click)="onPay(p)">💳 Pagar ahora</button>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- QR BANCOLOMBIA -->
        <div class="qr-pay-card">
          <div class="qr-pay-copy">
            <div class="qr-pay-kicker">Pago con Bancolombia</div>
            <h3>Escanea el QR para realizar tu pago</h3>
            <p>Este código está disponible solo para propietarios. Úsalo para pagar desde tu app bancaria.</p>
            <div class="qr-pay-note">Si el QR no se ve, contacta al administrador.</div>
          </div>
          <button class="qr-pay-frame qr-pay-button" type="button" (click)="abrirQr()" aria-label="Ampliar QR de Bancolombia">
            <img src="/assets/qr-bancolombia.png" alt="QR Bancolombia para pagos" />
          </button>
        </div>

        <!-- MODAL QR -->
        @if (qrExpandido()) {
          <div class="qr-modal-backdrop" (click)="cerrarQr()">
            <div class="qr-modal" (click)="$event.stopPropagation()">
              <div class="qr-modal-head">
                <button class="qr-modal-close" type="button" (click)="cerrarQr()">✕</button>
              </div>
              <div class="qr-modal-body">
                <img src="/assets/qr-bancolombia.png" alt="QR Bancolombia ampliado" />
              </div>
            </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .res-page {
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(201,168,76,0.10), transparent 22%),
        linear-gradient(180deg, #f4f7f4 0%, #eef2ee 100%);
      font-family: 'Inter', sans-serif;
    }

    .res-nav {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 12px; padding: 14px 24px;
      background: linear-gradient(135deg, rgba(10,47,32,0.98), rgba(15,74,51,0.98));
      color: #fff; position: sticky; top: 0; z-index: 10;
      box-shadow: 0 12px 28px rgba(10,47,32,0.16);
      backdrop-filter: blur(12px);
    }
    .nav-brand { display: flex; align-items: center; gap: 12px; }
    .nav-logo { width: 42px; height: 42px; object-fit: cover; border-radius: 12px; background: rgba(255,255,255,0.06); padding: 3px; }
    .n1 { font-size: 13px; font-weight: 800; color: #fff; }
    .n2 { font-size: 10px; color: rgba(255,255,255,0.6); }
    .nav-right { display: flex; align-items: center; gap: 10px; }
    .greeting { font-size: 13px; color: rgba(255,255,255,0.8); }
    .btn-out { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 8px; padding: 8px 14px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn-out:hover { background: rgba(255,255,255,0.2); }
    .btn-red:hover { background: rgba(220,38,38,0.4); }

    .res-content { max-width: 1120px; margin: 0 auto; padding: 24px 16px 40px; display: grid; gap: 20px; }

    .section-head { display: flex; align-items: center; justify-content: space-between; }
    .section-title { font-size: 18px; font-weight: 800; color: #111827; }
    .count-pill { background: #e5e7eb; border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 600; color: #6b7280; }

    .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .summary-card {
      background: rgba(255,255,255,0.9);
      border: 1px solid rgba(15,74,51,0.08);
      border-radius: 18px; padding: 16px 18px;
      box-shadow: 0 14px 35px rgba(15,23,42,0.05);
      position: relative; overflow: hidden;
    }
    .summary-card::after {
      content: ''; position: absolute; inset: auto -20px -24px auto;
      width: 92px; height: 92px; border-radius: 50%;
      background: radial-gradient(circle, rgba(201,168,76,0.14), transparent 72%);
      pointer-events: none;
    }
    .summary-card.tone-green { background: linear-gradient(180deg, #f0fdf4, #ffffff); border-color: rgba(34,197,94,0.18); }
    .summary-card.tone-amber { background: linear-gradient(180deg, #fffbeb, #ffffff); border-color: rgba(251,191,36,0.2); }
    .summary-card.tone-blue  { background: linear-gradient(180deg, #eff6ff, #ffffff); border-color: rgba(59,130,246,0.16); }
    .summary-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; font-weight: 800; }
    .summary-value { margin-top: 10px; font-size: 26px; line-height: 1.1; font-weight: 900; color: #0f172a; }
    .summary-sub { margin-top: 6px; font-size: 12px; color: #64748b; }

    .priority-card {
      border-radius: 16px; padding: 18px 20px;
      border: 1px solid #e5e7eb; background: #f9fafb;
      display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;
    }
    .priority-card.danger  { background: #fef2f2; border-color: #fecaca; }
    .priority-card.warning { background: #fffbeb; border-color: #fde68a; }
    .priority-kicker { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; font-weight: 700; margin-bottom: 4px; }
    .priority-title { font-size: 15px; font-weight: 800; color: #111827; margin-bottom: 4px; }
    .priority-sub { font-size: 13px; color: #6b7280; }
    .btn-pay-priority { background: #0f4a33; color: #fff; border: none; border-radius: 10px; padding: 11px 20px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; }
    .btn-pay-priority:hover { background: #0a2f20; }

    .loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; color: #6b7280; }
    .spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #0f4a33; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 48px 24px; background: rgba(255,255,255,0.82); border-radius: 18px; border: 1px solid rgba(15,74,51,0.08); box-shadow: 0 18px 40px rgba(15,23,42,0.05); }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-title { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 8px; }
    .empty-desc { font-size: 14px; color: #6b7280; }

    .pagos-list { display: grid; gap: 12px; }
    .pago-card { background: rgba(255,255,255,0.9); border: 1px solid rgba(15,74,51,0.08); border-radius: 18px; padding: 18px 20px; display: grid; grid-template-columns: auto 1fr auto; gap: 14px; align-items: start; transition: transform 0.15s, box-shadow 0.15s; box-shadow: 0 12px 30px rgba(15,23,42,0.04); }
    .pago-card:hover { box-shadow: 0 16px 34px rgba(15,23,42,0.08); transform: translateY(-1px); }
    .pago-card.pendiente { border-left: 4px solid #f59e0b; }
    .pago-card.vencido   { border-left: 4px solid #ef4444; }

    .pago-dot { width: 12px; height: 12px; border-radius: 50%; margin-top: 4px; }
    .dot-green { background: #22c55e; }
    .dot-amber { background: #f59e0b; }
    .dot-red   { background: #ef4444; }

    .pago-tipo  { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 3px; }
    .pago-desc  { font-size: 13px; color: #6b7280; margin-bottom: 6px; }
    .pago-meta  { font-size: 12px; color: #9ca3af; margin-bottom: 8px; }

    .badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 700; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-amber { background: #fef9c3; color: #854d0e; }
    .badge-red   { background: #fee2e2; color: #991b1b; }

    .pago-right { text-align: right; }
    .pago-valor { font-size: 18px; font-weight: 800; color: #0f4a33; margin-bottom: 8px; }
    .btn-pay { background: #0f4a33; color: #fff; border: none; border-radius: 8px; padding: 8px 14px; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }
    .btn-pay:hover { background: #0a2f20; }

    .qr-pay-card {
      background: linear-gradient(135deg, rgba(10,47,32,0.98), rgba(15,74,51,0.98));
      border: 1px solid rgba(201,168,76,0.18); border-radius: 22px; padding: 22px;
      display: grid; grid-template-columns: minmax(320px, 420px) minmax(260px, 320px);
      justify-content: center; gap: 18px; align-items: center;
      box-shadow: 0 18px 50px rgba(10,47,32,0.16);
    }
    .qr-pay-copy { max-width: 420px; }
    .qr-pay-kicker { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #c9a84c; font-weight: 800; }
    .qr-pay-copy h3 { margin: 6px 0 8px; font-size: 22px; line-height: 1.15; color: #fff; }
    .qr-pay-copy p { margin: 0; color: rgba(255,255,255,0.78); font-size: 14px; line-height: 1.6; max-width: 42ch; }
    .qr-pay-note { margin-top: 12px; font-size: 12px; color: rgba(255,255,255,0.58); }
    .qr-pay-frame { width: min(240px, 100%); aspect-ratio: 1/1; padding: 14px; border-radius: 18px; background: rgba(255,255,255,0.94); display: grid; place-items: center; justify-self: center; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.7); }
    .qr-pay-button { border: 0; cursor: zoom-in; transition: transform 0.15s ease, box-shadow 0.15s ease; }
    .qr-pay-button:hover { transform: translateY(-1px) scale(1.01); }
    .qr-pay-frame img { width: 100%; height: 100%; object-fit: contain; display: block; }

    .qr-modal-backdrop { position: fixed; inset: 0; z-index: 200; background: rgba(4,10,8,0.72); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 20px; }
    .qr-modal { width: min(96vw, 920px); border-radius: 30px; background: linear-gradient(180deg, #fbfcfb, #ffffff); box-shadow: 0 34px 110px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(201,168,76,0.22); border: 1px solid rgba(10,47,32,0.10); overflow: hidden; }
    .qr-modal-head { display: flex; align-items: start; justify-content: flex-end; padding: 18px 18px 0; background: linear-gradient(135deg, rgba(10,47,32,0.06), rgba(201,168,76,0.04)); }
    .qr-modal-close { border: 0; background: rgba(255,255,255,0.88); color: #0f172a; width: 42px; height: 42px; border-radius: 14px; cursor: pointer; font-size: 16px; box-shadow: 0 8px 24px rgba(15,23,42,0.10); }
    .qr-modal-close:hover { background: rgba(255,255,255,0.98); }
    .qr-modal-body { padding: 6px 28px 30px; display: grid; place-items: center; background: #fff; }
    .qr-modal-body img { width: min(91vw, 820px); height: auto; aspect-ratio: 1/1; object-fit: contain; border-radius: 26px; box-shadow: 0 24px 60px rgba(15,23,42,0.16), 0 0 0 1px rgba(201,168,76,0.18); background: #fff; }

    @media (max-width: 960px) {
      .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 600px) {
      .summary-grid { grid-template-columns: 1fr; }
      .qr-pay-card { grid-template-columns: 1fr; }
      .qr-pay-frame { width: min(280px, 100%); justify-self: center; }
      .section-head { align-items: flex-start; gap: 10px; flex-direction: column; }
      .pago-card { grid-template-columns: auto 1fr; }
      .pago-right { grid-column: 2; }
      .qr-modal { width: min(96vw, 680px); }
      .qr-modal-head { padding: 14px 14px 0; }
      .qr-modal-body { padding: 4px 16px 20px; }
    }
  `]
})
export class ResidentePagosComponent implements OnInit {
  auth   = inject(AuthService);
  paySvc = inject(PaymentService);
  router = inject(Router);

  cargando    = signal(true);
  qrExpandido = signal(false);

  // ✅ REQ 1: filtra pagos de TODOS los apartamentos del propietario
  misPagos = computed(() => {
    const user = this.auth.user();
    if (!user) return [];

    const pagos = this.paySvc.pagos();

    // Si tiene lista de apartamentos, filtra por todos
    if (user.apartamentos && user.apartamentos.length > 0) {
      return pagos.filter(p =>
        user.apartamentos!.some(apt =>
          p.apartamento === apt.apartamento &&
          p.piso        === apt.piso        &&
          String(p.edificio) === String(apt.edificio)
        )
      );
    }

    // Compatibilidad: si solo tiene el primer apartamento (datos básicos)
    if (!user.apartamento) return [];
    return pagos.filter(p =>
      p.apartamento === user.apartamento &&
      p.piso        === user.piso        &&
      String(p.edificio) === String(user.edificio)
    );
  });

  misPagosOrdenados = computed(() =>
    [...this.misPagos()].sort((a, b) => {
      const fa = new Date(a.fecha_limite).getTime() || 0;
      const fb = new Date(b.fecha_limite).getTime() || 0;
      return fa - fb || b.id_pago - a.id_pago;
    })
  );

  pagoPrioritario = computed(() =>
    this.misPagosOrdenados().find(p => p.estado_pago_nombre !== 'Pagado') ?? null
  );

  stats = computed(() => {
    const pagos = this.misPagos();
    return {
      total:      pagos.length,
      pagados:    pagos.filter(p => p.estado_pago_nombre === 'Pagado').length,
      pendientes: pagos.filter(p => p.estado_pago_nombre === 'Pendiente').length,
      vencidos:   pagos.filter(p => p.estado_pago_nombre === 'Vencido').length,
    };
  });

  resumen = computed(() => {
    const pagos = this.misPagos();
    const valorPagado = pagos
      .filter(p => p.estado_pago_nombre === 'Pagado')
      .reduce((t, p) => t + Number(p.valor || 0), 0);
    const valorPendiente = pagos
      .filter(p => p.estado_pago_nombre === 'Pendiente' || p.estado_pago_nombre === 'Vencido')
      .reduce((t, p) => t + Number(p.valor || 0), 0);
    return { valorPagado, valorPendiente, proximo: this.pagoPrioritario() };
  });

  summaryCards = computed(() => {
    const s = this.stats();
    const r = this.resumen();
    return [
      { label: 'Total',                 value: s.total,                   sub: 'Pagos registrados',                              tone: 'blue'  },
      { label: 'Pagados',               value: s.pagados,                 sub: this.paySvc.formatCurrency(r.valorPagado),         tone: 'green' },
      { label: 'Pendientes / vencidos', value: s.pendientes + s.vencidos, sub: this.paySvc.formatCurrency(r.valorPendiente),      tone: 'amber' },
      {
        label: 'Próximo vencimiento',
        value: r.proximo ? r.proximo.fecha_limite : '--',
        sub:   r.proximo ? `Pago #${r.proximo.id_pago}` : 'Sin pagos abiertos',
        tone:  'blue'
      },
    ];
  });

  ngOnInit(): void {
    this.paySvc.cargarPagos().subscribe({
      next:  () => this.cargando.set(false),
      error: () => this.cargando.set(false)
    });
  }

  goToPortfolio(): void { this.router.navigate(['/residente']); }

  onPay(pago?: Pago | null): void {
    if (!pago) { alert('No hay pagos pendientes.'); return; }
    alert(`Módulo de pago en línea próximamente para el pago #${pago.id_pago}.`);
  }

  abrirQr():  void { this.qrExpandido.set(true);  }
  cerrarQr(): void { this.qrExpandido.set(false); }

  dotClass(estado: string): string {
    return ({ 'Pagado': 'dot-green', 'Pendiente': 'dot-amber', 'Vencido': 'dot-red' } as Record<string,string>)[estado] ?? '';
  }
  badgeClass(estado: string): string {
    return ({ 'Pagado': 'badge-green', 'Pendiente': 'badge-amber', 'Vencido': 'badge-red' } as Record<string,string>)[estado] ?? '';
  }
  badgeLabel(estado: string): string {
    return ({ 'Pagado': '✅ Pagado', 'Pendiente': '⏳ Pendiente', 'Vencido': '🚨 Vencido' } as Record<string,string>)[estado] ?? estado;
  }
}