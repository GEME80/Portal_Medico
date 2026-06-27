import Link from "next/link";

export default function MarketingLandingPage() {
  return (
    <div style={{
      background: "radial-gradient(circle at top left, #0b111e, #02060c)",
      color: "#f3f4f6",
      minHeight: "100vh",
      fontFamily: "'Inter', sans-serif",
      overflowX: "hidden"
    }}>
      {/* ── HEADER / NAVBAR ────────────────────────────────────── */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(2, 6, 12, 0.7)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              fontSize: "24px",
              background: "linear-gradient(135deg, #0A4D5C, #00D4AA)",
              padding: "6px",
              borderRadius: "10px",
              lineHeight: 1
            }}>🛡️</span>
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#ffffff"
            }}>
              HubMed <span style={{ color: "#00D4AA", fontWeight: 500, fontSize: "14px" }}>Platform</span>
            </span>
          </div>

          <nav style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <a href="#beneficios" style={navLinkStyle}>Beneficios</a>
            <a href="#precios" style={navLinkStyle}>Precios</a>
            <a href="#contacto" style={navLinkStyle}>Contacto</a>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link href="/superadmin" style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.6)",
              textDecoration: "none",
              padding: "8px 12px",
              transition: "color 0.15s"
            }}>
              Superadmin
            </Link>
            
            <Link href="/dr-torres/login" style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#0c111d",
              background: "linear-gradient(135deg, #00D4AA, #05b28e)",
              padding: "10px 18px",
              borderRadius: "10px",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(0, 212, 170, 0.15)",
              transition: "transform 0.15s, opacity 0.15s"
            }}>
              Acceso Doctores
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ────────────────────────────────────────── */}
      <section style={{
        padding: "100px 24px 80px",
        position: "relative",
        textAlign: "center"
      }}>
        <div style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(0, 212, 170, 0.08) 0%, rgba(0,0,0,0) 70%)",
          zIndex: 1,
          pointerEvents: "none"
        }} />

        <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 10 }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(0, 212, 170, 0.08)",
            border: "1px solid rgba(0, 212, 170, 0.2)",
            borderRadius: "30px",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#00D4AA",
            marginBottom: "24px"
          }}>
            <span style={{ width: "6px", height: "6px", background: "#00D4AA", borderRadius: "50%" }} />
            Plataforma SaaS Multi-Tenant para Portales Médicos
          </span>

          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "52px",
            fontWeight: 800,
            lineHeight: 1.15,
            color: "#ffffff",
            letterSpacing: "-0.03em",
            marginBottom: "24px"
          }}>
            Digitaliza tu control de vacunas y potencia tu <span style={{
              background: "linear-gradient(135deg, #00D4AA, #00A383)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>marca personal</span>
          </h1>

          <p style={{
            fontSize: "18px",
            color: "rgba(255, 255, 255, 0.7)",
            lineHeight: 1.6,
            marginBottom: "40px",
            maxWidth: "600px",
            margin: "0 auto 40px"
          }}>
            Un sistema de inventario y punto de venta vacunal (POS) integrado directamente con un sitio web premium parametrizable y tu propio dominio.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dr-torres" style={{
              padding: "14px 28px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 700,
              textDecoration: "none",
              transition: "background 0.15s"
            }}>
              Ver Demostración Pública ↗
            </Link>
            <a href="#precios" style={{
              padding: "14px 28px",
              background: "linear-gradient(135deg, #0A4D5C, #066d82)",
              borderRadius: "12px",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 700,
              textDecoration: "none",
              transition: "opacity 0.15s"
            }}>
              Comenzar Ahora
            </a>
          </div>
        </div>
      </section>

      {/* ── BENEFICIOS SECTION ─────────────────────────────────── */}
      <section id="beneficios" style={{
        padding: "80px 24px",
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "32px", fontWeight: 800, color: "#ffffff", margin: "0 0 12px 0" }}>
            Todo lo que tu consultorio médico necesita
          </h2>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
            Una solución integrada de extremo a extremo que te ahorra tiempo y fideliza pacientes.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          <div style={cardStyle}>
            <div style={iconWrapperStyle}>💉</div>
            <h3 style={cardTitleStyle}>HubMed POS</h3>
            <p style={cardDescStyle}>
              Control de stock en tiempo real, alertas de stock mínimo, gestión de lotes por proveedor, fechas de vencimiento y registro rápido de dosis aplicadas.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={iconWrapperStyle}>🌐</div>
            <h3 style={cardTitleStyle}>Web Auto-Parametrizable</h3>
            <p style={cardDescStyle}>
              Personaliza tu portal desde tu panel en minutos. Sube tu foto, edita tu biografía, agrega hitos académicos, decodifica mitos y publica noticias sin saber programar.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={iconWrapperStyle}>🏷️</div>
            <h3 style={cardTitleStyle}>Dominio Personalizado</h3>
            <p style={cardDescStyle}>
              Refuerza tu marca médica personal vinculando tu propio dominio (ej: drgonzalez.com). Nosotros nos encargamos del enrutamiento y los certificados SSL.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={iconWrapperStyle}>📰</div>
            <h3 style={cardTitleStyle}>CMS de Noticias</h3>
            <p style={cardDescStyle}>
              Publica artículos de divulgación científica o boletines epidemiológicos y compártelos fácilmente con tus pacientes mediante links interactivos y optimización SEO.
            </p>
          </div>
        </div>
      </section>

      {/* ── PRECIOS SECTION ───────────────────────────────────── */}
      <section id="precios" style={{
        padding: "80px 24px",
        background: "rgba(255, 255, 255, 0.01)",
        borderTop: "1px solid rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.03)"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "32px", fontWeight: 800, color: "#ffffff", margin: "0 0 12px 0" }}>
              Planes a la medida de tu práctica médica
            </h2>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
              Suscripciones flexibles para consultorios independientes o redes de clínicas.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px", maxWidth: "1000px", margin: "0 auto" }}>
            {/* Starter Plan */}
            <div style={pricingCardStyle(false)}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "rgba(255,255,255,0.8)", margin: 0 }}>Starter</h3>
              <div style={{ fontSize: "40px", fontWeight: 800, color: "#ffffff", margin: "20px 0" }}>
                $49 <span style={{ fontSize: "14px", fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>USD / mes</span>
              </div>
              <ul style={featuresListStyle}>
                <li>✓ Portal Web Personalizado</li>
                <li>✓ HubMed POS básico (10 vacunas)</li>
                <li>✓ Subdominio `.hubmed.app`</li>
                <li>✓ Certificado SSL Gratuito</li>
                <li>✗ Módulo CMS de Noticias</li>
              </ul>
              <a href="#contacto" style={pricingButtonStyle(false)}>Elegir Plan</a>
            </div>

            {/* Pro Plan */}
            <div style={pricingCardStyle(true)}>
              <div style={{
                position: "absolute",
                top: "16px",
                right: "20px",
                background: "rgba(0, 212, 170, 0.15)",
                color: "#00D4AA",
                fontSize: "11px",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "30px",
                border: "1px solid rgba(0, 212, 170, 0.3)"
              }}>RECOMENDADO</div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Pro</h3>
              <div style={{ fontSize: "40px", fontWeight: 800, color: "#00D4AA", margin: "20px 0" }}>
                $99 <span style={{ fontSize: "14px", fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>USD / mes</span>
              </div>
              <ul style={featuresListStyle}>
                <li>✓ Portal Web Personalizado</li>
                <li>✓ HubMed POS completo (ilimitado)</li>
                <li>✓ Dominio Personalizado propio</li>
                <li>✓ CMS de Noticias y Artículos</li>
                <li>✓ Alertas de Inventario automáticas</li>
              </ul>
              <a href="#contacto" style={pricingButtonStyle(true)}>Elegir Plan</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer id="contacto" style={{
        padding: "40px 24px",
        background: "#02060c",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🛡️</span>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "16px" }}>HubMed SaaS</span>
          </div>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: 0, textAlign: "center" }}>
            © {new Date().getFullYear()} HubMed Platform. Todos los derechos reservados.<br />
            Para más información, contáctanos en soporte@hubmed.app
          </p>
        </div>
      </footer>
    </div>
  );
}

