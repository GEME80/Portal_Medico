"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { payInvoiceAction } from "./actions";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Package,
  FileSpreadsheet,
  Stethoscope,
  Newspaper,
  Palette,
  Activity,
  LogOut,
  ExternalLink,
  AlertTriangle,
  CreditCard,
  Lock,
  Menu,
  X,
  Clock,
  CheckCircle2,
  Crown,
  Settings
} from "lucide-react";
import "../../admin.css";
import "./doctor-portal.css";
import UserProfileModal from "./UserProfileModal";

interface AdminShellProps {
  children: React.ReactNode;
  tenantSlug: string;
  doctorName: string;
  userDisplayName?: string;
  userEmail?: string;
  userRole?: "superadmin" | "admin" | "medico" | "recepcion";
  userPermisos?: {
    citas?: boolean;
    pacientes_demograficos?: boolean;
    inventario?: boolean;
    noticias?: boolean;
  };
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
  userDisplayName,
  userEmail,
  userRole = "medico",
  userPermisos,
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
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const restrictedNotice = searchParams?.get("alerta") === "restringido_medico";

  const rawNavItems = [
    { href: `/${tenantSlug}/admin`, icon: LayoutDashboard, label: "Dashboard", shortLabel: "Inicio", exact: true, key: "dashboard" },
    { href: `/${tenantSlug}/admin/citas`, icon: CalendarDays, label: "Agenda & Citas", shortLabel: "Citas", exact: false, key: "citas" },
    { href: `/${tenantSlug}/admin/pacientes`, icon: Users, label: "Gestión Pacientes", shortLabel: "Pacientes", exact: false, key: "pacientes" },
    { href: `/${tenantSlug}/admin/inventario`, icon: Package, label: inventoryName, shortLabel: "Vacunas", exact: false, key: "inventario" },
    { href: `/${tenantSlug}/admin/reportes`, icon: FileSpreadsheet, label: "Reportes RIPS", shortLabel: "RIPS", exact: false, key: "reportes" },
    { href: `/${tenantSlug}/admin/equipo`, icon: Stethoscope, label: "Equipo Médico", shortLabel: "Equipo", exact: false, key: "equipo" },
    { href: `/${tenantSlug}/admin/noticias`, icon: Newspaper, label: "Publicaciones", shortLabel: "Noticias", exact: false, key: "noticias" },
    { href: `/${tenantSlug}/admin/personalizar`, icon: Palette, label: "Personalizar el Portal", shortLabel: "Portal", exact: false, key: "personalizar" },
  ];

  const isRecepcion = userRole === "recepcion";

  const navItems = rawNavItems.filter(item => {
    if (isRecepcion) {
      // Opciones estrictamente bloqueadas para personal administrativo
      if (item.key === "reportes" || item.key === "equipo" || item.key === "personalizar") {
        return false;
      }
      if (item.key === "citas" && userPermisos?.citas === false) {
        return false;
      }
      if (item.key === "pacientes" && userPermisos?.pacientes_demograficos === false) {
        return false;
      }
      if (item.key === "inventario" && (!userPermisos?.inventario || !inventarioHabilitado)) {
        return false;
      }
      if (item.key === "noticias" && userPermisos?.noticias === false) {
        return false;
      }
    } else {
      if (item.key === "inventario" && !inventarioHabilitado && !isSuperadmin) {
        return false;
      }
    }
    return true;
  });

  // Instant optimistic active state for immediate click responsiveness
  const currentPath = pendingHref || pathname;
  const isActive = (href: string, exact: boolean) =>
    exact ? currentPath === href : currentPath.startsWith(href);

