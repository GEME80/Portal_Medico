"use client";

import { useRef, useEffect, useState, useTransition } from "react";
import { createTenantAction } from "../actions";

interface CreateTenantModalProps {
  onSuccess: () => void;
}

export default function CreateTenantModal({ onSuccess }: CreateTenantModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [isPending, startTransition] = useTransition();
  
  // Form State
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<"starter" | "pro" | "enterprise">("starter");
  const [customDomain, setCustomDomain] = useState("");
  const [templateId, setTemplateId] = useState("standard");
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slug && nombre) {
      const generated = nombre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9\s-]/g, "")    // remove special chars
        .trim()
        .replace(/\s+/g, "-");           // replace spaces with hyphens
      setSlug(generated);
    }
  }, [nombre, slug]);

  // Handle fallback light-dismiss for Safari and older browsers
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleOutsideClick = (event: MouseEvent) => {
      // Check closedBy support. If browser supports closedby="any" natively, skip fallback
      if ('closedBy' in HTMLDialogElement.prototype) return;
      
      if (event.target !== dialog) return;

      const rect = dialog.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );

      if (!isDialogContent) {
        closeModal();
      }
    };

    dialog.addEventListener("click", handleOutsideClick);
    return () => {
      dialog.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const openModal = () => {
    setError(null);
    setNombre("");
    setSlug("");
    setEmail("");
    setPlan("starter");
    setCustomDomain("");
    setTemplateId("standard");
    dialogRef.current?.showModal();
  };

  const closeModal = () => {
    dialogRef.current?.close();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createTenantAction({
        nombre,
        slug,
        email,
        plan,
        custom_domain: customDomain || undefined,
        template_id: templateId,
      });

      if (result.success) {
        closeModal();
        onSuccess();
      } else {
        setError(result.error || "Ocurrió un error inesperado.");
      }
    });
  };

  return (
    <>
      <button
        onClick={openModal}
        style={{
          padding: "10px 18px",
          background: "linear-gradient(135deg, #00D4AA, #05b28e)",
          border: "none",
          borderRadius: "10px",
          color: "#0c111d",
          fontSize: "14px",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0, 212, 170, 0.2)",
          transition: "transform 0.15s, opacity 0.15s",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
        onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
        onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
      >
        <span>➕</span> Crear Nueva Clínica
      </button>

      {/* dialog with closedby="any" for native backdrop click closing */}
      <dialog
        ref={dialogRef}
        closedby="any"
        aria-labelledby="modal-title"
        style={{
          width: "100%",
          maxWidth: "540px",
          background: "#0f172a",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "20px",
          padding: "0",
          color: "#f3f4f6",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          outline: "none",
        }}
      >
        {/* Style the backdrop specifically for this modal */}
        <style jsx global>{`
          dialog::backdrop {
            background-color: rgba(2, 6, 23, 0.8) !important;
            backdrop-filter: blur(4px) !important;
          }
        `}</style>

        <div style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 id="modal-title" style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "#ffffff" }}>
              Registrar Nueva Clínica
            </h2>
            <button
              onClick={closeModal}
              style={{
                background: "none",
                border: "none",
                fontSize: "20px",
                color: "#9ca3af",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              ×
            </button>
          </div>

          {error && (
            <div style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "#ef4444",
              padding: "12px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              marginBottom: "20px",
              lineHeight: 1.5
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label htmlFor="nombre" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#9ca3af", marginBottom: "6px" }}>
                  Nombre del Doctor / Clínica *
                </label>
                <input
                  id="nombre"
                  type="text"
                  required
                  placeholder="Ej. Dr. Carlos Torres"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={isPending}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="slug" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#9ca3af", marginBottom: "6px" }}>
                  Slug del Portal *
                </label>
                <input
                  id="slug"
                  type="text"
                  required
                  placeholder="ej-dr-carlos-torres"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  disabled={isPending}
                  style={inputStyle}
                />
                <span style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px", display: "block" }}>
                  URL: /{"{"}slug{"}"}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="email" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#9ca3af", marginBottom: "6px" }}>
                Correo del Doctor (Admin) *
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="doctor@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                style={inputStyle}
              />
              <span style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px", display: "block" }}>
                Se enviará un correo de invitación de Supabase para activar la cuenta.
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label htmlFor="plan" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#9ca3af", marginBottom: "6px" }}>
                  Plan de Suscripción *
                </label>
                <select
                  id="plan"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as any)}
                  disabled={isPending}
                  style={inputStyle}
                >
                  <option value="starter" style={{ background: "#0f172a" }}>Starter ($49/mes)</option>
                  <option value="pro" style={{ background: "#0f172a" }}>Pro ($99/mes)</option>
                  <option value="enterprise" style={{ background: "#0f172a" }}>Enterprise ($199/mes)</option>
                </select>
              </div>

              <div>
                <label htmlFor="template" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#9ca3af", marginBottom: "6px" }}>
                  Plantilla del Portal
                </label>
                <select
                  id="template"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  disabled={isPending}
                  style={inputStyle}
                >
                  <option value="standard" style={{ background: "#0f172a" }}>Estándar (Premium Teal)</option>
                  <option value="custom_torres" style={{ background: "#0f172a" }}>Personalizado (Premium Dark)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="domain" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#9ca3af", marginBottom: "6px" }}>
                Dominio Personalizado (Opcional)
              </label>
              <input
                id="domain"
                type="text"
                placeholder="Ej. www.drtorres.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                disabled={isPending}
                style={inputStyle}
              />
              <span style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px", display: "block" }}>
                El doctor debe apuntar este dominio (CNAME) a la infraestructura de Vercel.
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                style={{
                  padding: "10px 16px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  color: "#d1d5db",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                style={{
                  padding: "10px 20px",
                  background: isPending ? "#3b7a57" : "#00D4AA",
                  border: "none",
                  borderRadius: "10px",
                  color: "#0c111d",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: isPending ? "not-allowed" : "pointer",
                }}
              >
                {isPending ? "Procesando..." : "Crear Clínica"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  background: "rgba(255, 255, 255, 0.03)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "10px",
  color: "#ffffff",
  fontSize: "14px",
  boxSizing: "border-box" as const,
  outline: "none",
  fontFamily: "inherit",
};
