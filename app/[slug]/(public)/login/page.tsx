"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function TenantLoginPage({ params }: Props) {
  const [slug, setSlug] = useState("");
  const [brandName, setBrandName] = useState("Portal Médico");
  const [primaryColor, setPrimaryColor] = useState("#0A4D5C");
  const [accentColor, setAccentColor] = useState("#00D4AA");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    params.then(async (p) => {
      setSlug(p.slug);
      // Load tenant configuration for branding
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, nombre")
        .eq("slug", p.slug)
        .single();

      if (!tenant) return;

      const { data: config } = await supabase
        .from("configuracion_portal")
        .select("nombre_clinica, nombre_doctor, color_primario, color_acento")
        .eq("tenant_id", tenant.id)
        .single();

      if (config) {
        setBrandName(config.nombre_clinica || config.nombre_doctor || tenant.nombre);
        if (config.color_primario) setPrimaryColor(config.color_primario);
        if (config.color_acento) setAccentColor(config.color_acento);
      } else {
        setBrandName(tenant.nombre);
      }
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      const user = data.user;
      const userSlug = user?.app_metadata?.tenant_slug;
      const userRole = user?.app_metadata?.role;

      // Superadmin can log in to any tenant admin
      const isSuperadmin = user?.email === "gerkof@gmail.com" || userRole === "superadmin";

      if (user && !isSuperadmin && userSlug !== slug) {
        await supabase.auth.signOut();
        throw new Error(`Acceso denegado. Tu cuenta pertenece al portal "${userSlug}".`);
      }

      const redirectTo = searchParams.get("redirectTo") || `/${slug}/admin`;
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Credenciales inválidas.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(circle at top left, #0f172a, #020617)",
      padding: "24px",
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        background: `linear-gradient(90deg, ${primaryColor}, ${accentColor}, ${primaryColor})`
      }} />

      <div style={{
        width: "100%",
        maxWidth: "440px",
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "24px",
        padding: "40px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
        textAlign: "center"
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "56px",
          height: "56px",
          background: `linear-gradient(135deg, ${primaryColor}33, ${accentColor}11)`,
          border: `1px solid ${accentColor}55`,
          borderRadius: "16px",
          fontSize: "28px",
          marginBottom: "24px",
          color: accentColor
        }}>👨‍⚕️</div>

        <h1 style={{
          fontSize: "24px",
          fontWeight: 800,
          color: "#ffffff",
          margin: "0 0 8px 0",
          letterSpacing: "-0.02em"
        }}>
          {brandName}
        </h1>
        <p style={{
          fontSize: "14px",
          color: "rgba(255, 255, 255, 0.6)",
          margin: "0 0 32px 0",
          lineHeight: 1.5
        }}>
          Panel de Administración Médica
        </p>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            color: "#ef4444",
            padding: "12px 16px",
            borderRadius: "12px",
            fontSize: "13px",
            textAlign: "left",
            marginBottom: "24px",
            lineHeight: 1.5
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label htmlFor="email" style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.8)",
              marginBottom: "8px"
            }}>
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                color: "#ffffff",
                fontSize: "14px",
                fontFamily: "inherit",
                boxSizing: "border-box",
                outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = accentColor;
                e.target.style.boxShadow = `0 0 0 3px ${accentColor}26`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label htmlFor="password" style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.8)",
              marginBottom: "8px"
            }}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                color: "#ffffff",
                fontSize: "14px",
                fontFamily: "inherit",
                boxSizing: "border-box",
                outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = accentColor;
                e.target.style.boxShadow = `0 0 0 3px ${accentColor}26`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
              border: "none",
              borderRadius: "12px",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.1s, opacity 0.15s",
              fontFamily: "inherit",
              marginTop: "12px"
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.opacity = "0.9";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            {loading ? "Iniciando Sesión..." : "Entrar al Panel"}
          </button>
        </form>
      </div>
    </div>
  );
}
