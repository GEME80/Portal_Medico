"use client";

import { useState, useTransition } from "react";
import { toggleTenantActiveAction, updateTenantPaymentStatusAction } from "../actions";

interface Tenant {
  id: string;
  slug: string;
  nombre: string;
  plan: string;
  custom_domain: string | null;
  estado_pago: "activo" | "mora" | "suspendido";
  activo: boolean;
  created_at: string;
}

interface TenantRowProps {
  tenant: Tenant;
  index: number;
}

export default function TenantRow({ tenant, index }: TenantRowProps) {
  const [isPending, startTransition] = useTransition();
  const [activo, setActivo] = useState(tenant.activo);
  const [estadoPago, setEstadoPago] = useState(tenant.estado_pago);

  const handleToggleActive = () => {
    startTransition(async () => {
      const res = await toggleTenantActiveAction(tenant.id, activo);
      if (res.success) {
        setActivo(!activo);
      } else {
        alert(`Error: ${res.error}`);
      }
    });
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as "activo" | "mora" | "suspendido";
    startTransition(async () => {
      const res = await updateTenantPaymentStatusAction(tenant.id, newValue);
      if (res.success) {
        setEstadoPago(newValue);
      } else {
        alert(`Error: ${res.error}`);
      }
    });
  };

  // Determine site supervision url
  const targetUrl = tenant.custom_domain ? `http://${tenant.custom_domain}` : `/${tenant.slug}`;

  return (
    <tr style={{
      borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
      background: index % 2 === 0 ? "rgba(255, 255, 255, 0.01)" : "none",
      transition: "background 0.15s"
    }}>
      <td style={tdStyle}>
        <div style={{ fontWeight: 700, color: "#ffffff" }}>{tenant.nombre}</div>
        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>ID: {tenant.id}</div>
      </td>
      <td style={tdStyle}>
        <code style={{ background: "rgba(0,0,0,0.2)", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", color: "#e2e8f0" }}>
          /{tenant.slug}
        </code>
        {tenant.custom_domain && (
          <div style={{ fontSize: "12px", color: "#00D4AA", marginTop: "4px" }}>
            🌐 {tenant.custom_domain}
          </div>
        )}
      </td>
      <td style={tdStyle}>
        <span style={planBadgeStyle(tenant.plan)}>
          {tenant.plan.toUpperCase()}
        </span>
      </td>
      <td style={tdStyle}>
        <select
          value={estadoPago}
          onChange={handlePaymentChange}
          disabled={isPending}
          style={{
            ...selectStyle,
            borderColor: estadoPago === "activo" ? "rgba(0, 212, 170, 0.3)" : estadoPago === "mora" ? "rgba(245, 158, 11, 0.3)" : "rgba(239, 68, 68, 0.3)",
            color: estadoPago === "activo" ? "#00D4AA" : estadoPago === "mora" ? "#f59e0b" : "#f87171"
          }}
        >
          <option value="activo" style={{ background: "#0f172a", color: "#00D4AA" }}>🟢 Activo</option>
          <option value="mora" style={{ background: "#0f172a", color: "#f59e0b" }}>🟡 En Mora (Admin Lock)</option>
          <option value="suspendido" style={{ background: "#0f172a", color: "#f87171" }}>🔴 Suspendido (Full Lock)</option>
        </select>
      </td>
      <td style={tdStyle}>
        <button
          onClick={handleToggleActive}
          disabled={isPending}
          style={{
            ...statusButtonStyle(activo),
            opacity: isPending ? 0.6 : 1
          }}
        >
          {activo ? "✓ Habilitado" : "✗ Suspendido"}
        </button>
      </td>
      <td style={tdStyle}>
        {new Date(tenant.created_at).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })}
      </td>
      <td style={tdStyle}>
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            background: "rgba(0, 212, 170, 0.1)",
            border: "1px solid rgba(0, 212, 170, 0.2)",
            borderRadius: "8px",
            color: "#00D4AA",
            textDecoration: "none",
            fontSize: "12px",
            fontWeight: 700,
            transition: "all 0.15s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(0, 212, 170, 0.18)";
            e.currentTarget.style.borderColor = "rgba(0, 212, 170, 0.35)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(0, 212, 170, 0.1)";
            e.currentTarget.style.borderColor = "rgba(0, 212, 170, 0.2)";
          }}
        >
          👁️ Supervisar
        </a>
      </td>
    </tr>
  );
}

const tdStyle = {
  padding: "16px 20px",
  fontSize: "14px",
  verticalAlign: "middle"
};

const planBadgeStyle = (plan: string) => {
  const isEnterprise = plan === "enterprise";
  const isPro = plan === "pro";
  
  return {
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 700,
    background: isEnterprise ? "rgba(168, 85, 247, 0.15)" : isPro ? "rgba(59, 130, 246, 0.15)" : "rgba(107, 114, 128, 0.15)",
    color: isEnterprise ? "#c084fc" : isPro ? "#60a5fa" : "#9ca3af",
    border: `1px solid ${isEnterprise ? "rgba(168, 85, 247, 0.3)" : isPro ? "rgba(59, 130, 246, 0.3)" : "rgba(107, 114, 128, 0.3)"}`
  };
};

const selectStyle = {
  padding: "6px 12px",
  background: "rgba(0,0,0,0.2)",
  border: "1px solid",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 600,
  outline: "none",
  cursor: "pointer"
};

const statusButtonStyle = (active: boolean) => ({
  padding: "6px 12px",
  background: active ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
  border: `1px solid ${active ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
  borderRadius: "8px",
  color: active ? "#34d399" : "#f87171",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
});
