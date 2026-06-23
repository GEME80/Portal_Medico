"use client";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-topbar-title">Dashboard</h1>
        <div className="admin-topbar-right">
          <span className="badge badge-emerald">Sistema activo</span>
        </div>
      </div>

      <div className="admin-content">
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
            Bienvenido, Dr. Torres 👋
          </h2>
          <p style={{ color: "var(--slate-500)", fontSize: "14px" }}>
            Selecciona un módulo del panel de navegación para comenzar.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          {[
            { href: "/admin/vacunas", icon: "💉", title: "Control de Vacunas", desc: "Gestión de inventario, lotes, alertas de stock y registro de dosis aplicadas.", color: "var(--teal-800)" },
            { href: "/admin/noticias", icon: "📰", title: "CMS de Noticias", desc: "Crear, editar y publicar artículos académicos y boletines epidemiológicos.", color: "#7c3aed" },
            { href: "/admin/pos", icon: "🖥️", title: "POS Express", desc: "Pantalla de descuento rápido de dosis para el personal asistente.", color: "#0e7490" },
            { href: "/admin/analytics", icon: "📊", title: "Analítica", desc: "Dashboard de rotación de vacunas, KPIs y proyección de consumo.", color: "#b45309" },
          ].map((m, i) => (
            <Link key={i} href={m.href} style={{ textDecoration: "none" }}>
              <div className="card" style={{ padding: "28px", cursor: "pointer" }}>
                <div style={{
                  width: "52px", height: "52px", borderRadius: "var(--radius-md)",
                  background: m.color, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "24px", marginBottom: "16px",
                }}>{m.icon}</div>
                <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "16px", fontWeight: 800, marginBottom: "8px" }}>
                  {m.title}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--slate-500)", lineHeight: 1.6 }}>{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
