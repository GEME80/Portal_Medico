"use client";

import React, { useState, useMemo } from "react";
import { 
  IndicadorOms, 
  ConfiguracionGraficaOMS, 
  getGraficasFiltradasParaPaciente, 
  evaluarZScoreResolucion2465, 
  DiagnosticoNutricional,
  EtapaEtaria
} from "@/lib/oms/constants";
import { 
  Activity, 
  Info, 
  Calendar, 
  Scale, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  Eye, 
  Layers
} from "lucide-react";

export interface MedicionPunto {
  id?: string;
  created_at: string;
  fecha_medicion?: string;
  signos_vitales?: {
    peso?: string | number;
    talla?: string | number;
    perimetro_cefalico?: string | number;
    imc?: string | number;
  };
  tipo?: string;
}

interface VectorGrowthChartProps {
  paciente: {
    id?: string;
    nombres: string;
    apellidos?: string;
    genero?: string;
    fecha_nacimiento?: string;
  };
  mediciones: MedicionPunto[];
  onOpenManualEntry?: () => void;
}

function calcularMesesDiff(fechaNacimiento: string, fechaAtencion: string) {
  if (!fechaNacimiento || !fechaAtencion) return 0;
  const nace = new Date(fechaNacimiento);
  const ate = new Date(fechaAtencion);
  let meses = (ate.getFullYear() - nace.getFullYear()) * 12 + ate.getMonth() - nace.getMonth();
  if (ate.getDate() < nace.getDate()) meses--;
  return Math.max(0, meses);
}

function formatearEdadMeses(totalMeses: number): string {
  const anios = Math.floor(totalMeses / 12);
  const meses = totalMeses % 12;
  if (anios === 0) return `${meses} meses`;
  if (meses === 0) return `${anios} ${anios === 1 ? 'año' : 'años'}`;
  return `${anios} ${anios === 1 ? 'año' : 'años'}, ${meses} m`;
}

