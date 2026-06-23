"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "../../admin.css";

interface AdminShellProps {
  children: React.ReactNode;
  tenantSlug: string;
  doctorName: string;
  primaryColor: string;
  accentColor: string;
}

export default function AdminShell({
  children,
  tenantSlug,
  doctorName,
  primaryColor,
  accentColor
}: AdminShellProps) {
  const pathname = usePathname();

  const navItems = [
    { href: `/${tenantSlug}/admin`, icon: "🏠", label: "Dashboard", exact: true },
    { href: `/${tenantSlug}/admin/vacunas`, icon: "💉", label: "Vacunas", exact: false },
    { href: `/${tenantSlug}/admin/personalizar`, icon: "🎨", label: "Personalizar Home", exact: false },
  ];

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="admin-shell" style={{ minHeight: "100vh" }}>
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
          <span className="sidebar-section-label">Módulos</span>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link${isActive(item.href, item.exact) ? " active" : ""}`}
              aria-current={isActive(item.href, item.exact) ? "page" : undefined}
              style={isActive(item.href, item.exact) ? {
                background: `${primaryColor}12`,
                color: primaryColor,
                borderLeftColor: primaryColor
              } : undefined}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <span className="sidebar-section-label">Portal</span>
          <Link href={`/${tenantSlug}`} className="sidebar-link" target="_blank">
            <span className="sidebar-link-icon">🌐</span>
            Ver Portal Público
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
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
