"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getHistoriaClinicaDetalle } from "@/lib/actions/clinical-actions";

export default function VistaHistoria() {
  const params = useParams();
  const tenantSlug = params.slug as string;
  const pacienteId = params.pacienteId as string;
  const historiaId = params.historiaId as string;

  const [historia, setHistoria] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistoria = async () => {
      try {
        const data = await getHistoriaClinicaDetalle(historiaId);
        if (data) setHistoria(data);
      } catch (err) {
        console.error("Error al obtener historia:", err);
      }
      setLoading(false);
    };
    fetchHistoria();
  }, [historiaId]);

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Cargando historia clínica...</div>;
  if (!historia) return <div style={{ padding: "40px", textAlign: "center" }}>Historia no encontrada.</div>;

  const metadatos = historia.metadatos_atencion || {};

  return (
    <div style={{ padding: "40px", fontFamily: "'Outfit', sans-serif", minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ marginBottom: "30px" }}>
        <Link href={`/${tenantSlug}/admin/pacientes/${pacienteId}`} style={{ color: "#64748b", textDecoration: "none", fontWeight: "600" }}>
          ← Volver al Perfil del Paciente
        </Link>
      </div>

      <div style={{ background: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #f1f5f9", paddingBottom: "20px", marginBottom: "30px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: "0 0 8px 0" }}>Historia Clínica</h1>
            <p style={{ margin: 0, color: "#64748b" }}>Fecha de atención: {new Date(historia.created_at).toLocaleString("es-CO")}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{
              display: "inline-block", padding: "8px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: "700",
              background: historia.estado === 'cerrado' ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
              color: historia.estado === 'cerrado' ? "#059669" : "#d97706",
            }}>
              {historia.estado.toUpperCase()}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gap: "24px" }}>
          <section>
            <h3 style={{ color: "#00b28e", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>Motivo y Enfermedad Actual</h3>
            <p><strong>Motivo de Consulta:</strong> {historia.motivo_consulta || 'N/A'}</p>
            <p><strong>Enfermedad Actual:</strong> {historia.enfermedad_actual || 'N/A'}</p>
          </section>

          <section>
            <h3 style={{ color: "#00b28e", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>Anamnesis y Antecedentes</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{historia.anamnesis || 'Sin antecedentes registrados.'}</p>
          </section>

          <section>
            <h3 style={{ color: "#00b28e", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>Signos Vitales y Medidas</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <div><strong>Peso:</strong> {metadatos.signos_vitales?.peso || '--'} kg</div>
              <div><strong>Talla:</strong> {metadatos.signos_vitales?.talla || '--'} cm</div>
              <div><strong>Temp:</strong> {metadatos.signos_vitales?.temperatura || '--'} °C</div>
              <div><strong>FC:</strong> {metadatos.signos_vitales?.frecuencia_cardiaca || '--'} lpm</div>
              <div><strong>FR:</strong> {metadatos.signos_vitales?.frecuencia_respiratoria || '--'} rpm</div>
              <div><strong>TA:</strong> {metadatos.signos_vitales?.tension_arterial || '--'} mmHg</div>
              <div><strong>SatO2:</strong> {metadatos.signos_vitales?.saturacion || '--'} %</div>
            </div>
          </section>

          <section>
            <h3 style={{ color: "#00b28e", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>Evolución</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{historia.evolucion || 'Sin registro detallado.'}</p>
          </section>

          <section>
            <h3 style={{ color: "#00b28e", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>Diagnósticos</h3>
            {historia.diagnosticos?.map((dx: any, i: number) => (
              <div key={i} style={{ padding: "8px", background: "#f8fafc", borderRadius: "8px", marginBottom: "8px" }}>
                <strong>{dx.codigo}:</strong> {dx.descripcion} <em style={{ fontSize: "12px", color: "#64748b" }}>({dx.tipo})</em>
              </div>
            ))}
          </section>

          <section>
            <h3 style={{ color: "#00b28e", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>Plan de Manejo</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{historia.plan_manejo || 'No registrado.'}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
