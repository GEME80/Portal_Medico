"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { payInvoiceAction } from "./actions";
import "../../admin.css";

interface AdminShellProps {
  children: React.ReactNode;
  tenantSlug: string;
  doctorName: string;
  primaryColor: string;
  accentColor: string;
  inventoryName?: string;
  isMora?: boolean;
  isSuspended?: boolean;
  daysRemaining?: number;
  isSuperadmin?: boolean;
  inventarioHabilitado?: boolean;
}

export default function AdminShell({
  children,
  tenantSlug,
  doctorName,
  primaryColor,
  accentColor,
  inventoryName = "Inventario",
  isMora = false,
  isSuspended = false,
  daysRemaining = 5,
  isSuperadmin = false,
  inventarioHabilitado = true
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const rawNavItems = [
    { href: `/${tenantSlug}/admin`, icon: "🏠", label: "Dashboard", shortLabel: "Inicio", exact: true, key: "dashboard" },
    { href: `/${tenantSlug}/admin/pacientes`, icon: "🧑‍⚕️", label: "Gestión Pacientes", shortLabel: "Pacientes", exact: false, key: "pacientes" },
    { href: `/${tenantSlug}/admin/inventario`, icon: "📦", label: inventoryName, shortLabel: "Inventario", exact: false, key: "inventario" },
    { href: `/${tenantSlug}/admin/noticias`, icon: "📰", label: "Publicaciones", shortLabel: "Noticias", exact: false, key: "noticias" },
    { href: `/${tenantSlug}/admin/personalizar`, icon: "🎨", label: "Personalizar el Portal", shortLabel: "Portal", exact: false, key: "personalizar" },
  ];

  const navItems = rawNavItems.filter(item => {
    if (item.key === "inventario" && !inventarioHabilitado && !isSuperadmin) {
      return false;
    }
    return true;
  });

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

  const handlePaymentSimulation = async () => {
    setIsPaying(true);
    try {
      const res = await payInvoiceAction(tenantSlug);
      if (res.success) {
        // Force a hard reload so the layout re-reads tenant state from server
        window.location.reload();
      } else {
        alert(`Error al simular pago: ${res.error}`);
      }
    } catch (e) {
      console.error(e);
      alert("Ocurrió un error inesperado al procesar el pago.");
    } finally {
      setIsPaying(false);
    }
  };

  const activeItem = navItems.find(item => isActive(item.href, item.exact));
  const activeLabel = activeItem?.label || "Admin";

  return (
    <div className="admin-shell" style={{ minHeight: "100vh", position: "relative" }}>


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
            isSuspended ? (
              <span
                key={item.href}
                className="sidebar-link"
                style={{ opacity: 0.35, cursor: "not-allowed", pointerEvents: "none", userSelect: "none" }}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
              </span>
            ) : (
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
            )
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
            isSuspended ? (
              <span
                key={item.href}
                className="sidebar-link"
                style={{ opacity: 0.35, cursor: "not-allowed", pointerEvents: "none", userSelect: "none" }}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
              </span>
            ) : (
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
            )
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
      <div className="admin-main" style={{ position: "relative" }}>
        {/* ── EN MORA: Banner sticky en la parte superior ── */}
        {isMora && (
          <div style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            color: "#1a0a00",
            padding: "14px 24px",
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 4px 16px rgba(245, 158, 11, 0.35)",
            position: "sticky",
            top: 0,
            zIndex: 99,
            fontFamily: "'Outfit', sans-serif",
            flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
              <span style={{ fontSize: "22px" }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: "15px" }}>Suscripción en mora</div>
                <div style={{ fontWeight: 500, opacity: 0.85, fontSize: "13px" }}>
                  Tu cuenta vence en <strong>{daysRemaining} {daysRemaining === 1 ? "día" : "días"}</strong>. Realiza el pago para evitar la suspensión del servicio.
                </div>
              </div>
            </div>
            <button
              onClick={handlePaymentSimulation}
              disabled={isPaying}
              style={{
                background: "#1a0a00",
                color: "#fde68a",
                border: "2px solid rgba(255,255,255,0.2)",
                padding: "8px 20px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: isPaying ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                fontFamily: "inherit",
                letterSpacing: "0.3px",
                opacity: isPaying ? 0.7 : 1,
              }}
            >
              {isPaying ? "⏳ Procesando..." : "💳 Pagar Ahora"}
            </button>
          </div>
        )}

        {/* ── SUSPENDIDO: Modal bloqueador sobre el contenido ── */}
        {isSuspended && (
          <div style={{
            position: "absolute",
            inset: 0,
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15, 23, 42, 0.88)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}>
            {/* Watermark diagonal */}
            <div style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              pointerEvents: "none",
              opacity: 0.06,
              display: "flex",
              flexWrap: "wrap",
              alignContent: "space-around",
              justifyContent: "space-around",
              transform: "rotate(-20deg) scale(1.4)",
            }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} style={{
                  fontSize: "32px",
                  fontWeight: 900,
                  color: "#ef4444",
                  fontFamily: "sans-serif",
                  margin: "32px",
                  whiteSpace: "nowrap",
                  letterSpacing: "4px",
                }}>
                  SUSPENDIDO
                </div>
              ))}
            </div>

            {/* Modal card */}
            <div style={{
              background: "#0f172a",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "20px",
              padding: "48px 40px",
              maxWidth: "480px",
              width: "90%",
              textAlign: "center",
              position: "relative",
              zIndex: 1,
              boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(239,68,68,0.1)",
            }}>
              <div style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7f1d1d, #ef4444)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                margin: "0 auto 20px",
                boxShadow: "0 8px 24px rgba(239,68,68,0.4)",
              }}>🔒</div>

              <h2 style={{
                color: "#fca5a5",
                fontSize: "22px",
                fontWeight: 800,
                margin: "0 0 12px",
                fontFamily: "'Outfit', sans-serif",
              }}>Portal Suspendido</h2>

              <p style={{
                color: "#94a3b8",
                fontSize: "14px",
                lineHeight: 1.6,
                margin: "0 0 32px",
                fontFamily: "'Outfit', sans-serif",
              }}>
                El acceso a este portal ha sido suspendido por falta de pago. Para reactivar tu cuenta, realiza el pago de tu suscripción.
              </p>

              <button
                onClick={handlePaymentSimulation}
                disabled={isPaying}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#fff",
                  border: "none",
                  padding: "14px 32px",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: 800,
                  cursor: isPaying ? "not-allowed" : "pointer",
                  width: "100%",
                  justifyContent: "center",
                  fontFamily: "'Outfit', sans-serif",
                  letterSpacing: "0.3px",
                  opacity: isPaying ? 0.7 : 1,
                  boxShadow: "0 4px 16px rgba(239,68,68,0.4)",
                  transition: "all 0.15s",
                }}
              >
                {isPaying ? "⏳ Procesando pago..." : "💳 Pagar y Reactivar Portal"}
              </button>

              <p style={{
                color: "#475569",
                fontSize: "12px",
                marginTop: "16px",
                fontFamily: "'Outfit', sans-serif",
              }}>
                ¿Necesitas ayuda? Contacta a soporte en{" "}
                <a href="mailto:soporte@hubmed.co" style={{ color: "#64748b", textDecoration: "underline" }}>soporte@hubmed.co</a>
              </p>
            </div>
          </div>
        )}

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
