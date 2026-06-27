"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function TenantLoginPage({ params }: Props) {
  const [slug, setSlug] = useState("");
  const [brandName, setBrandName] = useState("Portal Médico");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#0A4D5C");
  const [accentColor, setAccentColor] = useState("#00D4AA");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    params.then(async (p) => {
      setSlug(p.slug);
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, nombre")
        .eq("slug", p.slug)
        .single();

      if (!tenant) return;

      const { data: config } = await supabase
        .from("configuracion_portal")
        .select("nombre_clinica, nombre_doctor, color_primario, color_acento, logo_url")
        .eq("tenant_id", tenant.id)
        .single();

      if (config) {
        setBrandName(config.nombre_clinica || config.nombre_doctor || tenant.nombre);
        if (config.color_primario) setPrimaryColor(config.color_primario);
        if (config.color_acento) setAccentColor(config.color_acento);
        if (config.logo_url) setLogoUrl(config.logo_url);
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        resetEmail.trim(),
        { redirectTo: `${origin}/${slug}/admin` }
      );
      if (resetErr) throw resetErr;
      setResetSent(true);
    } catch (err: any) {
      setResetError(err.message || "No se pudo enviar el correo. Intenta de nuevo.");
    } finally {
      setResetLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
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
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: "8px",
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = accentColor;
    e.target.style.boxShadow = `0 0 0 3px ${accentColor}26`;
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
    e.target.style.boxShadow = "none";
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
      {/* Top accent bar */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
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
        {/* Logo / Avatar */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "72px",
          height: "72px",
          background: `linear-gradient(135deg, ${primaryColor}33, ${accentColor}11)`,
          border: `1px solid ${accentColor}55`,
          borderRadius: "18px",
          marginBottom: "24px",
          overflow: "hidden",
        }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo del portal"
              style={{ width: "64px", height: "64px", objectFit: "contain" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) parent.innerHTML = `<img src="/icon.png" alt="Logo" style="width:64px;height:64px;object-fit:contain;" onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<span style=font-size:36px;color:${accentColor}>⚕️</span>')" />`;
              }}
            />
          ) : (
            <img
              src="/icon.png"
              alt="Logo del portal"
              style={{ width: "64px", height: "64px", objectFit: "contain" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const span = document.createElement("span");
                  span.style.fontSize = "36px";
                  span.style.color = accentColor;
                  span.textContent = "⚕️";
                  parent.appendChild(span);
                }
              }}
            />
          )}
        </div>

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

        {/* ── MODO: OLVIDÉ MI CONTRASEÑA ── */}
        {forgotMode ? (
          <div style={{ textAlign: "left" }}>
            {resetSent ? (
              <div style={{
                background: "rgba(0, 212, 170, 0.08)",
                border: "1px solid rgba(0, 212, 170, 0.3)",
                borderRadius: "14px",
                padding: "20px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>📬</div>
                <p style={{ color: "#ffffff", fontWeight: 700, fontSize: "15px", margin: "0 0 8px 0" }}>
                  Correo enviado
                </p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", lineHeight: 1.6, margin: "0 0 20px 0" }}>
                  Revisa tu bandeja de entrada en <strong style={{ color: accentColor }}>{resetEmail}</strong>. 
                  Recibirás un enlace para restablecer tu contraseña.
                </p>
                <button
                  type="button"
                  onClick={() => { setForgotMode(false); setResetSent(false); setResetEmail(""); }}
                  style={{
                    background: "transparent",
                    border: `1px solid ${accentColor}55`,
                    borderRadius: "10px",
                    color: accentColor,
                    fontSize: "13px",
                    fontWeight: 600,
                    padding: "10px 20px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  ← Volver al login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", lineHeight: 1.6, margin: "0 0 20px 0" }}>
                    Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                  </p>
                  <label htmlFor="reset-email" style={labelStyle}>Correo Electrónico</label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    placeholder="nombre@ejemplo.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={resetLoading}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>

                {resetError && (
                  <div style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    color: "#ef4444",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    lineHeight: 1.5
                  }}>
                    ⚠️ {resetError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetLoading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                    border: "none",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: resetLoading ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    opacity: resetLoading ? 0.7 : 1,
                  }}
                >
                  {resetLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                </button>

                <button
                  type="button"
                  onClick={() => { setForgotMode(false); setResetError(null); }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "center",
                  }}
                >
                  ← Volver al login
                </button>
              </form>
            )}
          </div>
        ) : (
          /* ── MODO: LOGIN NORMAL ── */
          <>
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
              {/* Email */}
              <div>
                <label htmlFor="email" style={labelStyle}>Correo Electrónico</label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              {/* Password con toggle */}
              <div>
                <label htmlFor="password" style={labelStyle}>Contraseña</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    style={{ ...inputStyle, paddingRight: "48px" }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      color: "rgba(255,255,255,0.4)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPassword ? (
                      /* Ojo tachado (ocultar) */
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      /* Ojo (mostrar) */
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
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
                  marginTop: "4px",
                  opacity: loading ? 0.7 : 1,
                }}
                onMouseOver={(e) => { if (!loading) e.currentTarget.style.opacity = "0.9"; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = loading ? "0.7" : "1"; }}
              >
                {loading ? "Iniciando Sesión..." : "Entrar al Panel"}
              </button>

              {/* Olvidé mi contraseña */}
              <div style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setResetEmail(email); setResetError(null); }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,255,255,0.45)",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = accentColor}
                  onMouseOut={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
