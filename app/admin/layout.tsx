"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "../admin.css";

const navItems = [
  { href: "/admin", icon: "🏠", label: "Dashboard", exact: true },
  { href: "/admin/vacunas", icon: "💉", label: "Vacunas", exact: false },
  { href: "/admin/noticias", icon: "📰", label: "Noticias / CMS", exact: false },
  { href: "/admin/pos", icon: "🖥️", label: "POS Express", exact: false },
  { href: "/admin/analytics", icon: "📊", label: "Analítica", exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="admin-shell" style={{ minHeight: "100vh" }}>
      {/* ── SIDEBAR ──────────────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px",
                background: "linear-gradient(135deg, var(--teal-700), var(--emerald-500))",
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
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <span className="sidebar-section-label">Portal</span>
          <Link href="/" className="sidebar-link">
            <span className="sidebar-link-icon">🌐</span>
            Ver Portal Público
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">👨‍⚕️</div>
            <div>
              <div className="sidebar-user-name">Dr. C. Torres</div>
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
