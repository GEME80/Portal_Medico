"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "../../admin.css";

interface AdminShellProps {
  children: React.ReactNode;
  tenantSlug: string;
  doctorName: string;
  primaryColor: string;
  accentColor: string;
  inventoryName?: string;
  isMora?: boolean;
}

export default function AdminShell({
  children,
  tenantSlug,
  doctorName,
  primaryColor,
  accentColor,
  inventoryName = "Inventario",
  isMora = false
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const navItems = [
    { href: `/${tenantSlug}/admin`, icon: "🏠", label: "Dashboard", exact: true },
    { href: `/${tenantSlug}/admin/inventario`, icon: "📦", label: inventoryName, exact: false },
    { href: `/${tenantSlug}/admin/personalizar`, icon: "🎨", label: "Personalizar Home", exact: false },
    { href: `/${tenantSlug}/admin/noticias`, icon: "📰", label: "Publicaciones", exact: false },
  ];

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push(`/${tenantSlug}/login`);
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <div className="admin-shell" style={{ minHeight: "100vh", position: "relative" }}>
      {/* ── MORA / PAGO EXPIRADO BLOCKING OVERLAY ───────────────── */}
      {isMora && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(11, 15, 25, 0.85)",
          backdropFilter: "blur(16px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px"
        }}>
          <div style={{
            maxWidth: "480px",
            width: "100%",
            background: "#0f172a",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "24px",
            padding: "40px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(245, 158, 11, 0.1)",
            textAlign: "center",
            fontFamily: "'Outfit', sans-serif"
          }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "20px",
              fontSize: "32px",
              marginBottom: "24px",
              color: "#f59e0b"
            }}>
              ⚠️
            </div>
            
            <h2 style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#ffffff",
              margin: "0 0 12px 0",
              letterSpacing: "-0.02em"
            }}>
              Suscripción en Mora
            </h2>
            
            <p style={{
              fontSize: "15px",
              color: "#9ca3af",
              lineHeight: 1.6,
              margin: "0 0 24px 0"
            }}>
              Estimado(a) <strong>{doctorName}</strong>, el acceso a su panel de administración de EcoVaccine se encuentra temporalmente bloqueado debido a un saldo pendiente de pago en su suscripción.
            </p>
            
            <div style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "32px",
              fontSize: "13px",
              color: "#d1d5db",
              textAlign: "left",
              lineHeight: 1.5
            }}>
              ℹ️ <strong>Nota:</strong> Su página web pública y el control de vacunas para sus pacientes continúan activos. Para reactivar el panel administrativo, póngase en contacto con soporte técnico o realice su pago mensual.
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.15s",
                  fontFamily: "inherit"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
                onMouseOut={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
              >
                Cerrar Sesión
              </button>
              
              <a
                href="mailto:soporte@ecovaccine.app?subject=Reactivacion%20de%20Cuenta"
                style={{
                  flex: 1,
                  padding: "14px",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  borderRadius: "12px",
                  color: "#0f172a",
                  fontSize: "14px",
                  fontWeight: 700,
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                  fontFamily: "inherit",
                  display: "inline-block"
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
              >
                Contactar Soporte
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ──────────────────────────────────────────────── */}
      <aside className="admin-sidebar" style={{ borderRight: "1px solid var(--slate-200)" }}>
        <div className="sidebar-brand">
          <Link href={`/${tenantSlug}/admin`} style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px",
                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                borderRadius: "var(--radius-md)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px",
              }}>💉</div>
              <div>
                <div className="sidebar-brand-name">EcoVaccine</div>
                <div className="sidebar-brand-sub">Panel Admin</div>
              </div>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación del panel admin">
          <span className="sidebar-section-label">Gestión Operativa</span>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link${isActive(item.href, item.exact) ? " active" : ""}`}
              aria-current={isActive(item.href, item.exact) ? "page" : undefined}
              style={isActive(item.href, item.exact) ? {
                background: "rgba(255, 255, 255, 0.08)",
                color: "#ffffff",
                borderLeft: `3px solid ${accentColor}`
              } : undefined}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.05)", margin: "12px 0" }}></div>

          <span className="sidebar-section-label">Configuración / Cuenta</span>
          <Link href={`/${tenantSlug}/admin/personalizar`} className="sidebar-link">
             <span className="sidebar-link-icon">👤</span> Tu Perfil
          </Link>
          <button 
            onClick={handleLogout} 
            className="sidebar-link" 
            style={{ background: "transparent", border: "none", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}
          >
             <span className="sidebar-link-icon">🚪</span> Cerrar Sesión
          </button>

          <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.05)", margin: "12px 0" }}></div>

          <span className="sidebar-section-label">Portal</span>
          <Link href={`/${tenantSlug}`} className="sidebar-link" target="_blank" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span><span className="sidebar-link-icon">🌐</span> Ver Portal Público</span>
            <span style={{ opacity: 0.5, fontSize: "14px" }}>↗</span>
          </Link>
        </nav>

        <div className="sidebar-footer" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="sidebar-user" style={{ background: "rgba(255, 255, 255, 0.03)", padding: "12px", borderRadius: "12px" }}>
            <div className="sidebar-avatar">👨‍⚕️</div>
            <div>
              <div className="sidebar-user-name">{doctorName}</div>
              <div className="sidebar-user-role">Administrador</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────── */}
      <div className="admin-main">
        {children}
      </div>
    </div>
  );
}
