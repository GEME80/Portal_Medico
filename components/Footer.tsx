import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <div className="footer-brand-name">Dr. Carlos Torres Martínez</div>
            <p className="footer-brand-desc">
              Infectólogo Pediatra con más de 30 años de experiencia clínica y académica.
              Comprometido con la salud infantil, la vacunación segura y la educación científica para padres y comunidades.
            </p>
            <div className="flex gap-3 mt-6">
              <span className="ecovaccine-tag">
                💉 EcoVaccine POS
              </span>
            </div>
          </div>

          {/* Especialidades */}
          <div>
            <p className="footer-heading">Especialidades</p>
            <ul className="footer-links">
              <li><Link href="/vacunas">Vacunología</Link></li>
              <li><Link href="/vacunas">Infectología Pediátrica</Link></li>
              <li><Link href="/vacunas">Inmunología Clínica</Link></li>
              <li><Link href="/noticias">Epidemiología</Link></li>
            </ul>
          </div>

          {/* Publicaciones */}
          <div>
            <p className="footer-heading">Publicaciones</p>
            <ul className="footer-links">
              <li><Link href="/noticias">Artículos Académicos</Link></li>
              <li><Link href="/noticias">Prevención</Link></li>
              <li><Link href="/noticias">Alertas Epidemiológicas</Link></li>
              <li><Link href="/noticias">Boletines EcoVaccine</Link></li>
            </ul>
          </div>

          {/* Portal */}
          <div>
            <p className="footer-heading">Portal</p>
            <ul className="footer-links">
              <li><Link href="/admin/login">Acceso Administrativo</Link></li>
              <li><Link href="/#contacto">Contactar al Doctor</Link></li>
              <li><Link href="/sobre-el-doctor">Currículum Vitae</Link></li>
            </ul>
            <div style={{ marginTop: "24px" }}>
              <p className="footer-heading">Contacto</p>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,.4)", lineHeight: "1.7" }}>
                📧 drtorres@ecovaccine.med<br/>
                📞 +57 (601) 000-0000<br/>
                📍 Bogotá, Colombia
              </p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <span>© {year} Dr. Carlos Torres Martínez & EcoVaccine. Todos los derechos reservados.</span>
          <div className="footer-brand-tag">
            <span>Desarrollado por</span>
            <a href="mailto:germanmoralesconsulting@gmail.com" style={{ color: "rgba(255,255,255,.6)", fontWeight: 700 }}>
              Germán Morales Consulting
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