const navLinkStyle = {
  fontSize: "14px",
  fontWeight: 500,
  color: "rgba(255, 255, 255, 0.7)",
  textDecoration: "none",
  transition: "color 0.15s"
};

const cardStyle = {
  background: "rgba(15, 23, 42, 0.35)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.04)",
  borderRadius: "16px",
  padding: "32px",
  textAlign: "left" as const
};

const iconWrapperStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "48px",
  height: "48px",
  background: "rgba(0, 212, 170, 0.06)",
  border: "1px solid rgba(0, 212, 170, 0.2)",
  borderRadius: "12px",
  fontSize: "22px",
  marginBottom: "20px"
};

const cardTitleStyle = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: "18px",
  fontWeight: 800,
  color: "#ffffff",
  margin: "0 0 10px 0"
};

const cardDescStyle = {
  fontSize: "14px",
  color: "rgba(255, 255, 255, 0.6)",
  lineHeight: 1.6,
  margin: 0
};

const pricingCardStyle = (recommended: boolean) => ({
  background: recommended ? "rgba(15, 23, 42, 0.5)" : "rgba(15, 23, 42, 0.25)",
  backdropFilter: "blur(10px)",
  border: `1px solid ${recommended ? "rgba(0, 212, 170, 0.2)" : "rgba(255, 255, 255, 0.04)"}`,
  borderRadius: "20px",
  padding: "40px",
  position: "relative" as const,
  display: "flex",
  flexDirection: "column" as const,
  boxShadow: recommended ? "0 15px 30px rgba(0, 212, 170, 0.06)" : "none"
});

const featuresListStyle = {
  listStyle: "none",
  padding: 0,
  margin: "0 0 32px 0",
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
  fontSize: "14px",
  color: "rgba(255, 255, 255, 0.7)",
  textAlign: "left" as const,
  flex: 1
};

const pricingButtonStyle = (recommended: boolean) => ({
  display: "block",
  width: "100%",
  padding: "12px",
  background: recommended ? "linear-gradient(135deg, #00D4AA, #05b28e)" : "rgba(255, 255, 255, 0.04)",
  border: recommended ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "10px",
  color: recommended ? "#0c111d" : "#ffffff",
  fontSize: "14px",
  fontWeight: 700,
  textDecoration: "none",
  textAlign: "center" as const,
  transition: "all 0.15s"
});
