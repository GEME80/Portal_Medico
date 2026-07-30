"use client";

import { useState } from "react";
import { testDbConnectionAction } from "../../actions";

interface ConnectionTesterProps {
  serviceKey: string;
}

export default function ConnectionTester({ serviceKey }: ConnectionTesterProps) {
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; msg: string }>({
    type: "idle",
    msg: "",
  });

  const handleTest = async () => {
    setTesting(true);
    setStatus({ type: "idle", msg: "" });

    try {
      const res = await testDbConnectionAction();
      if (res.success) {
        setStatus({
          type: "success",
          msg: `¡Conexión establecida con éxito! Latencia de respuesta: ${res.latency}ms`,
        });
      } else {
        setStatus({
          type: "error",
          msg: `Error de conexión: ${res.error || "No se pudo conectar a la base de datos."}`,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al realizar el ping a la base de datos.";
      setStatus({
        type: "error",
        msg: `Error inesperado: ${errorMsg}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span className="form-label" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--slate-500)" }}>API Key Privada (Service Role Key)</span>
          <button
            onClick={() => setShowKey(!showKey)}
            style={{
              background: "none",
              border: "none",
              color: "var(--teal-600)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {showKey ? "👁️ Ocultar" : "👁️ Revelar"}
          </button>
        </div>
        <code style={{
          display: "block",
          padding: "10px 14px",
          background: "var(--slate-50)",
          border: "1px solid var(--slate-200)",
          borderRadius: "10px",
          color: "var(--slate-700)",
          fontFamily: "monospace",
          fontSize: "13px",
          whiteSpace: showKey ? "pre-wrap" : "nowrap",
          textOverflow: "ellipsis",
          overflow: "hidden"
        }}>
          {showKey ? serviceKey : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
        </code>
      </div>

      <div style={{ borderTop: "1px solid var(--slate-200)", paddingTop: "16px", marginTop: "4px" }}>
        <button
          onClick={handleTest}
          disabled={testing}
          className="action-btn"
          style={{
            padding: "10px 16px",
            background: testing ? "var(--slate-50)" : "var(--emerald-50)",
            border: `1px solid ${testing ? "var(--slate-200)" : "var(--emerald-200)"}`,
            borderRadius: "10px",
            color: testing ? "var(--slate-500)" : "var(--emerald-700)",
            fontSize: "13px",
            fontWeight: 700,
            cursor: testing ? "not-allowed" : "pointer",
            width: "100%",
            transition: "all 0.15s",
          }}
        >
          {testing ? "Probando Conexión..." : "⚡ Probar Conexión con Supabase"}
        </button>

        {status.type !== "idle" && (
          <div style={{
            marginTop: "12px",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            lineHeight: 1.4,
            background: status.type === "success" ? "var(--emerald-50)" : "var(--rose-50)",
            border: `1px solid ${status.type === "success" ? "var(--emerald-200)" : "var(--rose-200)"}`,
            color: status.type === "success" ? "var(--emerald-900)" : "var(--rose-900)",
          }}>
            {status.type === "success" ? "✅ " : "❌ "}
            {status.msg}
          </div>
        )}
      </div>
    </div>
  );
}
