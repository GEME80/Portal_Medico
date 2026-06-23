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
    } catch (err: any) {
      setStatus({
        type: "error",
        msg: `Error inesperado: ${err.message || "Error al realizar el ping a la base de datos."}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={labelStyle}>API Key Privada (Service Role Key)</span>
          <button
            onClick={() => setShowKey(!showKey)}
            style={{
              background: "none",
              border: "none",
              color: "#00D4AA",
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
          ...codeStyle,
          whiteSpace: showKey ? "pre-wrap" : "nowrap",
          textOverflow: "ellipsis",
          overflow: "hidden",
          display: "block"
        }}>
          {showKey ? serviceKey : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
        </code>
      </div>

      <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "16px", marginTop: "4px" }}>
        <button
          onClick={handleTest}
          disabled={testing}
          style={{
            padding: "10px 16px",
            background: testing ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 212, 170, 0.15)",
            border: `1px solid ${testing ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 212, 170, 0.25)"}`,
            borderRadius: "10px",
            color: testing ? "#6b7280" : "#00D4AA",
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
            background: status.type === "success" ? "rgba(0, 212, 170, 0.05)" : "rgba(239, 68, 68, 0.05)",
            border: `1px solid ${status.type === "success" ? "rgba(0, 212, 170, 0.15)" : "rgba(239, 68, 68, 0.15)"}`,
            color: status.type === "success" ? "#00d4aa" : "#f87171",
          }}>
            {status.type === "success" ? "✅ " : "❌ "}
            {status.msg}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#9ca3af",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const codeStyle = {
  padding: "10px 14px",
  background: "rgba(0, 0, 0, 0.2)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "10px",
  color: "#e2e8f0",
  fontFamily: "monospace",
  fontSize: "13px",
};
