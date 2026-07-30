"use client";

import { useState, useTransition } from "react";
import { toggleTenantActiveAction, updateTenantPaymentStatusAction } from "../actions";

export interface Tenant {
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
        if (newValue === "suspendido") {
          setActivo(false);
        } else if (newValue === "activo") {
          setActivo(true);
        }
      } else {
        alert(`Error: ${res.error}`);
      }
    });
  };

  // Determine site supervision url
  const targetUrl = tenant.custom_domain ? `http://${tenant.custom_domain}` : `/${tenant.slug}`;

  return (
    <tr>
      <td>
        <div className="vaccine-name-cell">
          <span className="vaccine-name-main">{tenant.nombre}</span>
          <span className="vaccine-name-generic">ID: {tenant.id}</span>
        </div>
      </td>
      <td>
        <code className="lot-badge">
          /{tenant.slug}
        </code>
        {tenant.custom_domain && (
          <div style={{ fontSize: "11px", color: "var(--teal-600)", marginTop: "4px", fontWeight: 700 }}>
            🌐 {tenant.custom_domain}
          </div>
        )}
      </td>
      <td>
        <span style={planBadgeStyle(tenant.plan)}>
          {tenant.plan.toUpperCase()}
        </span>
      </td>
      <td>
        <select
          value={estadoPago}
          onChange={handlePaymentChange}
          disabled={isPending}
          className="form-select"
          style={{
            padding: "4px 8px",
            fontSize: "12px",
            width: "auto",
            borderColor: estadoPago === "activo" ? "var(--emerald-300)" : estadoPago === "mora" ? "var(--amber-300)" : "var(--rose-300)",
            color: estadoPago === "activo" ? "var(--emerald-700)" : estadoPago === "mora" ? "var(--amber-700)" : "var(--rose-700)",
            background: estadoPago === "activo" ? "var(--emerald-50)" : estadoPago === "mora" ? "var(--amber-50)" : "var(--rose-50)",
          }}
        >
          <option value="activo">🟢 Activo</option>
          <option value="mora">🟡 En Mora (Admin Lock)</option>
          <option value="suspendido">🔴 Suspendido (Full Lock)</option>
        </select>
      </td>
      <td>
        <button
          onClick={handleToggleActive}
          disabled={isPending}
          className={activo ? "action-btn action-btn-emerald" : "action-btn action-btn-danger"}
          style={{ opacity: isPending ? 0.6 : 1 }}
        >
          {activo ? "✓ Habilitado" : "✗ Suspendido"}
        </button>
      </td>
      <td style={{ color: "var(--slate-600)", fontSize: "13px" }}>
        {new Date(tenant.created_at).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })}
      </td>
      <td>
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn action-btn-ghost"
          style={{ color: "var(--teal-600)", borderColor: "var(--teal-200)", background: "var(--teal-50)" }}
        >
          👁️ Supervisar
        </a>
      </td>
    </tr>
  );
}

const planBadgeStyle = (plan: string) => {
  const isEnterprise = plan === "enterprise";
  const isPro = plan === "pro";
  
  return {
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 700,
    background: isEnterprise ? "var(--purple-50)" : isPro ? "var(--blue-50)" : "var(--slate-100)",
    color: isEnterprise ? "var(--purple-700)" : isPro ? "var(--blue-700)" : "var(--slate-600)",
    border: `1px solid ${isEnterprise ? "var(--purple-200)" : isPro ? "var(--blue-200)" : "var(--slate-200)"}`
  };
};
