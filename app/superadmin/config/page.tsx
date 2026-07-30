import ConnectionTester from "./components/ConnectionTester";
import MaskedKey from "./components/MaskedKey";
import Cie10Seeder from "./components/Cie10Seeder";


export default async function SuperadminConfigPage() {
  // Read env vars securely on server side
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "No configurado";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "No configurado";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "No configurado";
  
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL 
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` 
    : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || vercelUrl || "No configurado";
  const superadminEmail = process.env.SUPERADMIN_EMAIL || "No configurado";

  // Check state
  const isSupabaseUrlOk = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isAnonKeyOk = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isServiceKeyOk = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isAppUrlOk = !!process.env.NEXT_PUBLIC_APP_URL;
  const isFallbackActive = !process.env.NEXT_PUBLIC_APP_URL && !!vercelUrl;
  const isSuperadminEmailOk = !!process.env.SUPERADMIN_EMAIL;

  return (
    <div>
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header className="section-header">
        <div>
          <h1 className="section-title">Configuración de Infraestructura</h1>
          <p style={{ fontSize: "14px", color: "var(--slate-500)", margin: 0 }}>
            Visualiza y verifica el estado de integración de base de datos y hosting de HubMed.
          </p>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* ── CARD: SUPABASE CONFIGURATION ────────────────────────── */}
        <section className="kpi-card" style={{ padding: "32px", gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <span className="kpi-icon kpi-icon-teal">🗄️</span>
            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "var(--slate-900)" }}>
              Backend (Supabase)
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <span style={labelStyle}>URL del Proyecto</span>
              <code style={codeStyle}>{supabaseUrl}</code>
            </div>

            <MaskedKey label="API Key Pública (Anon Key)" secretKey={supabaseAnonKey} />

            <ConnectionTester serviceKey={supabaseServiceKey} />

            <Cie10Seeder />
          </div>
        </section>

        {/* ── CARD: HOSTING & VARIABLES ───────────────────────────── */}
        <section className="kpi-card" style={{ padding: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <span className="kpi-icon kpi-icon-emerald">☁️</span>
            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "var(--slate-900)" }}>
              Hosting (Vercel) & Entorno
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <span style={labelStyle}>URL de la Aplicación</span>
              <code style={codeStyle}>
                <a href={appUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal-600)", textDecoration: "none" }}>
                  {appUrl} ↗
                </a>
              </code>
            </div>

            <div>
              <span style={labelStyle}>GitHub Repository</span>
              <code style={codeStyle}>
                <a href="https://github.com/GEME80/Portal_Medico" target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal-600)", textDecoration: "none" }}>
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
        <section className="kpi-card" style={{ padding: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <span className="kpi-icon kpi-icon-amber">📋</span>
            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "var(--slate-900)" }}>
              Diagnóstico de Variables
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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

            <div style={checkStyle(isAppUrlOk || isFallbackActive)}>
              <span>NEXT_PUBLIC_APP_URL</span>
              <strong>
                {isAppUrlOk 
                  ? "Cargada ✅" 
                  : isFallbackActive 
                    ? "Uso de fallback (Vercel) ⚠️" 
                    : "Faltante ❌"}
              </strong>
            </div>

            <div style={checkStyle(isSuperadminEmailOk)}>
              <span>SUPERADMIN_EMAIL</span>
              <strong>{isSuperadminEmailOk ? "Cargada ✅" : "Faltante ❌"}</strong>
            </div>
          </div>
        </section>

        {/* ALERTA DE FALLBACK */}
        {!isAppUrlOk && (
          <section className="kpi-card" style={{ gridColumn: "1 / -1", background: "var(--amber-50)", borderColor: "var(--amber-200)" }}>
            <div style={{ padding: "12px", fontSize: "14px", lineHeight: "1.6", color: "var(--amber-900)" }}>
              <span style={{ fontWeight: 800, display: "block", marginBottom: "8px" }}>
                💡 Nota informativa sobre NEXT_PUBLIC_APP_URL:
              </span>
              Esta variable define la URL pública principal de la aplicación (necesaria para generar enlaces de invitación de administradores y redirecciones). 
              {isFallbackActive ? (
                <> Actualmente, el sistema está usando la variable dinámica de Vercel (<code>{appUrl}</code>) como fallback automático.</>
              ) : (
                <> No se detectaron fallbacks de entorno de Vercel activos.</>
              )}
              <br />
              <strong style={{ display: "block", marginTop: "12px", color: "var(--teal-700)" }}>Para resolver esto y lograr un estado impecable:</strong>
              1. Ve al panel de control de tu proyecto en <strong>Vercel</strong> &gt; <strong>Settings</strong> &gt; <strong>Environment Variables</strong>.<br />
              2. Agrega una variable con nombre <code>NEXT_PUBLIC_APP_URL</code> y valor <code>https://portal-medico-five.vercel.app</code>.<br />
              3. Marca los entornos correspondientes (Production, Preview, Development) y presiona Save.<br />
              4. Realiza un nuevo despliegue (redeploy) en Vercel para aplicar los cambios.
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  color: "var(--slate-500)",
  marginBottom: "6px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const codeStyle = {
  display: "block",
  padding: "10px 14px",
  background: "var(--slate-50)",
  border: "1px solid var(--slate-200)",
  borderRadius: "10px",
  color: "var(--slate-700)",
  fontFamily: "monospace",
  fontSize: "13px",
  overflowX: "auto" as const,
  whiteSpace: "pre" as const,
};

const checkStyle = (ok: boolean) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  background: ok ? "var(--emerald-50)" : "var(--rose-50)",
  border: `1px solid ${ok ? "var(--emerald-200)" : "var(--rose-200)"}`,
  borderRadius: "12px",
  fontSize: "13px",
  color: ok ? "var(--emerald-900)" : "var(--rose-900)",
});
