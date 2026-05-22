import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';


@Component({
  
  selector: 'app-portafolio',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="port-page">

      <!-- NAV -->
      <nav class="port-nav">
        <div class="nav-brand">
          <img src="/assets/fyl.png" alt="F&L" class="nav-logo" />
          <div>
            <div class="nav-t1">F&L Aliados Con Propiedad</div>
            <div class="nav-t2">Asesorías administrativas y contables</div>
          </div>
        </div>
        <div class="nav-links">
          <a href="/portafolio#quienes">Nosotros</a>
          <a href="/portafolio#servicios">Servicios</a>
          <a href="/portafolio#diferencial">Diferencial</a>
          <a href="/portafolio#equipo">Equipo</a>
          <a href="/portafolio#contacto">Contacto</a>
        </div>
        <a routerLink="/login" class="nav-login-btn">Iniciar sesión</a>
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
          <div class="hero-actions">
            <a href="#servicios" class="btn-gold">Ver nuestros servicios</a>
            <a href="#contacto" class="btn-outline">Contáctenos</a>
          </div>
        </div>
        <div class="hero-right">
          <img src="/assets/fyl.png" alt="F&L Aliados con Propiedad" class="hero-img" />
          <div class="stat-row">
            <div class="stat-card"><div class="num">100%</div><div class="lbl">Compromiso</div></div>
            <div class="stat-card"><div class="num">360°</div><div class="lbl">Gestión integral</div></div>
            <div class="stat-card"><div class="num">P.H.</div><div class="lbl">Especialistas</div></div>
          </div>
        </div>
      </section>

      <!-- QUIÉNES SOMOS -->
      <section id="quienes" class="sec-light">
        <div class="sec-wrap">
          <div class="quienes-grid">
            <div>
              <div class="kicker">¿Quiénes somos?</div>
              <h2>Aliados idóneos para su copropiedad</h2>
              <p class="sec-desc">
                Somos un equipo de trabajo comprometido con la Propiedad Horizontal, contamos
                con profesionales formados en Administración de empresas y Contaduría Pública
                con la debida capacitación y asesoría jurídica especializada, formación y
                experiencia en la administración de propiedad horizontal.
              </p>
            </div>
            <div class="mv-grid">
              <div class="mv-card">
                <div class="mv-icon">🎯</div>
                <div class="mv-label">Nuestra misión</div>
                <p>Prestar servicios de administración de propiedad horizontal, orientando
                eficazmente el uso de los recursos y la aplicación de las tecnologías
                adecuadas para el mantenimiento y valorización de las copropiedades.</p>
              </div>
              <div class="mv-card">
                <div class="mv-icon">🔭</div>
                <div class="mv-label">Nuestra visión</div>
                <p>Seremos reconocidos como referente inmediato para la prestación de un
                excelente servicio de administración de propiedad horizontal, contando con
                un equipo integral.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SERVICIOS PRINCIPALES -->
      <section id="servicios" class="sec-white">
        <div class="sec-wrap">
          <div class="kicker gold">Nuestros servicios</div>
          <h2>Gestión completa para copropiedades</h2>
          <div class="servicios-grid">
            @for (s of servicios; track s.icon) {
              <div class="serv-card">
                <div class="serv-icon">{{ s.icon }}</div>
                <div class="serv-title">{{ s.title }}</div>
                <p>{{ s.desc }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- SERVICIOS EXTENDIDOS -->
      <section class="sec-light">
        <div class="sec-wrap">
          <div class="kicker">SERVICIOS</div>
          <h2>Asesoría especializada y más</h2>
          <div class="ext-grid">
            @for (e of serviciosExt; track e.title) {
              <div class="ext-card">
                <div class="ext-icon">{{ e.icon }}</div>
                <div class="ext-title">{{ e.title }}</div>
                <p>{{ e.desc }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- DIFERENCIAL -->
      <section id="diferencial" class="sec-dark">
        <div class="sec-wrap">
          <div class="kicker">Nuestra oferta diferencial</div>
          <h2>¿Por qué elegirnos?</h2>
          <div class="dif-grid">
            <div class="features-list">
              @for (f of features; track f.num) {
                <div class="feature-item">
                  <div class="feat-num">{{ f.num }}</div>
                  <div>
                    <h4>{{ f.title }}</h4>
                    <p>{{ f.desc }}</p>
                  </div>
                </div>
              }
            </div>
            <div class="compromisos-card">
              <div class="comp-title">Nuestros compromisos</div>
              <ul>
                @for (c of compromisos; track c) {
                  <li>{{ c }}</li>
                }
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- EQUIPO -->
      <section id="equipo" class="sec-darker">
        <div class="sec-wrap">
          <div class="kicker gold">Equipo profesional</div>
          <h2 style="color:#fff">Las personas detrás de F&L</h2>
          <div class="equipo-grid">
            @for (m of equipo; track m.initials) {
              <div class="equipo-card">
                <div class="equipo-av">{{ m.initials }}</div>
                <div class="equipo-name">{{ m.name }}</div>
                <div class="equipo-role">{{ m.role }}</div>
                <p>{{ m.desc }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- CONTACTO -->
      <section id="contacto" class="sec-white">
        <div class="sec-wrap">
          <div class="kicker">Contacto</div>
          <h2>Hablemos de su copropiedad</h2>
          <div class="contacto-grid">

            <!-- Datos de contacto -->
            <div class="contact-list">
              @for (c of contactos; track c.label) {
                <div class="contact-item">
                  <span class="contact-ico">{{ c.icon }}</span>
                  <div>
                    <strong>{{ c.label }}</strong>
                    <span>{{ c.value }}</span>
                  </div>
                </div>
              }
            </div>

            <!-- Logo -->
            <div class="contact-img-wrap">
              <img src="/assets/fyl-logo.png" alt="F&L Logo" class="contact-img" />
            </div>

            <!-- Card acceso portal -->
            <div class="login-card-promo">
              <div class="lcp-top">
                <img src="/assets/fyl.png" alt="F&L" class="lcp-logo" />
                <div class="lcp-kicker">Portal digital</div>
              </div>
              <h3>Accede a tu cuenta</h3>
              <p>Consulta tus pagos, estado de cuenta y toda la información de tu copropiedad desde nuestro portal en línea.</p>
              <ul class="lcp-features">
                <li>📋 Historial de pagos</li>
                <li>🔔 Notificaciones activas</li>
                <li>💳 Pago en línea</li>
                <li>🏠 Info de tu apartamento</li>
              </ul>
              <a href="/login" class="lcp-btn">Ir al portal →</a>
            </div>

          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="port-footer">
        <img src="/assets/fyl.png" alt="F&L" class="footer-logo" />
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

    .port-page { font-family: 'Inter', sans-serif; color: #1a1a2e; }

    /* NAV */
    .port-nav {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 40px; gap: 16px; flex-wrap: wrap;
      background: rgba(10,47,32,0.97);
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    .nav-brand { display: flex; align-items: center; gap: 12px; }
    .nav-logo { width: 40px; height: 40px; object-fit: contain; border-radius: 10px; background: rgba(255,255,255,0.06); padding: 3px; }
    .nav-t1 { font-size: 13px; font-weight: 800; color: #fff; }
    .nav-t2 { font-size: 10px; color: rgba(255,255,255,0.55); }
    .nav-links { display: flex; gap: 28px; }
    .nav-links a { color: rgba(255,255,255,0.78); text-decoration: none; font-size: 13px; font-weight: 500; transition: color 0.2s; }
    .nav-links a:hover { color: #c9a84c; }

    /* HERO */
    .hero {
      min-height: 92vh;
      background: linear-gradient(145deg, #0a2f20 0%, #0f4a33 60%, #1a5c40 100%);
      display: flex; align-items: center; justify-content: space-between;
      padding: 100px 40px 60px; gap: 48px; flex-wrap: wrap;
      position: relative; overflow: hidden;
    }
    .hero-blob { position: absolute; top: -120px; right: -120px; width: 520px; height: 520px; border-radius: 50%; background: radial-gradient(circle, rgba(201,168,76,0.16), transparent 70%); pointer-events: none; }
    .hero-blob2 { position: absolute; bottom: -80px; left: -80px; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,0.05), transparent 70%); pointer-events: none; }
    .hero-content { max-width: 580px; color: #fff; position: relative; z-index: 1; }
    .hero-pill { display: inline-block; background: rgba(201,168,76,0.2); color: #c9a84c; border: 1px solid rgba(201,168,76,0.4); border-radius: 999px; padding: 6px 16px; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; margin-bottom: 20px; }
    .hero-content h1 { font-size: clamp(28px, 4vw, 46px); font-weight: 900; line-height: 1.12; margin-bottom: 18px; }
    .hero-content h1 em { color: #c9a84c; font-style: normal; }
    .hero-sub { font-size: 15px; color: rgba(255,255,255,0.75); line-height: 1.7; margin-bottom: 32px; }
    .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .btn-gold { background: #c9a84c; color: #0a2f20; border: none; border-radius: 10px; padding: 13px 26px; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: transform 0.15s; }
    .btn-gold:hover { transform: translateY(-1px); }
    .btn-outline { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.4); border-radius: 10px; padding: 13px 26px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }

    .hero-right {
      display: flex; flex-direction: column; align-items: center;
      gap: 24px; position: relative; z-index: 1;
      flex: 0 0 auto;
    }
    .hero-img {
      width: min(340px, 100%);
      border-radius: 24px;
      object-fit: contain;
      filter: drop-shadow(0 24px 48px rgba(0,0,0,0.35));
      animation: float 5s ease-in-out infinite;
    }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    .stat-row { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
    .stat-card { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 16px 20px; text-align: center; color: #fff; }
    .stat-card .num { font-size: 26px; font-weight: 900; color: #c9a84c; }
    .stat-card .lbl { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 4px; }

    /* SECCIONES */
    .sec-wrap { max-width: 1100px; margin: 0 auto; }
    .sec-light  { background: #f4f7f4; padding: 80px 40px; }
    .sec-white  { background: #fff;    padding: 80px 40px; }
    .sec-dark   { background: linear-gradient(145deg, #0a2f20, #0f4a33); color: #fff; padding: 80px 40px; }
    .sec-darker { background: #061a10; padding: 80px 40px; }

    .kicker { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; color: #0f4a33; margin-bottom: 10px; }
    .kicker.gold { color: #c9a84c; }
    h2 { font-size: clamp(22px, 3vw, 36px); font-weight: 900; line-height: 1.2; margin-bottom: 16px; color: #0a2f20; }
    .sec-dark h2, .sec-darker h2 { color: #fff; }
    .sec-desc { font-size: 15px; color: #4b5563; line-height: 1.7; max-width: 620px; }

    /* QUIÉNES */
    .quienes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; }
    .mv-grid { display: grid; gap: 16px; }
    .mv-card { background: #fff; border-radius: 16px; padding: 22px; border: 1px solid #e5e7eb; }
    .mv-icon { font-size: 28px; margin-bottom: 10px; }
    .mv-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: #0f4a33; margin-bottom: 8px; }
    .mv-card p { font-size: 14px; color: #4b5563; line-height: 1.6; }

    /* SERVICIOS PRINCIPALES */
    .servicios-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 32px; }
    .serv-card { border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; transition: box-shadow 0.2s, transform 0.2s; background: #fff; }
    .serv-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .serv-icon { font-size: 32px; margin-bottom: 12px; }
    .serv-title { font-size: 15px; font-weight: 700; color: #0a2f20; margin-bottom: 8px; }
    .serv-card p { font-size: 13px; color: #6b7280; line-height: 1.6; }

    /* SERVICIOS EXTENDIDOS */
    .ext-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 32px; }
    .ext-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; transition: box-shadow 0.2s; }
    .ext-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.07); }
    .ext-icon { font-size: 28px; margin-bottom: 10px; }
    .ext-title { font-size: 15px; font-weight: 700; color: #0a2f20; margin-bottom: 8px; }
    .ext-card p { font-size: 13px; color: #6b7280; line-height: 1.6; }

    /* DIFERENCIAL */
    .dif-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 32px; }
    .features-list { display: grid; gap: 28px; }
    .feature-item { display: flex; gap: 18px; }
    .feat-num { font-size: 32px; font-weight: 900; color: #c9a84c; min-width: 48px; line-height: 1; }
    .feature-item h4 { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 6px; }
    .feature-item p { font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.6; }
    .compromisos-card { background: rgba(255,255,255,0.07); border: 1px solid rgba(201,168,76,0.3); border-radius: 18px; padding: 28px; }
    .comp-title { font-size: 18px; font-weight: 800; color: #c9a84c; margin-bottom: 18px; }
    .compromisos-card ul { list-style: none; display: grid; gap: 14px; }
    .compromisos-card li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: rgba(255,255,255,0.85); line-height: 1.5; }
    .compromisos-card li::before { content: '✓'; color: #c9a84c; font-weight: 700; flex-shrink: 0; margin-top: 1px; }

    /* EQUIPO */
    .equipo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 32px; max-width: 760px; margin-left: auto; margin-right: auto; }
    .equipo-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; padding: 28px; text-align: center; }
    .equipo-av { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg,#c9a84c,#e8c96a); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; color: #0a2f20; margin: 0 auto 14px; }
    .equipo-name { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .equipo-role { font-size: 12px; color: #c9a84c; font-weight: 600; margin-bottom: 12px; }
    .equipo-card p { font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.6; }

    /* CONTACTO */
    .sec-white .sec-wrap > h2 { color: #0a2f20; }
    .contacto-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 32px;
      align-items: center;
      margin-top: 32px;
    }
    .contact-list { display: grid; gap: 20px; }
    .contact-item { display: flex; align-items: flex-start; gap: 14px; }
    .contact-ico { font-size: 24px; }
    .contact-item strong { display: block; font-size: 14px; color: #0a2f20; margin-bottom: 2px; font-weight: 700; }
    .contact-item span { font-size: 13px; color: #6b7280; }

    .contact-img-wrap { display: flex; align-items: center; justify-content: center; }
    .contact-img {
      width: min(280px, 100%);
      object-fit: contain;
      border-radius: 20px;
      filter: drop-shadow(0 16px 32px rgba(0,0,0,0.14));
    }

    /* CARD LOGIN PROMO */
    .login-card-promo {
      background: linear-gradient(145deg, #0a2f20, #0f4a33);
      border: 1px solid rgba(201,168,76,0.25);
      border-radius: 20px;
      padding: 26px;
      color: #fff;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 20px 50px rgba(10,47,32,0.2);
    }
    .lcp-top { display: flex; align-items: center; gap: 12px; }
    .lcp-logo { width: 36px; height: 36px; object-fit: contain; border-radius: 8px; background: rgba(255,255,255,0.08); padding: 3px; }
    .lcp-kicker { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #c9a84c; font-weight: 800; }
    .login-card-promo h3 { font-size: 20px; font-weight: 900; color: #fff; line-height: 1.2; }
    .login-card-promo p { font-size: 13px; color: rgba(255,255,255,0.72); line-height: 1.6; }
    .lcp-features { list-style: none; display: grid; gap: 10px; }
    .lcp-features li { font-size: 13px; color: rgba(255,255,255,0.85); display: flex; align-items: center; gap: 8px; }
    .lcp-btn {
      display: inline-flex; align-items: center; justify-content: center;
      background: #c9a84c; color: #0a2f20;
      border: none; border-radius: 10px;
      padding: 13px 20px; font-size: 14px; font-weight: 800;
      text-decoration: none; cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      margin-top: 4px;
    }
    .lcp-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(201,168,76,0.3); }

    /* FOOTER */
    .port-footer { background: #0a2f20; color: rgba(255,255,255,0.7); text-align: center; padding: 36px 24px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .footer-logo { width: 48px; height: 48px; object-fit: contain; border-radius: 12px; background: rgba(255,255,255,0.06); padding: 4px; }
    .footer-brand { font-size: 16px; font-weight: 800; color: #c9a84c; }
    .footer-brand span { display: block; font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 400; margin-top: 2px; }
    .footer-copy { font-size: 12px; }

    .nav-login-btn {
    background: #c9a84c;
    color: #0a2f20;
    border: none;
    border-radius: 8px;
    padding: 9px 18px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    transition: transform 0.15s;
  }
  .nav-login-btn:hover { transform: translateY(-1px); }

    /* RESPONSIVE */
    @media (max-width: 960px) {
      .quienes-grid, .dif-grid { grid-template-columns: 1fr; }
      .servicios-grid, .ext-grid { grid-template-columns: repeat(2, 1fr); }
      .contacto-grid { grid-template-columns: 1fr; }
      .contact-img-wrap { display: none; }
      .hero { flex-direction: column; padding: 80px 24px 48px; }
      .hero-right { width: 100%; align-items: center; }
      .hero-img { width: min(280px, 100%); }
    }
    @media (max-width: 640px) {
      .servicios-grid, .ext-grid, .equipo-grid { grid-template-columns: 1fr; }
      .port-nav { padding: 12px 20px; }
      .nav-links { display: none; }
      .sec-light, .sec-white, .sec-dark, .sec-darker { padding: 60px 20px; }
    }
  `]
})
export class PortafolioComponent {

  servicios = [
    { icon: '⚖️', title: 'Representación Legal y Administrativa', desc: 'Representamos jurídicamente la copropiedad, tramitamos RUT y Personería Jurídica, efectuamos contratos y presentamos ante la DIAN las retenciones mensuales.' },
    { icon: '📊', title: 'Contabilidad, Facturación y Recaudo', desc: 'Estados financieros mensuales certificados, facturación de cuotas de administración, gestión de cartera morosa y expedición de certificados de paz y salvo.' },
    { icon: '👷', title: 'Administración del Recurso Humano', desc: 'Supervisión y contratación de personal de seguridad y aseo, certificado por la Superintendencia.' },
    { icon: '🔧', title: 'Mantenimiento de Equipos e Infraestructura', desc: 'Zonas verdes, reparaciones locativas, control de plagas, y mantenimiento de tanques, ascensores, piscinas y más.' },
    { icon: '🤝', title: 'Convivencia y Normativa', desc: 'Difusión de reglamentos, gestión de sanciones, coordinación de asambleas bajo la Ley 675.' },
    { icon: '🔍', title: 'Diagnóstico y Análisis Estratégico', desc: 'Estudio de la situación actual para desarrollar un plan estratégico enfocado en prioridades a corto, mediano y largo plazo.' },
  ];

  serviciosExt = [
    { icon: '🎓', title: 'Asesoría especializada', desc: 'Brindamos asesoría especializada en la administración de propiedad horizontal, orientada a garantizar una gestión eficiente, transparente y ajustada a la normatividad vigente.' },
    { icon: '📚', title: 'Capacitación', desc: 'Ofrecemos programas de capacitación orientados a fortalecer las competencias de administradores, consejos de administración y personal operativo en propiedad horizontal.' },
    { icon: '📋', title: 'Gestión de proyectos', desc: 'Gestionamos proyectos enfocados en la mejora y mantenimiento de la propiedad horizontal, desde la planificación hasta la ejecución y supervisión.' },
    { icon: '💻', title: 'Soluciones tecnológicas', desc: 'Implementamos soluciones tecnológicas orientadas a optimizar la administración de propiedad horizontal, facilitando el control financiero, la gestión de cartera y la comunicación.' },
    { icon: '🛟', title: 'Soporte y acompañamiento', desc: 'Brindamos soporte y acompañamiento continuo en la administración de propiedad horizontal, garantizando una gestión eficiente y sostenible en el tiempo.' },
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