  // Close drawer and clear pending navigation state on route change
  useEffect(() => {
    setDrawerOpen(false);
    setPendingHref(null);
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
          <Menu size={22} strokeWidth={2.2} />
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
                color: "#ffffff"
              }}>
                <Activity size={18} strokeWidth={2.5} />
              </div>
              <div>
                <div className="sidebar-brand-name">HubMed</div>
                <div className="sidebar-brand-sub">Panel Médico</div>
              </div>
            </Link>
            <button
              onClick={() => setDrawerOpen(false)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "8px", borderRadius: "8px" }}
              aria-label="Cerrar menú"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1 }} aria-label="Menú móvil">
          <span className="sidebar-section-label">Gestión Clínica</span>
          {navItems.map((item) => (
            isSuspended ? (
              <span
                key={item.href}
                className="sidebar-link"
                style={{ opacity: 0.35, cursor: "not-allowed", pointerEvents: "none", userSelect: "none" }}
              >
                <span className="sidebar-link-icon"><item.icon size={18} strokeWidth={2} /></span>
                {item.label}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => setPendingHref(item.href)}
                className={`sidebar-link${isActive(item.href, item.exact) ? " active" : ""}`}
                aria-current={isActive(item.href, item.exact) ? "page" : undefined}
                style={isActive(item.href, item.exact) ? {
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                  borderLeft: `3px solid ${accentColor}`
                } : undefined}
              >
                <span className="sidebar-link-icon"><item.icon size={18} strokeWidth={2} /></span>
                {item.label}
              </Link>
            )
          ))}

          <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.05)", margin: "12px 0" }}></div>

          <span className="sidebar-section-label">Portal Público</span>
          <Link href={`/${tenantSlug}`} className="sidebar-link" target="_blank" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img src="/icon.png" alt="Icono" style={{ width: "18px", height: "18px", borderRadius: "4px" }} />
              <span>Ver Portal Público</span>
            </span>
            <ExternalLink size={14} style={{ opacity: 0.6 }} />
          </Link>

          <span className="sidebar-section-label">Sesión</span>
          {isSuperadmin && (
            <a
              href="/superadmin"
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar-link"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fbbf24" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Crown size={16} color="#fbbf24" strokeWidth={2} />
                <span style={{ fontWeight: 600 }}>Consola SuperAdmin</span>
              </span>
              <ExternalLink size={14} style={{ opacity: 0.8 }} />
            </a>
          )}
          <button
            onClick={handleLogout}
            className="sidebar-link"
            style={{ background: "transparent", border: "none", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit", marginTop: "4px" }}
          >
             <span className="sidebar-link-icon"><LogOut size={16} strokeWidth={2} /></span> Cerrar Sesión
          </button>
        </nav>

        <div className="sidebar-footer" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            onClick={() => {
              setDrawerOpen(false);
              setProfileModalOpen(true);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setDrawerOpen(false);
                setProfileModalOpen(true);
              }
            }}
            className="sidebar-user"
            title="Clic para gestionar tu cuenta o cambiar contraseña"
            style={{
              background: isSuperadmin ? "rgba(245, 158, 11, 0.08)" : "rgba(255, 255, 255, 0.03)",
              border: isSuperadmin ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
              padding: "10px 12px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: isSuperadmin
                  ? "linear-gradient(135deg, #f59e0b, #d97706)"
                  : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                flexShrink: 0,
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            >
              {isSuperadmin ? <Crown size={20} /> : isRecepcion ? <Users size={18} /> : <Stethoscope size={18} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="sidebar-user-name"
                style={{
                  fontSize: "13.5px",
                  fontWeight: "700",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: "#f8fafc",
                }}
              >
                {userDisplayName || doctorName}
              </div>
              {userEmail && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(255, 255, 255, 0.55)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {userEmail}
                </div>
              )}
              <div
                className="sidebar-user-role"
                style={{
                  fontSize: "11px",
                  color: isSuperadmin ? "#fbbf24" : accentColor,
                  fontWeight: 600,
                  marginTop: "1px",
                }}
              >
                {isRecepcion ? "Personal Administrativo" : isSuperadmin ? "👑 SuperAdmin" : "Médico Especialista"}
              </div>
            </div>
            <Settings size={15} style={{ color: "rgba(255, 255, 255, 0.4)", flexShrink: 0 }} />
          </div>
        </div>
      </div>

      {/* ── DESKTOP SIDEBAR ───────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <Link href={`/${tenantSlug}/admin`} style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px",
                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                borderRadius: "var(--radius-md)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#ffffff"
              }}>
                <Activity size={18} strokeWidth={2.5} />
              </div>
              <div>
                <div className="sidebar-brand-name">HubMed</div>
                <div className="sidebar-brand-sub">Panel Médico</div>
              </div>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación del panel admin">
          <span className="sidebar-section-label">Gestión Clínica</span>
          {navItems.map((item) => (
            isSuspended ? (
              <span
                key={item.href}
                className="sidebar-link"
                style={{ opacity: 0.35, cursor: "not-allowed", pointerEvents: "none", userSelect: "none" }}
              >
                <span className="sidebar-link-icon"><item.icon size={18} strokeWidth={2} /></span>
                {item.label}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => setPendingHref(item.href)}
                className={`sidebar-link${isActive(item.href, item.exact) ? " active" : ""}`}
                aria-current={isActive(item.href, item.exact) ? "page" : undefined}
                style={isActive(item.href, item.exact) ? {
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                  borderLeft: `3px solid ${accentColor}`
                } : undefined}
              >
                <span className="sidebar-link-icon"><item.icon size={18} strokeWidth={2} /></span>
                {item.label}
              </Link>
            )
          ))}


          <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.05)", margin: "12px 0" }}></div>

          <span className="sidebar-section-label">Portal Público</span>
          <Link href={`/${tenantSlug}`} className="sidebar-link" target="_blank" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img src="/icon.png" alt="Icono" style={{ width: "18px", height: "18px", borderRadius: "4px" }} />
              <span>Ver Portal Público</span>
            </span>
            <ExternalLink size={14} style={{ opacity: 0.6 }} />
          </Link>

          <span className="sidebar-section-label">Sesión</span>
          {isSuperadmin && (
            <a
              href="/superadmin"
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar-link"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fbbf24" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Crown size={16} color="#fbbf24" strokeWidth={2} />
                <span style={{ fontWeight: 600 }}>Consola SuperAdmin</span>
              </span>
              <ExternalLink size={14} style={{ opacity: 0.8 }} />
            </a>
          )}
          <button
            onClick={handleLogout}
            className="sidebar-link"
            style={{ background: "transparent", border: "none", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit", marginTop: "4px" }}
          >
             <span className="sidebar-link-icon"><LogOut size={16} strokeWidth={2} /></span> Cerrar Sesión
          </button>
        </nav>

        <div className="sidebar-footer" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            onClick={() => setProfileModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setProfileModalOpen(true);
            }}
            className="sidebar-user"
            title="Clic para gestionar tu cuenta o cambiar contraseña"
            style={{
              background: isSuperadmin ? "rgba(245, 158, 11, 0.08)" : "rgba(255, 255, 255, 0.03)",
              border: isSuperadmin ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
              padding: "10px 12px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: isSuperadmin
                  ? "linear-gradient(135deg, #f59e0b, #d97706)"
                  : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                flexShrink: 0,
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            >
              {isSuperadmin ? <Crown size={20} /> : isRecepcion ? <Users size={18} /> : <Stethoscope size={18} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="sidebar-user-name"
                style={{
                  fontSize: "13.5px",
                  fontWeight: "700",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: "#f8fafc",
                }}
              >
                {userDisplayName || doctorName}
              </div>
              {userEmail && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(255, 255, 255, 0.55)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {userEmail}
                </div>
              )}
              <div
                className="sidebar-user-role"
                style={{
                  fontSize: "11px",
                  color: isSuperadmin ? "#fbbf24" : accentColor,
                  fontWeight: 600,
                  marginTop: "1px",
                }}
              >
                {isRecepcion ? "Personal Administrativo" : isSuperadmin ? "👑 SuperAdmin" : "Médico Especialista"}
              </div>
            </div>
            <Settings size={15} style={{ color: "rgba(255, 255, 255, 0.4)", flexShrink: 0 }} />
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
      <div className="admin-main" style={{ position: "relative" }}>
        {/* Top Loading Progress Bar when navigating between options */}
        {pendingHref && (
          <>
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
                zIndex: 999999,
                boxShadow: `0 0 12px ${accentColor}`,
                animation: "adminNavProgress 1.1s ease-in-out infinite",
              }}
            />
            <style>{`
              @keyframes adminNavProgress {
                0% { transform: scaleX(0.1); transform-origin: left; }
                50% { transform: scaleX(0.75); transform-origin: center; }
                100% { transform: scaleX(1); transform-origin: right; }
              }
            `}</style>
          </>
        )}
        {/* ── ALERTA DE RESTRICCIÓN MÉDICA ── */}
        {restrictedNotice && (
          <div style={{
            background: "#7f1d1d",
            color: "#fecaca",
            padding: "12px 24px",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            position: "sticky",
            top: 0,
            zIndex: 98,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}>
            <Lock size={16} />
            <span>Acceso restringido: Esta sección contiene registros clínicos o gobernanza reservada a profesionales médicos autorizados (Res. 1995 de 1999 de MinSalud).</span>
          </div>
        )}
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
              <span style={{ display: "flex", alignItems: "center", color: "#1a0a00" }}>
                <AlertTriangle size={22} strokeWidth={2.2} />
              </span>
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
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              {isPaying ? (
                <>
                  <Clock size={15} />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <CreditCard size={15} />
                  <span>Pagar Ahora</span>
                </>
              )}
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
                margin: "0 auto 20px",
                boxShadow: "0 8px 24px rgba(239,68,68,0.4)",
                color: "#ffffff"
              }}>
                <Lock size={32} strokeWidth={2} />
              </div>

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
                {isPaying ? (
                  <>
                    <Clock size={16} />
                    <span>Procesando pago...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    <span>Pagar y Reactivar Portal</span>
                  </>
                )}
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
            prefetch={true}
            onClick={() => setPendingHref(item.href)}
            className={`admin-bottom-tab${isActive(item.href, item.exact) ? " active" : ""}`}
            aria-current={isActive(item.href, item.exact) ? "page" : undefined}
            style={isActive(item.href, item.exact) ? { color: accentColor } : undefined}
          >
            <span className="admin-bottom-tab-icon"><item.icon size={18} strokeWidth={2} /></span>
            <span className="admin-bottom-tab-label">{item.shortLabel}</span>
            {isActive(item.href, item.exact) && (
              <span className="admin-bottom-tab-dot" style={{ background: accentColor }} />
            )}
          </Link>
        ))}
      </nav>

      {/* ── MODAL DE PERFIL Y SEGURIDAD ────────────────────────────── */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userDisplayName={userDisplayName || doctorName}
        userEmail={userEmail || ""}
        userRole={userRole}
        isSuperadmin={isSuperadmin}
        tenantSlug={tenantSlug}
        doctorName={doctorName}
        primaryColor={primaryColor}
        accentColor={accentColor}
      />
    </div>
  );
}
