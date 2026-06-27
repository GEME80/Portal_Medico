"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { href: `/${tenantSlug}/admin`, icon: "🏠", label: "Dashboard", shortLabel: "Inicio", exact: true },
    { href: `/${tenantSlug}/admin/inventario`, icon: "📦", label: inventoryName, shortLabel: "Inventario", exact: false },
    { href: `/${tenantSlug}/admin/noticias`, icon: "📰", label: "Publicaciones", shortLabel: "Noticias", exact: false },
    { href: `/${tenantSlug}/admin/personalizar`, icon: "🎨", label: "Personalizar el Portal", shortLabel: "Portal", exact: false },
  ];

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push(`/${tenantSlug}/login`);
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const activeItem = navItems.find(item => isActive(item.href, item.exact));
  const activeLabel = activeItem?.label || "Admin";

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
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.6,
              margin: "0 0 32px 0"
            }}>
              Tu suscripción tiene un pago pendiente. Por favor regulariza tu situación para continuar usando el panel de administración.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  minWidth: "120px",
                  padding: "14px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "14px",
                  fontWeight: 700,
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                  fontFamily: "inherit",
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
                onMouseOut={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
              >
                Cerrar Sesión
              </button>
              
              <a
                href="mailto:soporte@hubmed.app?subject=Reactivacion%20de%20Cuenta"
                style={{
                  flex: 1,
                  minWidth: "120px",
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

      {/* ── MOBILE HEADER ─────────────────────────────────────────── */}
      <header className="admin-mobile-header">
        <button
          className="admin-hamburger-btn"
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menú"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <span className="admin-mobile-title">{activeLabel}</span>
        <Link href={`/${tenantSlug}`} target="_blank" className="admin-mobile-portal-btn" aria-label="Ver portal">
          <img src="/icon.png" alt="Portal" style={{ width: "26px", height: "26px", borderRadius: "6px", objectFit: "cover" }} />
        </Link>
      </header>

      {/* ── DRAWER OVERLAY ────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="admin-drawer-overlay"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── DRAWER SIDEBAR (mobile) ───────────────────────────────── */}
      <div className={`admin-drawer${drawerOpen ? " open" : ""}`}>
        <div className="sidebar-brand" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href={`/${tenantSlug}/admin`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px",
                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                borderRadius: "var(--radius-md)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px",
              }}>💉</div>
              <div>
                <div className="sidebar-brand-name">HubMed</div>
                <div className="sidebar-brand-sub">Panel Admin</div>
              </div>
            </Link>
            <button
              onClick={() => setDrawerOpen(false)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "8px", borderRadius: "8px" }}
              aria-label="Cerrar menú"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1 }} aria-label="Menú móvil">
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

          <span className="sidebar-section-label">Portal</span>
          <Link href={`/${tenantSlug}`} className="sidebar-link" target="_blank" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center" }}>
              <img src="/icon.png" alt="Icono" style={{ width: "18px", height: "18px", marginRight: "12px", borderRadius: "4px" }} />
              <span>Ver Portal Público</span>
            </span>
            <span style={{ opacity: 0.5, fontSize: "14px" }}>↗</span>
          </Link>

          <span className="sidebar-section-label">Configuración / Cuenta</span>
          <button
            onClick={handleLogout}
            className="sidebar-link"
            style={{ background: "transparent", border: "none", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit", marginTop: "4px" }}
          >
             <span className="sidebar-link-icon">🚪</span> Cerrar Sesión
          </button>
        </nav>

        <div className="sidebar-footer" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="sidebar-user" style={{ background: "rgba(255, 255, 255, 0.03)", padding: "12px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "14px" }}>
            <img src="/icon.png" alt="Logo" style={{ width: "42px", height: "42px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
            <div>
              <div className="sidebar-user-name" style={{ fontSize: "15px", fontWeight: "700" }}>{doctorName}</div>
              <div className="sidebar-user-role">Administrador</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DESKTOP SIDEBAR ───────────────────────────────────────── */}
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
                <div className="sidebar-brand-name">HubMed</div>
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

          <span className="sidebar-section-label">Portal</span>
          <Link href={`/${tenantSlug}`} className="sidebar-link" target="_blank" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center" }}>
              <img src="/icon.png" alt="Icono" style={{ width: "18px", height: "18px", marginRight: "12px", borderRadius: "4px" }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling!.removeAttribute('style'); }} />
              <span className="sidebar-link-icon" style={{ display: "none" }}>🌐</span>
              Ver Portal Público
            </span>
            <span style={{ opacity: 0.5, fontSize: "14px" }}>↗</span>
          </Link>

          <span className="sidebar-section-label">Configuración / Cuenta</span>
          <button
            onClick={handleLogout}
            className="sidebar-link"
            style={{ background: "transparent", border: "none", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit", marginTop: "4px" }}
          >
             <span className="sidebar-link-icon">🚪</span> Cerrar Sesión
          </button>
        </nav>

        <div className="sidebar-footer" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="sidebar-user" style={{ background: "rgba(255, 255, 255, 0.03)", padding: "12px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "14px" }}>
            <img src="/icon.png" alt="Logo" style={{ width: "42px", height: "42px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
            <div>
              <div className="sidebar-user-name" style={{ fontSize: "15px", fontWeight: "700" }}>{doctorName}</div>
              <div className="sidebar-user-role">Administrador</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
      <div className="admin-main">
        {children}
      </div>

      {/* ── BOTTOM TAB BAR (mobile only) ─────────────────────────── */}
      <nav className="admin-bottom-nav" aria-label="Navegación principal">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-bottom-tab${isActive(item.href, item.exact) ? " active" : ""}`}
            aria-current={isActive(item.href, item.exact) ? "page" : undefined}
            style={isActive(item.href, item.exact) ? { color: accentColor } : undefined}
          >
            <span className="admin-bottom-tab-icon">{item.icon}</span>
            <span className="admin-bottom-tab-label">{item.shortLabel}</span>
            {isActive(item.href, item.exact) && (
              <span className="admin-bottom-tab-dot" style={{ background: accentColor }} />
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
