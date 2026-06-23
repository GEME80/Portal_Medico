import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./components/LogoutButton";
import "../admin.css";

import { headers } from "next/headers";

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
    <div className="admin-shell" style={{ minHeight: "100vh" }}>
      {/* ── SIDEBAR ──────────────────────────────────────────────── */}
      <aside className="admin-sidebar" style={{ background: "#090d16" }}>
        <div className="sidebar-brand" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px",
              background: "linear-gradient(135deg, #0A4D5C, #00D4AA)",
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px",
            }}>🛡️</div>
            <div>
              <div className="sidebar-brand-name" style={{ color: "#ffffff" }}>EcoVaccine</div>
              <div className="sidebar-brand-sub" style={{ color: "#00D4AA" }}>Super Admin</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación de superadmin">
          <span className="sidebar-section-label">Plataforma</span>
          
          <Link href="/superadmin" className="sidebar-link">
            <span className="sidebar-link-icon">🏢</span>
            Clínicas / Doctores
          </Link>

          <Link href="/superadmin/config" className="sidebar-link">
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

        <div className="sidebar-footer" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
            <div className="sidebar-user">
              <div className="sidebar-avatar" style={{ background: "rgba(0, 212, 170, 0.15)", color: "#00D4AA" }}>👑</div>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <div className="sidebar-user-name" style={{ color: "#ffffff", fontSize: "13px" }}>gerkof@gmail.com</div>
                <div className="sidebar-user-role" style={{ color: "#9ca3af" }}>Super Administrador</div>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <div className="admin-main" style={{ background: "#0b0f19", color: "#f3f4f6" }}>
        {children}
      </div>
    </div>
  );
}
