"use client";

import { useState } from "react";

export default function MaskedKey({ label, secretKey }: { label: string, secretKey: string }) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span className="form-label" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--slate-500)", fontWeight: 700 }}>
          {label}
        </span>
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
        {showKey ? secretKey : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
      </code>
    </div>
  );
}
