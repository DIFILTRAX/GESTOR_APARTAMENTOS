import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-residente',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="portfolio-page">

      <!-- NAV -->
      <nav>
        <div class="nav-brand">
          <img class="nav-logo-img" src="/assets/fyl.png" alt="F&L Aliados con Propiedad" />
          <div class="nav-brand-text">
            <div class="t1">F&L Aliados Con Propiedad</div>
            <div class="t2">Asesorías administrativas y contables</div>
          </div>
        </div>
        <div class="nav-links">
          <!-- ✅ REQ 2: scroll anchor sin recargar -->
          <a (click)="scrollTo('quienes')">Nosotros</a>
          <a (click)="scrollTo('servicios')">Servicios</a>
          <a (click)="scrollTo('diferencial')">Diferencial</a>
          <a (click)="scrollTo('equipo')">Equipo</a>
        </div>
        <div class="nav-actions">
          <button class="nav-cta" (click)="goToPayments()">Ver mis pagos</button>
          <button class="nav-logout" (click)="auth.logout()">Salir</button>
        </div>
      </nav>

      <!-- HERO -->
      <section class="hero">
        <div class="hero-blob"></div>
        <div class="hero-blob2"></div>
        <div class="hero-content">
          <div class="hero-pill">Propiedad Horizontal · Medellín, Colombia</div>
          <h1>Sus aliados en <em>administración integral</em></h1>
          <p class="hero-sub">
            Equipo comprometido con la Propiedad Horizontal. Profesionales en
            administración de empresas, contaduría pública y asesoría jurídica
            especializada para la gerencia de su copropiedad.
          </p>

          <!-- ✅ REQ 1: muestra todos los apartamentos si tiene varios -->
          @if ((auth.user()?.apartamentos?.length ?? 0) > 1) {
            <div class="apt-multi-wrap">
              @for (apt of auth.user()!.apartamentos!; track apt.apartamento) {
                <div class="apt-session-card">
                  <div class="apt-session-kicker">Tu apartamento</div>
                  <div class="apt-session-num">Apto {{ apt.apartamento }}</div>
                  <div class="apt-session-meta">
                    {{ apt.edificio_nombre }} · Piso {{ apt.piso }}
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="apt-session-card">
              <div class="apt-session-kicker">Tu apartamento</div>
              <div class="apt-session-num">
                {{ auth.user()?.apartamento ? 'Apto ' + auth.user()?.apartamento : 'Pendiente' }}
              </div>
              <div class="apt-session-meta">
                {{ auth.user()?.edificio_nombre || 'Sin edificio asignado' }} ·
                {{ auth.user()?.piso ? 'Piso ' + auth.user()?.piso : 'Piso pendiente' }}
              </div>
            </div>
          }

          <div class="hero-actions">
            <button class="btn-gold" (click)="goToPayments()">Ver mis pagos</button>
            <a class="btn-outline" (click)="scrollTo('servicios')">Ver nuestros servicios</a>
          </div>
        </div>

        <div class="hero-right">
          <div class="stat-card"><div class="num">100%</div><div class="lbl">Compromiso</div></div>
          <div class="stat-card"><div class="num">360°</div><div class="lbl">Gestión integral</div></div>
          <div class="stat-card"><div class="num">P.H.</div><div class="lbl">Especialistas</div></div>
        </div>
      </section>

      <!-- QUIÉNES SOMOS -->
      <section id="quienes">
        <div class="quienes-grid">
          <div>
            <div class="section-label">¿Quiénes somos?</div>
            <h2 class="section-title">Aliados idóneos para su copropiedad</h2>
            <p class="section-desc">
              Somos un equipo de trabajo comprometido con la Propiedad Horizontal, contamos
              con profesionales formados en Administración de empresas y Contaduría Pública
              con la debida capacitación y asesoría jurídica especializada, formación y
              experiencia en la administración de propiedad horizontal.
            </p>
          </div>
          <div class="quienes-visual">
            <div class="quienes-box">
              <div class="mv-item">
                <div class="mv-label">Nuestra misión</div>
                <div class="mv-text">Prestar servicios de administración de propiedad horizontal,
                orientando eficazmente el uso de los recursos y la aplicación de las tecnologías
                adecuadas para el mantenimiento y valorización de las copropiedades.</div>
              </div>
              <div class="mv-item">
                <div class="mv-label">Nuestra visión</div>
                <div class="mv-text">Seremos reconocidos como referente inmediato para la
                prestación de un excelente servicio de administración de propiedad horizontal,
                contando con un equipo integral.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SERVICIOS -->
      <section id="servicios">
        <div class="section-wrap">
          <div class="section-label" style="color:#c9a84c">Nuestros servicios</div>
          <h2 class="section-title">Gestión completa para copropiedades</h2>
          <div class="servicios-grid">
            @for (s of servicios; track s.icon) {
              <div class="servicio-card">
                <div class="serv-icon">{{ s.icon }}</div>
                <div class="serv-title">{{ s.title }}</div>
                <div class="serv-desc">{{ s.desc }}</div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- DIFERENCIAL -->
      <!-- ✅ REQ 3: colores mejorados para contraste -->
      <section id="diferencial">
        <div class="dif-inner">
          <div class="section-label dif-label">Nuestra oferta diferencial</div>
          <h2 class="section-title dif-title">¿Por qué elegirnos?</h2>
          <div class="dif-grid">
            <div>
              @for (f of features; track f.num) {
                <div class="dif-feature">
                  <div class="dif-num">{{ f.num }}</div>
                  <div class="dif-feature-text">
                    <h4>{{ f.title }}</h4>
                    <p>{{ f.desc }}</p>
                  </div>
                </div>
              }
            </div>
            <div class="dif-panel">
              <div class="dif-panel-title">Nuestros compromisos</div>
              <ul class="dif-list">
                @for (c of compromisos; track c) {
                  <li>{{ c }}</li>
                }
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- EQUIPO -->
      <section id="equipo">
        <div class="section-wrap">
          <div class="section-label" style="color:#c9a84c">Equipo profesional</div>
          <h2 class="section-title" style="color:#fff">Las personas detrás de F&L</h2>
          <div class="equipo-grid">
            @for (m of equipo; track m.initials) {
              <div class="equipo-card">
                <div class="equipo-av">{{ m.initials }}</div>
                <div class="equipo-name">{{ m.name }}</div>
                <div class="equipo-role">{{ m.role }}</div>
                <div class="equipo-desc">{{ m.desc }}</div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- CONTACTO -->
      <section id="contacto">
        <div class="contacto-inner">
          <div class="section-label">Contacto</div>
          <h2 class="section-title">Hablemos de su copropiedad</h2>
          @for (c of contactos; track c.label) {
            <div class="contact-item">
              <div class="contact-icon">{{ c.icon }}</div>
              <div class="contact-item-text">
                <strong>{{ c.label }}</strong>
                <span>{{ c.value }}</span>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- FOOTER -->
      <footer>
        <div class="footer-brand">
          F&L Aliados Con Propiedad
          <span>Asesorías administrativas y contables</span>
        </div>
        <div class="footer-copy">© 2025 F&L Aliados Con Propiedad</div>
      </footer>

    </div>
  `,
  styles: [`
    :host { display: block; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .portfolio-page { font-family: 'Inter', sans-serif; color: #1a1a2e; }

    nav {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 32px;
      background: rgba(10,47,32,0.97);
      backdrop-filter: blur(8px);
      gap: 16px; flex-wrap: wrap;
      box-shadow: 0 12px 28px rgba(10,47,32,0.16);
    }
    .nav-brand { display: flex; align-items: center; gap: 12px; }
    .nav-logo-img { width: 42px; height: 42px; object-fit: contain; border-radius: 12px; background: rgba(255,255,255,0.06); padding: 3px; }
    .nav-brand-text .t1 { font-size: 13px; font-weight: 800; color: #fff; }
    .nav-brand-text .t2 { font-size: 10px; color: rgba(255,255,255,0.6); }
    .nav-links { display: flex; gap: 24px; }
    /* ✅ REQ 2: cursor pointer en links de navegación */
    .nav-links a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 13px; font-weight: 500; transition: color 0.2s; cursor: pointer; }
    .nav-links a:hover { color: #c9a84c; }
    .nav-actions { display: flex; gap: 10px; }
    .nav-cta { background: #c9a84c; color: #0a2f20; border: none; border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .nav-logout { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 9px 14px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .nav-logout:hover { background: rgba(220,38,38,0.3); }

    .hero { min-height: 90vh; background: linear-gradient(145deg, #0a2f20 0%, #0f4a33 60%, #1a5c40 100%); display: flex; align-items: center; justify-content: space-between; padding: 80px 32px 60px; gap: 40px; flex-wrap: wrap; position: relative; overflow: hidden; }
    .hero-blob { position: absolute; top: -100px; right: -100px; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(201,168,76,0.15), transparent 70%); pointer-events: none; }
    .hero-blob2 { position: absolute; bottom: -80px; left: -80px; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,0.05), transparent 70%); pointer-events: none; }
    .hero-content { max-width: 600px; color: #fff; position: relative; z-index: 1; }
    .hero-pill { display: inline-block; background: rgba(201,168,76,0.2); color: #c9a84c; border: 1px solid rgba(201,168,76,0.4); border-radius: 999px; padding: 6px 16px; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; margin-bottom: 20px; }
    .hero-content h1 { font-size: clamp(28px, 4vw, 44px); font-weight: 900; line-height: 1.15; margin-bottom: 16px; }
    .hero-content h1 em { color: #c9a84c; font-style: normal; }
    .hero-sub { font-size: 15px; color: rgba(255,255,255,0.75); line-height: 1.7; margin-bottom: 28px; }

    /* ✅ REQ 1: múltiples apartamentos */
    .apt-multi-wrap { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 28px; }
    .apt-session-card { background: rgba(255,255,255,0.08); border: 1px solid rgba(201,168,76,0.3); border-radius: 14px; padding: 16px 20px; display: inline-block; min-width: 200px; }
    .apt-session-kicker { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.5); font-weight: 700; }
    .apt-session-num { font-size: 28px; font-weight: 900; color: #c9a84c; margin: 4px 0; }
    .apt-session-meta { font-size: 12px; color: rgba(255,255,255,0.65); }

    .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .btn-gold { background: #c9a84c; color: #0a2f20; border: none; border-radius: 10px; padding: 13px 24px; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .btn-outline { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.4); border-radius: 10px; padding: 13px 24px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }

    .hero-right { display: flex; flex-direction: column; gap: 16px; position: relative; z-index: 1; }
    .stat-card { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 20px 28px; text-align: center; color: #fff; }
    .stat-card .num { font-size: 32px; font-weight: 900; color: #c9a84c; }
    .stat-card .lbl { font-size: 12px; color: rgba(255,255,255,0.65); margin-top: 4px; }

    section { padding: 80px 32px; }
    #quienes { background: #f8f9fa; }
    #servicios { background: #fff; }
    #diferencial { background: linear-gradient(145deg, #0a2f20, #0f4a33); color: #fff; }
    #equipo { background: #0a2f20; }
    #contacto { background: #fff; padding: 80px 32px; }

    .section-wrap { max-width: 1100px; margin: 0 auto; }
    .section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; color: #0f4a33; margin-bottom: 10px; }
    .section-title { font-size: clamp(22px, 3vw, 36px); font-weight: 900; line-height: 1.2; margin-bottom: 16px; color: #0a2f20; }
    .section-desc { font-size: 15px; color: #4b5563; line-height: 1.7; max-width: 680px; }

    .quienes-grid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
    .quienes-box { display: grid; gap: 20px; }
    .mv-item { background: #fff; border-radius: 14px; padding: 20px; border: 1px solid #e5e7eb; }
    .mv-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: #0f4a33; margin-bottom: 8px; }
    .mv-text { font-size: 14px; color: #4b5563; line-height: 1.6; }

    .servicios-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 32px; }
    .servicio-card { border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; transition: box-shadow 0.2s; }
    .servicio-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
    .serv-icon { font-size: 32px; margin-bottom: 12px; }
    .serv-title { font-size: 15px; font-weight: 700; color: #0a2f20; margin-bottom: 8px; }
    .serv-desc { font-size: 13px; color: #6b7280; line-height: 1.6; }

    .dif-inner { max-width: 1100px; margin: 0 auto; }
    /* ✅ REQ 3: mejor contraste en sección diferencial */
    .dif-label { color: #f0c96a !important; font-weight: 800; }
    .dif-title { color: #ffffff !important; text-shadow: 0 1px 4px rgba(0,0,0,0.3); }
    .dif-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 32px; }
    .dif-feature { display: flex; gap: 16px; margin-bottom: 28px; }
    .dif-num { font-size: 28px; font-weight: 900; color: #f0c96a; min-width: 40px; text-shadow: 0 1px 3px rgba(0,0,0,0.2); }
    .dif-feature-text h4 { font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 6px; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }
    .dif-feature-text p { font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.6; }
    .dif-panel { background: rgba(255,255,255,0.12); border: 1px solid rgba(240,201,106,0.4); border-radius: 16px; padding: 28px; }
    .dif-panel-title { font-size: 18px; font-weight: 800; color: #f0c96a; margin-bottom: 16px; text-shadow: 0 1px 3px rgba(0,0,0,0.2); }
    .dif-list { list-style: none; display: grid; gap: 12px; }
    .dif-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: #ffffff; line-height: 1.5; }
    .dif-list li::before { content: '✓'; color: #f0c96a; font-weight: 700; flex-shrink: 0; margin-top: 1px; }

    .equipo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 32px; max-width: 800px; margin-left: auto; margin-right: auto; }
    .equipo-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px; text-align: center; }
    .equipo-av { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg,#c9a84c,#e8c96a); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; color: #0a2f20; margin: 0 auto 14px; }
    .equipo-name { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .equipo-role { font-size: 12px; color: #c9a84c; font-weight: 600; margin-bottom: 12px; }
    .equipo-desc { font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.6; }

    .contacto-inner { max-width: 600px; margin: 0 auto; }
    .contacto-inner .section-title { color: #0a2f20; }
    .contact-item { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; }
    .contact-icon { font-size: 22px; }
    .contact-item-text strong { display: block; font-size: 14px; color: #0a2f20; margin-bottom: 2px; }
    .contact-item-text span { font-size: 13px; color: #6b7280; }

    footer { background: #0a2f20; color: rgba(255,255,255,0.7); text-align: center; padding: 32px; }
    .footer-brand { font-size: 16px; font-weight: 800; color: #c9a84c; margin-bottom: 4px; }
    .footer-brand span { display: block; font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 400; margin-top: 2px; }
    .footer-copy { font-size: 12px; margin-top: 8px; }

    @media (max-width: 900px) {
      .quienes-grid, .dif-grid { grid-template-columns: 1fr; }
      .servicios-grid { grid-template-columns: repeat(2, 1fr); }
      .hero { flex-direction: column; }
      .hero-right { flex-direction: row; flex-wrap: wrap; justify-content: center; }
      .nav-links { display: none; }
    }
    @media (max-width: 560px) {
      .servicios-grid, .equipo-grid { grid-template-columns: 1fr; }
      nav { padding: 12px 16px; }
      section { padding: 60px 16px; }
    }
  `]
})
export class ResidenteComponent {
  auth   = inject(AuthService);
  router = inject(Router);

  goToPayments(): void {
    this.router.navigate(['/residente/pagos']);
  }

  // ✅ REQ 2: scroll suave sin recargar la página
  scrollTo(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  servicios = [
    { icon: '⚖️', title: 'Representación Legal y Administrativa', desc: 'Representamos jurídicamente la copropiedad, tramitamos RUT y Personería Jurídica, efectuamos contratos y presentamos ante la DIAN las retenciones mensuales.' },
    { icon: '📊', title: 'Contabilidad, Facturación y Recaudo', desc: 'Estados financieros mensuales certificados, facturación de cuotas de administración, gestión de cartera morosa y expedición de certificados de paz y salvo.' },
    { icon: '👷', title: 'Administración del Recurso Humano', desc: 'Supervisión y contratación de personal de seguridad y aseo, certificado por la Superintendencia.' },
    { icon: '🔧', title: 'Mantenimiento de Equipos e Infraestructura', desc: 'Zonas verdes, reparaciones locativas, control de plagas, y mantenimiento de tanques, ascensores, piscinas y más.' },
    { icon: '🤝', title: 'Convivencia y Normativa', desc: 'Difusión de reglamentos, gestión de sanciones, coordinación de asambleas bajo la Ley 675.' },
    { icon: '🔍', title: 'Diagnóstico y Análisis Estratégico', desc: 'Estudio de la situación actual para desarrollar un plan estratégico enfocado en prioridades a corto, mediano y largo plazo.' },
  ];

  features = [
    { num: '01', title: 'Diagnóstico estratégico inicial', desc: 'Realizamos un estudio profundo de la copropiedad antes de iniciar, para entender sus necesidades reales.' },
    { num: '02', title: 'Equipo profesional multidisciplinario', desc: 'Combinamos experticia en administración de empresas, contaduría pública y asesoría jurídica.' },
    { num: '03', title: 'Oferta económica personalizada', desc: 'Nuestra propuesta económica se define según las condiciones particulares de su copropiedad.' },
  ];

  compromisos = [
    'Estados financieros mensuales certificados por revisor fiscal',
    'Supervisión permanente y atención inmediata a emergencias',
    'Cobro jurídico ágil de cartera morosa',
    'Tecnología adecuada para mantenimiento y valorización',
    'Preparación y coordinación de Asambleas de Copropietarios',
    'Transparencia total en el manejo de los recursos',
  ];

  equipo = [
    { initials: 'LM', name: 'Lina Marcela Medina Padilla', role: 'Contadora Pública', desc: 'Egresada de la Universidad de Envigado, con formación y experiencia en Propiedad Horizontal, Contable y en Dirección del Talento Humano.' },
    { initials: 'NF', name: 'Néstor Fabián Ayala Amariles', role: 'Administrador de Empresas', desc: 'Administrador de empresas Universidad Remington, con experiencia en logística y en administración de Propiedad Horizontal.' },
  ];

  contactos = [
    { icon: '📞', label: 'Lina Marcela Medina', value: '313 513 85 72' },
    { icon: '📞', label: 'Néstor Fabián Ayala', value: '320 926 03 69' },
    { icon: '✉️', label: 'Correo electrónico', value: 'fylaliadosconpropiedad@gmail.com' },
  ];
}