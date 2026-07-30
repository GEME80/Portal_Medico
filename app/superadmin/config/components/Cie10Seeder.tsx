'use client';

import { useState } from "react";
import { seedCie10Action } from "../../actions";

export default function Cie10Seeder({ initialCount = 0 }: { initialCount?: number }) {
  const [seeding, setSeeding] = useState(false);
  const [currentCount, setCurrentCount] = useState(initialCount);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeed = async () => {
    if (!confirm("¿Estás seguro de que deseas descargar e importar el catálogo CIE-10 completo en esta base de datos? Esto eliminará registros previos para evitar duplicados.")) {
      return;
    }
    setSeeding(true);
    setResult(null);
    try {
      const res = await seedCie10Action();
      if (res.success) {
        setResult({ success: true, message: `¡Catálogo semillado con éxito! Se cargaron ${res.count} diagnósticos.` });
        setCurrentCount(res.count || 0);
      } else {
        setResult({ success: false, message: `Error: ${res.error}` });
      }
    } catch (e: any) {
      setResult({ success: false, message: `Error inesperado: ${e.message}` });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--slate-200)" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--slate-700)", margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Base de Datos: Inicialización de Datos
      </h3>
      <p style={{ fontSize: "13px", color: "var(--slate-500)", margin: "0 0 16px 0", lineHeight: "1.5" }}>
        Descarga e inyecta la última versión oficial del catálogo completo de diagnósticos CIE-10 (más de 12,000 registros) desde un repositorio de GitHub directo a tu base de datos de producción.
      </p>
      
      <div style={{ fontSize: "13px", color: "var(--slate-700)", marginBottom: "16px", fontWeight: "600" }}>
        Registros actuales en catálogo CIE-10: <span style={{ color: currentCount > 0 ? "var(--emerald-600)" : "var(--rose-600)", fontFamily: "monospace", fontSize: "14px" }}>{currentCount}</span>
      </div>

      <button
        onClick={handleSeed}
        disabled={seeding}
        style={{
          background: seeding ? "var(--slate-200)" : "var(--teal-600)",
          color: seeding ? "var(--slate-500)" : "white",
          border: "none",
          borderRadius: "8px",
          padding: "10px 18px",
          fontSize: "13px",
          fontWeight: 700,
          cursor: seeding ? "not-allowed" : "pointer",
          transition: "background 0.15s ease",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
        }}
        onMouseOver={e => { if(!seeding) e.currentTarget.style.background = "var(--teal-700)"; }}
        onMouseOut={e => { if(!seeding) e.currentTarget.style.background = "var(--teal-600)"; }}
      >
        {seeding ? "Importando catálogo (esto puede tardar unos segundos)..." : "⚡ Semillar Catálogo CIE-10"}
      </button>

      {result && (
        <div style={{
          marginTop: "16px",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: "600",
          backgroundColor: result.success ? "var(--emerald-50)" : "var(--rose-50)",
          border: `1px solid ${result.success ? "var(--emerald-200)" : "var(--rose-200)"}`,
          color: result.success ? "var(--emerald-900)" : "var(--rose-900)"
        }}>
          {result.message}
        </div>
      )}
    </div>
  );
}
