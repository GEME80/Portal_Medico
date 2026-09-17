"use client";

import { Printer, Download } from "lucide-react";

export default function CarnePrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        background: "#0A4D5C",
        color: "white",
        border: "none",
        padding: "12px 26px",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: "0 4px 14px rgba(10, 77, 92, 0.25)",
        transition: "all 0.2s"
      }}
    >
      <Printer size={18} />
      Imprimir / Guardar como PDF
    </button>
  );
}
