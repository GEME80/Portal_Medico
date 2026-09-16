"use client";

import React, { useState } from "react";
import { Settings } from "lucide-react";
import UserProfileModal from "@/app/[slug]/admin/UserProfileModal";

interface SuperadminUserCardProps {
  userDisplayName: string;
  userEmail: string;
}

export default function SuperadminUserCard({
  userDisplayName,
  userEmail,
}: SuperadminUserCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setIsOpen(true);
        }}
        className="sidebar-user"
        title="Gestionar mi perfil y contraseña"
        style={{
          background: "rgba(245, 158, 11, 0.08)",
          border: "1px solid rgba(245, 158, 11, 0.25)",
          borderRadius: "12px",
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer",
          transition: "all 0.15s ease",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          className="sidebar-avatar"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          👑
        </div>
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <div
            className="sidebar-user-name"
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#f8fafc",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userDisplayName}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "rgba(255, 255, 255, 0.55)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userEmail}
          </div>
          <div
            className="sidebar-user-role"
            style={{
              fontSize: "10.5px",
              color: "#fbbf24",
              fontWeight: 600,
            }}
          >
            Super Administrador
          </div>
        </div>
        <Settings size={14} style={{ color: "rgba(255, 255, 255, 0.4)", flexShrink: 0 }} />
      </div>

      <UserProfileModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        userDisplayName={userDisplayName}
        userEmail={userEmail}
        userRole="superadmin"
        isSuperadmin={true}
        tenantSlug="superadmin"
        doctorName="HubMed Platform"
      />
    </>
  );
}
