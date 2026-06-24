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
    <footer className="footer" style={{
      background: "var(--white)",
      color: "var(--slate-600)",
      padding: "60px 0 40px",
      borderTop: "1px solid var(--slate-100)"
    }}>
      <div className="container">
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "40px",
          marginBottom: "40px"
        }}>
          {/* Brand Info */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ height: "40px", width: "auto", borderRadius: "0px" }} />
              ) : (
                <span style={{ fontSize: "24px" }}>👨‍⚕️</span>
              )}
              <div style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: "18px",
                fontWeight: 900,
                color: "#000000"
              }}>{nombreDoctor || "Dr. Carlos Torres"}</div>
            </div>
            <p style={{ fontSize: "14px", color: "var(--slate-500)", maxWidth: "320px", lineHeight: 1.6 }}>
              Infectología Pediátrica y vacunación. Cuidado integral para el bienestar de su familia.
            </p>
          </div>

          {/* Contacto & Ubicación */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: "250px" }}>
            <h4 style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: "11px",
              fontWeight: 800,
              color: "#000000",
              letterSpacing: "0.1em",
              textTransform: "uppercase"
            }}>Contacto y Ubicación</h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
              {direccion && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(direccion)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "flex", gap: "10px", alignItems: "flex-start", color: "inherit", transition: "color 0.2s" }}
                  className="hover-text-black"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "2px" }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{direccion}</span>
                </a>
              )}

              {telefono && (
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>{telefono}</span>
                </div>
              )}

              {whatsapp && (
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                  <a
                    href={chatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "inherit", textDecoration: "none" }}
                    className="hover-text-black"
                  >
                    {waData.t === "t" ? "Telegram" : "WhatsApp"} directo
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Admin link */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h4 style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: "11px",
              fontWeight: 800,
              color: "#000000",
              letterSpacing: "0.1em",
              textTransform: "uppercase"
            }}>Portal</h4>
            <Link href={`${base}/login`} style={{ fontSize: "14px", color: "var(--slate-500)" }} className="hover-text-black">
              Ingreso Administrativo
            </Link>
          </div>
        </div>

        {/* Bottom copyright */}
        <div style={{
          borderTop: "1px solid var(--slate-100)",
          paddingTop: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "13px",
          color: "var(--slate-400)"
        }}>
          <span>© {year} {nombreDoctor || "EcoVaccine"}. Todos los derechos reservados.</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>Desarrollado por</span>
            <a
              href="mailto:germanmoralesconsulting@gmail.com"
              style={{ color: "var(--slate-600)", fontWeight: 700, textDecoration: "none" }}
              className="hover-text-black"
            >
              Germán Morales Consulting
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
