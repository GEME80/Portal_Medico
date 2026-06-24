import Link from "next/link";

interface FooterProps {
  tenantSlug?: string;
  nombreDoctor?: string;
  email?: string;
  telefono?: string;
  logoUrl?: string;
  nombreMenuVacunas?: string;
  habilitarMenuVacunas?: boolean;
  direccion?: string;
  whatsapp?: string;
}

export default function Footer({
  tenantSlug,
  nombreDoctor,
  email,
  telefono,
  logoUrl,
  nombreMenuVacunas = "EcoVaccine",
  habilitarMenuVacunas = true,
  direccion,
  whatsapp
}: FooterProps = {}) {
  const base = tenantSlug ? `/${tenantSlug}` : "";
  const year = new Date().getFullYear();

  let waData = { n: whatsapp || telefono, t: "w" };
  if (whatsapp && whatsapp.startsWith("{")) {
    try { waData = JSON.parse(whatsapp); } catch (e) {}
  }

  const chatUrl = waData.t === "t" 
    ? `https://t.me/${waData.n?.replace(/[^a-zA-Z0-9_]/g, "")}` 
    : `https://wa.me/${waData.n?.replace(/[^0-9]/g, "")}`;


  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ height: "40px", width: "auto", borderRadius: "6px" }} />
              ) : (
                <span style={{ fontSize: "24px" }}>🛡️</span>
              )}
              <div className="footer-brand-name" style={{ marginBottom: 0 }}>{nombreDoctor || "Portal Médico"}</div>
            </div>
            <p className="footer-brand-desc">
              Portal médico profesional con sistema integrado de control y consulta de inventario para sus pacientes.
              Información de salud basada en evidencia científica y guías de la OPS/OMS.
            </p>
            <div className="flex gap-3 mt-6">
              <span className="ecovaccine-tag">
                💉 {nombreMenuVacunas} POS
              </span>
            </div>
          </div>

          {/* Especialidades */}
          <div>
            <p className="footer-heading">Especialidades</p>
            <ul className="footer-links">
              {habilitarMenuVacunas && (
                <li><Link href={`${base}/vacunas`}>{nombreMenuVacunas}</Link></li>
              )}
              <li><Link href={`${base}/sobre-el-doctor`}>Trayectoria</Link></li>
              <li><Link href={`${base}/noticias`}>Publicaciones</Link></li>
            </ul>
          </div>

          {/* Publicaciones */}
          <div>
            <p className="footer-heading">Publicaciones</p>
            <ul className="footer-links">
              <li><Link href={`${base}/noticias`}>Artículos Académicos</Link></li>
              <li><Link href={`${base}/noticias`}>Prevención</Link></li>
              <li><Link href={`${base}/noticias`}>Boletines Informativos</Link></li>
            </ul>
          </div>

          {/* Portal */}
          <div>
            <p className="footer-heading">Portal</p>
            <ul className="footer-links">
              <li><Link href={`${base}/login`}>Acceso Administrativo</Link></li>
              <li><Link href={`${base}/#contacto`}>Contactar al Doctor</Link></li>
              <li><Link href={`${base}/sobre-el-doctor`}>Currículum Vitae</Link></li>
            </ul>
            <div style={{ marginTop: "24px" }}>
              <p className="footer-heading">Contacto</p>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,.4)", lineHeight: "1.7" }}>
                📧 {email || "soporte@ecovaccine.app"}<br/>
                <a href={chatUrl} target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,.4)", textDecoration: "none" }}>
                  {waData.t === "t" ? "✈️" : "💬"} {waData.n || telefono}
                </a><br/>
                {direccion && (
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(direccion)}`} target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,.4)", textDecoration: "none" }}>
                    📍 {direccion}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <span>© {year} {nombreDoctor || "EcoVaccine"}. Todos los derechos reservados.</span>
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
