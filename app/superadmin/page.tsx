import { createClient } from "@/lib/supabase/server";
import TenantRow, { Tenant } from "./components/TenantRow";
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
    <div>
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header className="section-header">
        <div>
          <h1 className="section-title">Control de Clínicas y Portales</h1>
          <p style={{ fontSize: "14px", color: "var(--slate-500)", margin: 0 }}>
            Supervisa los portales médicos activos, gestiona facturación y crea nuevos clientes.
          </p>
        </div>
        
        {/* Onboarding Trigger button */}
        <CreateTenantModal onSuccess={refreshPage} />
      </header>

      {/* ── KPI CARDS ─────────────────────────────────────────────── */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">TOTAL CLÍNICAS</span>
            <span className="kpi-icon kpi-icon-teal">🏢</span>
          </div>
          <div className="kpi-number">{totalClinics}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">CLÍNICAS ACTIVAS</span>
            <span className="kpi-icon kpi-icon-emerald">🟢</span>
          </div>
          <div className="kpi-number" style={{ color: "var(--teal-600)" }}>{activeClinics}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">BLOQUEADAS / MORA</span>
            <span className="kpi-icon kpi-icon-rose">⚠️</span>
          </div>
          <div className="kpi-number" style={{ color: "var(--rose-600)" }}>{lockedClinics}</div>
        </div>
      </div>

      {/* ── TENANTS TABLE ─────────────────────────────────────────── */}
      <div className="inv-table-wrap">
        {error ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--rose-500)" }}>
            ⚠️ Error al recuperar las clínicas de Supabase: {error.message}
          </div>
        ) : list.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <div className="empty-state-title">No hay clínicas registradas</div>
            <div className="empty-state-sub">Haz clic en &quot;Crear Nueva Clínica&quot; para iniciar el alta.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Clínica / Doctor</th>
                  <th>Ruta (Slug) / Dominio</th>
                  <th>Plan</th>
                  <th>Estado de Pago</th>
                  <th>Habilitación</th>
                  <th>Fecha de Alta</th>
                  <th>Supervisión</th>
                </tr>
              </thead>
              <tbody>
                {list.map((tenant, idx) => (
                  <TenantRow key={tenant.id} tenant={tenant as Tenant} index={idx} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
