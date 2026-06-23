import { createClient } from "@/lib/supabase/server";
import TenantRow from "./components/TenantRow";
import CreateTenantModal from "./components/CreateTenantModal";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function SuperadminDashboardPage() {
  const supabase = await createClient();

  // Fetch all tenants
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tenants:", error);
  }

  const list = tenants || [];

  // Calculate KPIs
  const totalClinics = list.length;
  const activeClinics = list.filter((t) => t.activo).length;
  const lockedClinics = list.filter((t) => t.estado_pago !== "activo").length;

  const refreshPage = async () => {
    "use server";
    revalidatePath("/superadmin");
  };

  return (
    <div style={{ padding: "40px", fontFamily: "'Outfit', sans-serif" }}>
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 6px 0", letterSpacing: "-0.02em", color: "#ffffff" }}>
            Control de Clínicas y Portales
          </h1>
          <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0 }}>
            Supervisa los portales médicos activos, gestiona facturación y crea nuevos clientes.
          </p>
        </div>
        
        {/* Onboarding Trigger button */}
        <CreateTenantModal onSuccess={refreshPage} />
      </header>

      {/* ── KPI CARDS ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <div style={kpiCardStyle("#00D4AA")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#9ca3af" }}>TOTAL CLÍNICAS</span>
            <span style={{ fontSize: "20px" }}>🏢</span>
          </div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: "#ffffff", marginTop: "12px" }}>
            {totalClinics}
          </div>
        </div>

        <div style={kpiCardStyle("#10B981")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#9ca3af" }}>CLÍNICAS ACTIVAS</span>
            <span style={{ fontSize: "20px" }}>🟢</span>
          </div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: "#10B981", marginTop: "12px" }}>
            {activeClinics}
          </div>
        </div>

        <div style={kpiCardStyle("#EF4444")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#9ca3af" }}>BLOQUEADAS / MORA</span>
            <span style={{ fontSize: "20px" }}>⚠️</span>
          </div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: "#f87171", marginTop: "12px" }}>
            {lockedClinics}
          </div>
        </div>
      </div>

      {/* ── TENANTS TABLE ─────────────────────────────────────────── */}
      <div style={{
        background: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "16px",
        overflow: "hidden"
      }}>
        {error ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#f87171" }}>
            ⚠️ Error al recuperar las clínicas de Supabase: {error.message}
          </div>
        ) : list.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#9ca3af" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>📂</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>No hay clínicas registradas</div>
            <div style={{ fontSize: "13px", marginTop: "4px" }}>Haz clic en "Crear Nueva Clínica" para iniciar el alta.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(255, 255, 255, 0.02)" }}>
                  <th style={thStyle}>Clínica / Doctor</th>
                  <th style={thStyle}>Ruta (Slug) / Dominio</th>
                  <th style={thStyle}>Plan</th>
                  <th style={thStyle}>Estado de Pago</th>
                  <th style={thStyle}>Habilitación</th>
                  <th style={thStyle}>Fecha de Alta</th>
                  <th style={thStyle}>Supervisión</th>
                </tr>
              </thead>
              <tbody>
                {list.map((tenant, idx) => (
                  <TenantRow key={tenant.id} tenant={tenant as any} index={idx} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const kpiCardStyle = (borderColor: string) => ({
  background: "rgba(15, 23, 42, 0.4)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderLeft: `4px solid ${borderColor}`,
  borderRadius: "16px",
  padding: "20px 24px",
});

const thStyle = {
  padding: "16px 20px",
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  color: "#9ca3af",
  letterSpacing: "0.05em"
};
