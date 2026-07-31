"use client";

import React, { useEffect } from "react";

interface CustomConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CustomConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  isDanger = false,
  onConfirm,
  onCancel,
}: CustomConfirmModalProps) {
  // Manejo de tecla Escape para cerrar
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "20px",
        animation: "confirmFadeIn 0.2s ease-out",
      }}
    >
      <style>{`
        @keyframes confirmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes confirmScaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
      
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          width: "100%",
          maxWidth: "460px",
          padding: "28px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          fontFamily: "'Outfit', sans-serif",
          animation: "confirmScaleIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxSizing: "border-box",
        }}
      >
        <h3
          id="confirm-modal-title"
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#0f172a",
            margin: "0 0 12px 0",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {isDanger ? "⚠️" : "🛡️"} {title}
        </h3>
        
        <p
          style={{
            fontSize: "14.5px",
            lineHeight: 1.6,
            color: "#475569",
            margin: "0 0 24px 0",
          }}
        >
          {message}
        </p>
        
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.borderColor = "#94a3b8";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              background: isDanger ? "#ef4444" : "#0A4D5C",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 0.15s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
