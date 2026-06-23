"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/superadmin/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        width: "100%",
        padding: "10px",
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.2)",
        borderRadius: "8px",
        color: "#f87171",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = "rgba(239, 68, 68, 0.18)";
        e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.35)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
        e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
      }}
    >
      <span>🚪</span> Cerrar Sesión
    </button>
  );
}
