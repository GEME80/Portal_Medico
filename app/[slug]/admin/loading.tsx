import React from "react";

export default function AdminLoading() {
  return (
    <div
      style={{
        padding: "28px 32px",
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
        boxSizing: "border-box",
        animation: "adminFadeIn 0.15s ease-out",
      }}
    >
      <style>{`
        @keyframes adminFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes adminPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .admin-skeleton {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: adminPulse 1.4s ease-in-out infinite, adminShimmer 1.8s infinite;
          border-radius: 10px;
        }
        @keyframes adminShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header Skeleton */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <div>
          <div className="admin-skeleton" style={{ width: "240px", height: "30px", marginBottom: "8px" }} />
          <div className="admin-skeleton" style={{ width: "380px", height: "16px" }} />
        </div>
        <div className="admin-skeleton" style={{ width: "130px", height: "40px", borderRadius: "10px" }} />
      </div>

      {/* KPI Cards Skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "18px",
          marginBottom: "28px",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div className="admin-skeleton" style={{ width: "90px", height: "14px" }} />
              <div className="admin-skeleton" style={{ width: "32px", height: "32px", borderRadius: "8px" }} />
            </div>
            <div className="admin-skeleton" style={{ width: "120px", height: "26px", marginBottom: "8px" }} />
            <div className="admin-skeleton" style={{ width: "140px", height: "12px" }} />
          </div>
        ))}
      </div>

      {/* Main Table / Content Skeleton */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <div className="admin-skeleton" style={{ width: "220px", height: "38px" }} />
          <div className="admin-skeleton" style={{ width: "160px", height: "38px" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "12px 0",
                borderBottom: row < 5 ? "1px solid #f1f5f9" : "none",
              }}
            >
              <div className="admin-skeleton" style={{ width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="admin-skeleton" style={{ width: "40%", height: "16px", marginBottom: "6px" }} />
                <div className="admin-skeleton" style={{ width: "25%", height: "12px" }} />
              </div>
              <div className="admin-skeleton" style={{ width: "90px", height: "24px", borderRadius: "6px" }} />
              <div className="admin-skeleton" style={{ width: "70px", height: "32px", borderRadius: "8px" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
