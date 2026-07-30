import Link from "next/link";

export default function MarketingLandingPage() {
  return (
    <div style={{
      backgroundColor: "var(--slate-50)",
      color: "var(--slate-900)",
      minHeight: "100vh",
      fontFamily: "'Inter', sans-serif",
      overflowX: "hidden"
    }}>
      {/* ── HEADER / NAVBAR ────────────────────────────────────── */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--slate-200)"
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
              background: "linear-gradient(135deg, var(--teal-600), var(--emerald-500))",
              padding: "6px",
              borderRadius: "10px",
              lineHeight: 1,
              color: "white"
            }}>🛡️</span>
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--slate-900)"
            }}>
              HubMed <span style={{ color: "var(--teal-600)", fontWeight: 500, fontSize: "14px" }}>Platform</span>
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
              color: "var(--slate-500)",
              textDecoration: "none",
              padding: "8px 12px",
              transition: "color 0.15s"
            }}>
              Superadmin
            </Link>
            
            <Link href="/dr-torres/login" style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#ffffff",
              background: "var(--slate-900)",
              padding: "10px 18px",
              borderRadius: "10px",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.15s, background 0.15s"
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
        {/* Subtle background decoration */}
        <div style={{
          position: "absolute",
          top: "0",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "400px",
          background: "radial-gradient(ellipse at top, rgba(0, 212, 170, 0.08) 0%, rgba(255,255,255,0) 70%)",
          zIndex: 1,
          pointerEvents: "none"
        }} />

        <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 10 }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(10, 77, 92, 0.05)",
            border: "1px solid rgba(10, 77, 92, 0.1)",
            borderRadius: "30px",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--teal-700)",
            marginBottom: "24px"
          }}>
            <span style={{ width: "6px", height: "6px", background: "var(--teal-600)", borderRadius: "50%" }} />
            Plataforma SaaS Integral para Sector Salud
          </span>

          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "52px",
            fontWeight: 800,
            lineHeight: 1.15,
            color: "var(--slate-900)",
            letterSpacing: "-0.03em",
            marginBottom: "24px"
          }}>
            Gestión integral y marca personal para tu <span style={{
              background: "linear-gradient(135deg, var(--teal-600), var(--emerald-500))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>consultorio médico</span>
          </h1>

          <p style={{
            fontSize: "18px",
            color: "var(--slate-600)",
            lineHeight: 1.6,
            marginBottom: "40px",
            maxWidth: "600px",
            margin: "0 auto 40px"
          }}>
            Una sola plataforma que te brinda tu propia página web, historias clínicas bajo la regulación del Ministerio de Salud y control de inventarios en tiempo real.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#precios" style={{
              padding: "14px 28px",
              background: "var(--slate-900)",
              borderRadius: "12px",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 700,
              textDecoration: "none",
              transition: "transform 0.15s",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}>
              Comenzar Ahora
            </a>
            <Link href="/dr-torres" style={{
              padding: "14px 28px",
              background: "var(--white)",
              border: "1px solid var(--slate-200)",
              borderRadius: "12px",
              color: "var(--slate-800)",
              fontSize: "15px",
              fontWeight: 700,
              textDecoration: "none",
              transition: "background 0.15s, border-color 0.15s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}>
              Ver Demo del Portal (Dr. Torres) ↗
            </Link>
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
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "32px", fontWeight: 800, color: "var(--slate-900)", margin: "0 0 12px 0" }}>
            Todo lo que tu consultorio necesita, en un solo lugar
          </h2>
          <p style={{ fontSize: "16px", color: "var(--slate-600)", margin: 0 }}>
            La única solución verdaderamente integrada que centraliza tu clínica y atrae nuevos pacientes.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          
          <div style={cardStyle}>
            <div style={iconWrapperStyle}>🌐</div>
            <h3 style={cardTitleStyle}>Portal Web del Doctor</h3>
            <p style={cardDescStyle}>
              Página web profesional y personalizable con tu propio dominio (ej. drgonzalez.com), biografía, hitos académicos y reserva de citas integrada.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={iconWrapperStyle}>📝</div>
            <h3 style={cardTitleStyle}>Historias Clínicas Reguladas</h3>
            <p style={cardDescStyle}>
              Módulo de EMR (Electronic Medical Records) diseñado 100% bajo la normativa vigente del Ministerio de Salud. Registros seguros y auditables.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={iconWrapperStyle}>📦</div>
            <h3 style={cardTitleStyle}>Inventario en Tiempo Real</h3>
            <p style={cardDescStyle}>
              Control exacto de insumos, medicamentos y vacunas (HubMed POS). Alertas de stock mínimo, gestión de lotes y fechas de caducidad automatizadas.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={iconWrapperStyle}>📰</div>
            <h3 style={cardTitleStyle}>Divulgación y Noticias</h3>
            <p style={cardDescStyle}>
              CMS integrado para publicar artículos médicos, decodificar mitos y fidelizar a tus pacientes con contenido validado por expertos.
            </p>
          </div>
        </div>
      </section>

      {/* ── PRECIOS SECTION ───────────────────────────────────── */}
      <section id="precios" style={{
        padding: "80px 24px",
        background: "var(--white)",
        borderTop: "1px solid var(--slate-100)",
        borderBottom: "1px solid var(--slate-100)"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "32px", fontWeight: 800, color: "var(--slate-900)", margin: "0 0 12px 0" }}>
              Planes a la medida de tu práctica médica
            </h2>
            <p style={{ fontSize: "16px", color: "var(--slate-600)", margin: 0 }}>
              Suscripciones flexibles para profesionales independientes o clínicas pequeñas.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px", maxWidth: "1000px", margin: "0 auto" }}>
            {/* Starter Plan */}
            <div style={pricingCardStyle(false)}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--slate-600)", margin: 0 }}>Starter</h3>
              <div style={{ fontSize: "40px", fontWeight: 800, color: "var(--slate-900)", margin: "20px 0" }}>
                $49 <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--slate-500)" }}>USD / mes</span>
              </div>
              <ul style={featuresListStyle(false)}>
                <li>✓ Portal Web Personalizado</li>
                <li>✓ Historias Clínicas (Límite 500/mes)</li>
                <li>✓ HubMed POS Básico (10 productos)</li>
                <li>✓ Subdominio `.hubmed.app`</li>
                <li>✗ Módulo CMS de Noticias</li>
              </ul>
              <a href="#contacto" style={pricingButtonStyle(false)}>Elegir Plan</a>
            </div>

            {/* Pro Plan */}
            <div style={pricingCardStyle(true)}>
              <div style={{
                position: "absolute",
                top: "-12px",
                right: "24px",
                background: "linear-gradient(135deg, var(--teal-600), var(--emerald-500))",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 700,
                padding: "6px 14px",
                borderRadius: "30px",
                boxShadow: "0 4px 10px rgba(0,212,170,0.3)"
              }}>RECOMENDADO</div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--slate-900)", margin: 0 }}>Pro</h3>
              <div style={{ fontSize: "40px", fontWeight: 800, color: "var(--teal-600)", margin: "20px 0" }}>
                $99 <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--slate-500)" }}>USD / mes</span>
              </div>
              <ul style={featuresListStyle(true)}>
                <li>✓ Portal Web Personalizado</li>
                <li>✓ Historias Clínicas (Ilimitadas)</li>
                <li>✓ HubMed POS Completo e Ilimitado</li>
                <li>✓ Dominio Personalizado Propio</li>
                <li>✓ CMS de Noticias y Artículos</li>
              </ul>
              <a href="#contacto" style={pricingButtonStyle(true)}>Elegir Plan</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer id="contacto" style={{
        padding: "40px 24px",
        background: "var(--slate-900)",
        color: "var(--slate-400)"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--white)" }}>
            <span style={{ fontSize: "20px" }}>🛡️</span>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "16px" }}>HubMed SaaS</span>
          </div>
          <p style={{ fontSize: "13px", margin: 0, textAlign: "center" }}>
            © {new Date().getFullYear()} HubMed Platform. Todos los derechos reservados.<br />
            Para más información, contáctanos en <a href="mailto:soporte@hubmed.app" style={{ color: "var(--teal-400)" }}>soporte@hubmed.app</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