export default function VectorGrowthChart({
  paciente,
  mediciones,
  onOpenManualEntry
}: VectorGrowthChartProps) {
  // Motor inteligente de filtrado de gráficas por edad y sexo
  const { sexo, etapaActual, graficaPorDefectoId, graficas, todasLasEtapas } = useMemo(() => {
    return getGraficasFiltradasParaPaciente(paciente.genero, paciente.fecha_nacimiento);
  }, [paciente.genero, paciente.fecha_nacimiento]);

  const [selectedGraficaId, setSelectedGraficaId] = useState<string>(graficaPorDefectoId);
  const [etapaSeleccionada, setEtapaSeleccionada] = useState<EtapaEtaria>(etapaActual);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [vistaModo, setVistaModo] = useState<"vectorial" | "imagen">("vectorial");

  // Obtener la colección de gráficas según la etapa activa
  const etapaColeccion = useMemo(() => {
    return todasLasEtapas.find(e => e.id === etapaSeleccionada) || todasLasEtapas[0];
  }, [todasLasEtapas, etapaSeleccionada]);

  // Gráfica activa actual
  const graficaActiva = useMemo(() => {
    const found = etapaColeccion.graficas.find(g => g.id === selectedGraficaId);
    if (found) return found;
    return etapaColeccion.graficas[0];
  }, [etapaColeccion, selectedGraficaId]);

  const config = graficaActiva.config;

  // Filtrar y proyectar los puntos del paciente sobre esta gráfica
  const puntosGrafica = useMemo(() => {
    if (!config || !paciente.fecha_nacimiento) return [];

    const pts: { x: number; y: number; fecha: string; edadMeses: number; zScoreAprox: number; evalNutricional: DiagnosticoNutricional }[] = [];

    mediciones.forEach(m => {
      const fecha = m.fecha_medicion || m.created_at.split("T")[0];
      const meses = calcularMesesDiff(paciente.fecha_nacimiento!, m.created_at || m.fecha_medicion!);
      const sv = m.signos_vitales;
      if (!sv) return;

      let xVal: number | null = null;
      let yVal: number | null = null;

      const p = sv.peso ? parseFloat(String(sv.peso)) : null;
      const t = sv.talla ? parseFloat(String(sv.talla)) : null;
      const pc = sv.perimetro_cefalico ? parseFloat(String(sv.perimetro_cefalico)) : null;

      // Asignar coordenadas según el indicador
      if (config.indicador === "peso_edad" && p !== null) {
        xVal = meses;
        yVal = p;
      } else if ((config.indicador === "longitud_edad" || config.indicador === "talla_edad") && t !== null) {
        xVal = config.etapa === "5_18a" ? Number((meses / 12).toFixed(1)) : meses;
        yVal = t;
      } else if ((config.indicador === "peso_longitud" || config.indicador === "peso_talla") && p !== null && t !== null) {
        xVal = t;
        yVal = p;
      } else if (config.indicador === "imc_edad") {
        let imcVal = sv.imc ? parseFloat(String(sv.imc)) : null;
        if (!imcVal && p !== null && t !== null && t > 0) {
          const m = t > 3 ? t / 100 : t;
          imcVal = p / (m * m);
        }
        if (imcVal !== null) {
          xVal = config.etapa === "5_18a" ? Number((meses / 12).toFixed(1)) : meses;
          yVal = Number(imcVal.toFixed(2));
        }
      } else if (config.indicador === "perimetro_cefalico" && pc !== null) {
        xVal = meses;
        yVal = pc;
      }

      // Validar que caiga en el rango de los ejes
      if (xVal !== null && yVal !== null && xVal >= config.minX && xVal <= config.maxX && yVal >= config.minY && yVal <= config.maxY) {
        // Encontrar punto más cercano de referencia para estimar Z-score
        const refPoint = config.curvas.reduce((prev, curr) => Math.abs(curr.x - xVal!) < Math.abs(prev.x - xVal!) ? curr : prev, config.curvas[0]);
        
        let zScore = 0;
        if (yVal >= refPoint.z0) {
          const sd = (refPoint.z2 - refPoint.z0) / 2;
          zScore = sd > 0 ? (yVal - refPoint.z0) / sd : 0;
        } else {
          const sd = (refPoint.z0 - refPoint.zn2) / 2;
          zScore = sd > 0 ? (yVal - refPoint.z0) / sd : 0;
        }

        const evalNutricional = evaluarZScoreResolucion2465(config.indicador, zScore, meses);

        pts.push({
          x: xVal,
          y: yVal,
          fecha,
          edadMeses: meses,
          zScoreAprox: Number(zScore.toFixed(2)),
          evalNutricional
        });
      }
    });

    return pts.sort((a, b) => a.x - b.x);
  }, [config, mediciones, paciente.fecha_nacimiento]);

  // Dimensiones del canvas SVG
  const width = 860;
  const height = 520;
  const margin = { top: 30, right: 45, bottom: 50, left: 55 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Funciones de mapeo de coordenadas
  const scaleX = (val: number) => {
    return margin.left + ((val - config.minX) / (config.maxX - config.minX)) * innerWidth;
  };

  const scaleY = (val: number) => {
    return margin.top + innerHeight - ((val - config.minY) / (config.maxY - config.minY)) * innerHeight;
  };

  // Generador de líneas SVG (Path D)
  const generatePath = (key: keyof typeof config.curvas[0]) => {
    return config.curvas.map((pt, i) => {
      const x = scaleX(pt.x);
      const y = scaleY(Number(pt[key]));
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Generador de polígono sombreado del corredor normal (-2 a +2 DE)
  const normalCorridorPath = useMemo(() => {
    if (!config || config.curvas.length === 0) return "";
    const topPoints = config.curvas.map(pt => `${scaleX(pt.x)} ${scaleY(pt.z2)}`);
    const bottomPointsReversed = [...config.curvas].reverse().map(pt => `${scaleX(pt.x)} ${scaleY(pt.zn2)}`);
    return `M ${topPoints.join(' L ')} L ${bottomPointsReversed.join(' L ')} Z`;
  }, [config]);

  // Ticks para cuadrícula de fondo
  const ticksX = useMemo(() => {
    const t: number[] = [];
    for (let x = config.minX; x <= config.maxX; x += config.stepX) {
      t.push(x);
    }
    return t;
  }, [config]);

  const ticksY = useMemo(() => {
    const t: number[] = [];
    for (let y = config.minY; y <= config.maxY; y += config.stepY) {
      t.push(y);
    }
    return t;
  }, [config]);

  // Paleta según sexo
  const isGirl = sexo === "F";
  const frameBorderColor = isGirl ? "#f472b6" : "#38bdf8"; // Rosa vs Azul celeste
  const frameBgColor = isGirl ? "rgba(244, 114, 182, 0.06)" : "rgba(56, 189, 248, 0.06)";

  return (
    <div style={{ width: "100%", fontFamily: "'Outfit', sans-serif" }}>
      
      {/* ── BARRA DE SELECCIÓN INTELIGENTE SEGÚN EDAD Y GÉNERO ── */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "16px 20px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                fontSize: "11px",
                fontWeight: "800",
                textTransform: "uppercase",
                padding: "3px 8px",
                borderRadius: "6px",
                background: frameBgColor,
                color: isGirl ? "#be185d" : "#0284c7",
                border: `1px solid ${frameBorderColor}`
              }}>
                {isGirl ? "♀ Niñas (Femenino)" : "♂ Niños (Masculino)"}
              </span>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>
                {etapaColeccion.label}
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>
              Indicadores antropométricos oficiales de la OMS recomendados para la edad actual.
            </p>
          </div>

          {/* Selector discreto de etapa anterior (si el niño ya es mayor) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>Etapa:</span>
            <div style={{ display: "flex", background: "#f1f5f9", padding: "2px", borderRadius: "8px" }}>
              {todasLasEtapas.map(et => {
                const isSelected = et.id === etapaSeleccionada;
                return (
                  <button
                    key={et.id}
                    type="button"
                    onClick={() => {
                      setEtapaSeleccionada(et.id);
                      setSelectedGraficaId(et.graficas[0].id);
                    }}
                    style={{
                      border: "none",
                      background: isSelected ? "#ffffff" : "transparent",
                      color: isSelected ? "#0A4D5C" : "#64748b",
                      fontWeight: isSelected ? "700" : "500",
                      fontSize: "11px",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      boxShadow: isSelected ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      transition: "all 0.15s"
                    }}
                  >
                    {et.id === "0_24m" ? "0-2 años" : et.id === "2_5a" ? "2-5 años" : "5-18 años"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Botones de las Gráficas que aplican a esta etapa */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {etapaColeccion.graficas.map(g => {
            const isCurrent = g.id === graficaActiva.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGraficaId(g.id)}
                style={{
                  background: isCurrent ? (isGirl ? "#db2777" : "#0284c7") : "#f8fafc",
                  color: isCurrent ? "#ffffff" : "#475569",
                  border: isCurrent ? "none" : "1px solid #cbd5e1",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s",
                  boxShadow: isCurrent ? (isGirl ? "0 2px 8px rgba(219, 39, 119, 0.25)" : "0 2px 8px rgba(2, 132, 199, 0.25)") : "none"
                }}
              >
                <Activity size={13} />
                <span>{g.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTENEDOR DE LA GRÁFICA VECTORIAL ── */}
      <div style={{
        background: "#ffffff",
        border: `3px solid ${frameBorderColor}`,
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
        position: "relative"
      }}>
        {/* Cabecera de la Gráfica Oficial */}
        <div style={{
          background: frameBgColor,
          borderBottom: `1px solid ${frameBorderColor}`,
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px"
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>
              {config.nombre}
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>
              {config.subtitulo}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", color: "#475569", background: "rgba(255,255,255,0.8)", padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
              Registros: <strong>{puntosGrafica.length}</strong>
            </span>
          </div>
        </div>

        {/* SVG Interactivo */}
        <div style={{ width: "100%", overflowX: "auto", background: "#ffffff" }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: "100%", height: "auto", minWidth: "680px", display: "block" }}
          >
            {/* Fondo del área de cuadrícula */}
            <rect
              x={margin.left}
              y={margin.top}
              width={innerWidth}
              height={innerHeight}
              fill="#ffffff"
              stroke="#94a3b8"
              strokeWidth="1.5"
            />

            {/* Cuadrícula Fina Horizontal */}
            {ticksY.map((yVal, i) => {
              const y = scaleY(yVal);
              return (
                <g key={`grid-y-${i}`}>
                  <line
                    x1={margin.left}
                    y1={y}
                    x2={margin.left + innerWidth}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                  {/* Etiquetas eje Y (Izquierda) */}
                  <text
                    x={margin.left - 8}
                    y={y + 4}
                    fontSize="11"
                    fontWeight="600"
                    fill="#475569"
                    textAnchor="end"
                  >
                    {yVal}
                  </text>
                  {/* Etiquetas eje Y (Derecha - Fiel al folleto OMS) */}
                  <text
                    x={margin.left + innerWidth + 8}
                    y={y + 4}
                    fontSize="11"
                    fontWeight="600"
                    fill="#475569"
                    textAnchor="start"
                  >
                    {yVal}
                  </text>
                </g>
              );
            })}

            {/* Cuadrícula Fina Vertical */}
            {ticksX.map((xVal, i) => {
              const x = scaleX(xVal);
              return (
                <g key={`grid-x-${i}`}>
                  <line
                    x1={x}
                    y1={margin.top}
                    x2={x}
                    y2={margin.top + innerHeight}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                  {/* Etiquetas eje X */}
                  <text
                    x={x}
                    y={margin.top + innerHeight + 18}
                    fontSize="11"
                    fontWeight="600"
                    fill="#475569"
                    textAnchor="middle"
                  >
                    {xVal}
                  </text>
                </g>
              );
            })}

            {/* Franja Verde Sombreada (-2 a +2 DE) */}
            <path
              d={normalCorridorPath}
              fill="rgba(34, 197, 94, 0.08)"
              pointerEvents="none"
            />

            {/* CURVAS Z-SCORE OMS CANÓNICAS */}
            {/* +3 DE (Roja continua) */}
            <path d={generatePath('z3')} fill="none" stroke="#dc2626" strokeWidth="1.8" />
            <text x={margin.left + innerWidth + 20} y={scaleY(config.curvas[config.curvas.length - 1].z3) + 3} fill="#dc2626" fontSize="11" fontWeight="800">+3</text>

            {/* +2 DE (Roja discontinua / punteada) */}
            <path d={generatePath('z2')} fill="none" stroke="#dc2626" strokeWidth="1.8" strokeDasharray="5,4" />
            <text x={margin.left + innerWidth + 20} y={scaleY(config.curvas[config.curvas.length - 1].z2) + 3} fill="#dc2626" fontSize="11" fontWeight="800">+2</text>

            {/* +1 DE (Ámbar / Dorada) */}
            <path d={generatePath('z1')} fill="none" stroke="#d97706" strokeWidth="1.5" />
            <text x={margin.left + innerWidth + 20} y={scaleY(config.curvas[config.curvas.length - 1].z1) + 3} fill="#d97706" fontSize="11" fontWeight="700">+1</text>

            {/* 0 DE / Mediana (Verde gruesa sólida) */}
            <path d={generatePath('z0')} fill="none" stroke="#15803d" strokeWidth="2.5" />
            <text x={margin.left + innerWidth + 20} y={scaleY(config.curvas[config.curvas.length - 1].z0) + 3} fill="#15803d" fontSize="12" fontWeight="900">0</text>

            {/* -1 DE (Ámbar / Dorada) */}
            <path d={generatePath('zn1')} fill="none" stroke="#d97706" strokeWidth="1.5" />
            <text x={margin.left + innerWidth + 20} y={scaleY(config.curvas[config.curvas.length - 1].zn1) + 3} fill="#d97706" fontSize="11" fontWeight="700">-1</text>

            {/* -2 DE (Roja discontinua / punteada) */}
            <path d={generatePath('zn2')} fill="none" stroke="#dc2626" strokeWidth="1.8" strokeDasharray="5,4" />
            <text x={margin.left + innerWidth + 20} y={scaleY(config.curvas[config.curvas.length - 1].zn2) + 3} fill="#dc2626" fontSize="11" fontWeight="800">-2</text>

            {/* -3 DE (Roja continua) */}
            <path d={generatePath('zn3')} fill="none" stroke="#dc2626" strokeWidth="1.8" />
            <text x={margin.left + innerWidth + 20} y={scaleY(config.curvas[config.curvas.length - 1].zn3) + 3} fill="#dc2626" fontSize="11" fontWeight="800">-3</text>

            {/* Títulos de Ejes */}
            <text
              x={margin.left + innerWidth / 2}
              y={height - 12}
              fontSize="12"
              fontWeight="800"
              fill="#1e293b"
              textAnchor="middle"
            >
              {config.xLabel} ({config.xUnit})
            </text>

            <text
              transform={`rotate(-90)`}
              x={-(margin.top + innerHeight / 2)}
              y={18}
              fontSize="12"
              fontWeight="800"
              fill="#1e293b"
              textAnchor="middle"
            >
              {config.yLabel} ({config.yUnit})
            </text>

            {/* ── TRAZADO DE PUNTOS REALES DEL PACIENTE ── */}
            {puntosGrafica.length > 1 && (
              <polyline
                points={puntosGrafica.map(pt => `${scaleX(pt.x)},${scaleY(pt.y)}`).join(" ")}
                fill="none"
                stroke="#6b21a8" // Púrpura canónico
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {puntosGrafica.map((pt, i) => {
              const cx = scaleX(pt.x);
              const cy = scaleY(pt.y);
              const isHovered = hoveredPointIndex === i;

              return (
                <g 
                  key={i} 
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHoveredPointIndex(i)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                >
                  {/* Círculo de interacción amplio */}
                  <circle cx={cx} cy={cy} r="14" fill="transparent" />

                  {/* Círculo exterior con brillo si está seleccionado */}
                  {isHovered && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="9"
                      fill="rgba(107, 33, 168, 0.25)"
                    />
                  )}

                  {/* Punto púrpura con centro blanco */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? "6" : "5"}
                    fill="#6b21a8"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* ── TOOLTIP INFORMATIVO INTERACTIVO (Al posar el mouse sobre un punto) ── */}
        {hoveredPointIndex !== null && puntosGrafica[hoveredPointIndex] && (
          <div style={{
            padding: "12px 16px",
            background: "#0f172a",
            color: "#ffffff",
            borderRadius: "10px",
            margin: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ background: "#6b21a8", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
                Control: {puntosGrafica[hoveredPointIndex].fecha}
              </div>
              <span style={{ fontSize: "13px" }}>
                Edad: <strong>{formatearEdadMeses(puntosGrafica[hoveredPointIndex].edadMeses)}</strong>
              </span>
              <span>•</span>
              <span style={{ fontSize: "13px" }}>
                {config.yLabel}: <strong>{puntosGrafica[hoveredPointIndex].y} {config.yUnit}</strong>
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                Z-Score: <strong>{puntosGrafica[hoveredPointIndex].zScoreAprox > 0 ? `+${puntosGrafica[hoveredPointIndex].zScoreAprox}` : puntosGrafica[hoveredPointIndex].zScoreAprox} DE</strong>
              </span>
              <span style={{
                fontSize: "12px",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "6px",
                background: puntosGrafica[hoveredPointIndex].evalNutricional.color,
                color: "#ffffff"
              }}>
                {puntosGrafica[hoveredPointIndex].evalNutricional.estado}
              </span>
            </div>
          </div>
        )}

        {/* Leyenda Canónica Oficial OMS al pie */}
        <div style={{
          padding: "10px 18px",
          background: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          fontSize: "11px",
          color: "#475569"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "12px", height: "3px", background: "#15803d", display: "inline-block" }} />
              <strong>0 (Mediana OMS)</strong>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "12px", height: "10px", background: "rgba(34, 197, 94, 0.2)", display: "inline-block", borderRadius: "2px" }} />
              <span>Normal (-2 a +2 DE)</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "12px", height: "2px", background: "#d97706", display: "inline-block" }} />
              <span>±1 DE (Riesgo)</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "12px", height: "2px", background: "#dc2626", display: "inline-block" }} />
              <span>±2 / ±3 DE (Alerta)</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6b21a8", display: "inline-block" }} />
              <strong>Curva del Paciente</strong>
            </span>
          </div>

          <div>
            <span>Norma Técnica: Resolución 2465 de 2016 (MinSalud Colombia)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
