"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SuperadminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        throw authError;
      }

      // Check if user is actually superadmin (we check email in client, server layout will enforce metadata/role)
      const user = data.user;
      if (user && user.email !== "gerkof@gmail.com") {
        await supabase.auth.signOut();
        throw new Error("Acceso denegado. Este panel es exclusivo para el superadministrador.");
      }

      const redirectTo = searchParams.get("redirectTo") || "/superadmin";
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      const errorMsg = err instanceof Error ? err.message : "Credenciales inválidas.";
      setError(errorMsg);
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
        background: "linear-gradient(90deg, #0A4D5C, #00D4AA, #0A4D5C)"
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
          background: "linear-gradient(135deg, rgba(10, 77, 92, 0.2), rgba(0, 212, 170, 0.1))",
          border: "1px solid rgba(0, 212, 170, 0.3)",
          borderRadius: "16px",
          fontSize: "28px",
          marginBottom: "24px",
          color: "#00D4AA"
        }}>🛡️</div>

        <h1 style={{
          fontSize: "24px",
          fontWeight: 800,
          color: "#ffffff",
          margin: "0 0 8px 0",
          letterSpacing: "-0.02em"
        }}>
          HubMed Platform
        </h1>
        <p style={{
          fontSize: "14px",
          color: "rgba(255, 255, 255, 0.6)",
          margin: "0 0 32px 0",
          lineHeight: 1.5
        }}>
          Panel de Control de Superadministrador
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
                e.target.style.borderColor = "#00D4AA";
                e.target.style.boxShadow = "0 0 0 3px rgba(0, 212, 170, 0.15)";
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
                e.target.style.borderColor = "#00D4AA";
                e.target.style.boxShadow = "0 0 0 3px rgba(0, 212, 170, 0.15)";
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
              background: "linear-gradient(135deg, #0A4D5C, #066d82)",
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
