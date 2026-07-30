import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./components/LogoutButton";
import "../admin.css";

import { headers } from "next/headers";

import Image from "next/image";

interface SuperadminLayoutProps {
  children: React.ReactNode;
}

export default async function SuperadminLayout({ children }: SuperadminLayoutProps) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";

  // Bypass layout auth check for the login page itself
  if (pathname === "/superadmin/login") {
    return <>{children}</>;
  }

  const supabase = await createClient();

  // Validate session and role
  const { data: { user } } = await supabase.auth.getUser();

  const isSuperadmin = user?.email === process.env.SUPERADMIN_EMAIL || user?.app_metadata?.role === "superadmin";

  if (!user || !isSuperadmin) {
    redirect("/superadmin/login");
  }

  return (
    <div className="admin-shell">
      {/* ── SIDEBAR ──────────────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px",
              background: "white",
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              overflow: "hidden"
            }}>
              <Image src="/icon.png" alt="HubMed" width={24} height={24} style={{ objectFit: "contain" }} />
            </div>
            <div>
              <div className="sidebar-brand-name">HubMed</div>
              <div className="sidebar-brand-sub">Super Admin</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación de superadmin">
          <span className="sidebar-section-label">Plataforma</span>
          
          <Link href="/superadmin" className={`sidebar-link ${pathname === "/superadmin" ? "active" : ""}`}>
            <span className="sidebar-link-icon">🏢</span>
            Clínicas / Doctores
          </Link>

          <Link href="/superadmin/config" className={`sidebar-link ${pathname === "/superadmin/config" ? "active" : ""}`}>
            <span className="sidebar-link-icon">⚙️</span>
            Infraestructura
          </Link>

          <span className="sidebar-section-label">Sistema</span>
          <a href="https://supabase.com/dashboard/project/nstiomejmhmcasxqxnbf" target="_blank" rel="noopener noreferrer" className="sidebar-link">
            <span className="sidebar-link-icon">🗄️</span>
            Consola Supabase ↗
          </a>
          <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="sidebar-link">
            <span className="sidebar-link-icon">☁️</span>
            Consola Vercel ↗
          </a>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
            <div className="sidebar-user" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="sidebar-avatar">👑</div>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <div className="sidebar-user-name">gerkof@gmail.com</div>
                <div className="sidebar-user-role">Super Administrador</div>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <div className="admin-main">
        <div className="admin-topbar">
          <h2 className="admin-topbar-title">HubMed Superadmin</h2>
          <div className="admin-topbar-right">
             {/* future topbar items */}
          </div>
        </div>
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}