const navLinkStyle = {
  fontSize: "14px",
  fontWeight: 600,
  color: "var(--slate-600)",
  textDecoration: "none",
  transition: "color 0.15s"
};

const cardStyle = {
  background: "var(--white)",
  border: "1px solid var(--slate-200)",
  borderRadius: "16px",
  padding: "32px",
  textAlign: "left" as const,
  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
  transition: "transform 0.2s, box-shadow 0.2s"
};

const iconWrapperStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "48px",
  height: "48px",
  background: "var(--teal-50)",
  border: "1px solid var(--teal-100)",
  color: "var(--teal-700)",
  borderRadius: "12px",
  fontSize: "22px",
  marginBottom: "20px"
};

const cardTitleStyle = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: "18px",
  fontWeight: 800,
  color: "var(--slate-900)",
  margin: "0 0 10px 0"
};

const cardDescStyle = {
  fontSize: "14px",
  color: "var(--slate-600)",
  lineHeight: 1.6,
  margin: 0
};

const pricingCardStyle = (recommended: boolean) => ({
  background: "var(--white)",
  border: `2px solid ${recommended ? "var(--teal-500)" : "var(--slate-200)"}`,
  borderRadius: "20px",
  padding: "40px",
  position: "relative" as const,
  display: "flex",
  flexDirection: "column" as const,
  boxShadow: recommended ? "0 20px 40px rgba(10, 77, 92, 0.08)" : "0 4px 12px rgba(0,0,0,0.02)"
});

const featuresListStyle = (recommended: boolean) => ({
  listStyle: "none",
  padding: 0,
  margin: "0 0 32px 0",
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
  fontSize: "14px",
  color: "var(--slate-600)",
  textAlign: "left" as const,
  flex: 1
});

const pricingButtonStyle = (recommended: boolean) => ({
  display: "block",
  width: "100%",
  padding: "12px",
  background: recommended ? "var(--slate-900)" : "var(--white)",
  border: recommended ? "1px solid var(--slate-900)" : "1px solid var(--slate-300)",
  borderRadius: "10px",
  color: recommended ? "#ffffff" : "var(--slate-700)",
  fontSize: "14px",
  fontWeight: 700,
  textDecoration: "none",
  textAlign: "center" as const,
  transition: "all 0.15s"
});
