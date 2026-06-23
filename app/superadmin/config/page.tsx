import { testDbConnectionAction } from "../actions";
import ConnectionTester from "./components/ConnectionTester";

export default async function SuperadminConfigPage() {
  // Read env vars securely on server side
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "No configurado";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "No configurado";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "No configurado";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "No configurado";
  const superadminEmail = process.env.SUPERADMIN_EMAIL || "No configurado";

  // Check state
  const isSupabaseUrlOk = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isAnonKeyOk = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isServiceKeyOk = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isAppUrlOk = !!process.env.NEXT_PUBLIC_APP_URL;
  const isSuperadminEmailOk = !!process.env.SUPERADMIN_EMAIL;

  return (
    <div style={{ padding: "40px", fontFamily: "'Outfit', sans-serif" }}>
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 6px 0", letterSpacing: "-0.02em", color: "#ffffff" }}>
            Configuración de Infraestructura
          </h1>
          <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0 }}>
            Visualiza y verifica el estado de integración de base de datos y hosting de EcoVaccine.
          </p>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* ── CARD: SUPABASE CONFIGURATION ────────────────────────── */}
        <section style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <span style={{ fontSize: "22px" }}>🗄️</span>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#ffffff" }}>
              Backend (Supabase)
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <span style={labelStyle}>URL del Proyecto</span>
              <code style={codeStyle}>{supabaseUrl}</code>
            </div>

            <div>
              <span style={labelStyle}>API Key Pública (Anon Key)</span>
              <code style={codeStyle}>{supabaseAnonKey}</code>
            </div>

            <ConnectionTester serviceKey={supabaseServiceKey} />
          </div>
        </section>

        {/* ── CARD: HOSTING & VARIABLES ───────────────────────────── */}
        <section style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <span style={{ fontSize: "22px" }}>☁️</span>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#ffffff" }}>
              Hosting (Vercel) & Entorno
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <span style={labelStyle}>URL de la Aplicación</span>
              <code style={codeStyle}>
                <a href={appUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#00D4AA", textDecoration: "none" }}>
                  {appUrl} ↗
                </a>
              </code>
            </div>

            <div>
              <span style={labelStyle}>GitHub Repository</span>
              <code style={codeStyle}>
                <a href="https://github.com/GEME80/Portal_Medico" target="_blank" rel="noopener noreferrer" style={{ color: "#00D4AA", textDecoration: "none" }}>
                  GEME80/Portal_Medico ↗
                </a>
              </code>
            </div>

            <div>
              <span style={labelStyle}>Correo de Superadmin</span>
              <code style={codeStyle}>{superadminEmail}</code>
            </div>
          </div>
        </section>

        {/* ── CARD: HEALTH CHECK ──────────────────────────────────── */}
        <section style={{ ...cardStyle, gridColumn: "1fr / -1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <span style={{ fontSize: "22px" }}>📋</span>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#ffffff" }}>
              Diagnóstico de Variables del Sistema
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div style={checkStyle(isSupabaseUrlOk)}>
              <span>NEXT_PUBLIC_SUPABASE_URL</span>
              <strong>{isSupabaseUrlOk ? "Cargada ✅" : "Faltante ❌"}</strong>
            </div>

            <div style={checkStyle(isAnonKeyOk)}>
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              <strong>{isAnonKeyOk ? "Cargada ✅" : "Faltante ❌"}</strong>
            </div>

            <div style={checkStyle(isServiceKeyOk)}>
              <span>SUPABASE_SERVICE_ROLE_KEY</span>
              <strong>{isServiceKeyOk ? "Cargada ✅" : "Faltante ❌"}</strong>
            </div>

            <div style={checkStyle(isAppUrlOk)}>
              <span>NEXT_PUBLIC_APP_URL</span>
              <strong>{isAppUrlOk ? "Cargada ✅" : "Faltante ❌"}</strong>
            </div>

            <div style={checkStyle(isSuperadminEmailOk)}>
              <span>SUPERADMIN_EMAIL</span>
              <strong>{isSuperadminEmailOk ? "Cargada ✅" : "Faltante ❌"}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "rgba(15, 23, 42, 0.4)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "16px",
  padding: "24px",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#9ca3af",
  marginBottom: "6px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const codeStyle = {
  display: "block",
  padding: "10px 14px",
  background: "rgba(0, 0, 0, 0.2)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "10px",
  color: "#e2e8f0",
  fontFamily: "monospace",
  fontSize: "13px",
  overflowX: "auto" as const,
  whiteSpace: "pre" as const,
};

const checkStyle = (ok: boolean) => ({
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px",
  padding: "12px 16px",
  background: ok ? "rgba(0, 212, 170, 0.04)" : "rgba(239, 68, 68, 0.04)",
  border: `1px solid ${ok ? "rgba(0, 212, 170, 0.15)" : "rgba(239, 68, 68, 0.15)"}`,
  borderRadius: "12px",
  fontSize: "12px",
  color: "#e2e8f0",
});
