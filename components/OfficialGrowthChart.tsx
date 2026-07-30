'use client';

import React, { useState, useEffect } from 'react';
import { saveOmsChartCalibration } from '@/lib/actions/clinical-actions';

type ChartConfig = {
  id: string;
  name: string;
  imageSrc: string; // URL de la imagen de fondo
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  // Para alinear la cuadrícula si la imagen tiene márgenes (título, etiquetas de ejes)
  // Valores en porcentaje (0 a 100)
  gridLeftPct: number; 
  gridBottomPct: number;
  gridWidthPct: number;
  gridHeightPct: number;
  xLabel: string;
  yLabel: string;
};

export const OMS_CHART_CONFIGS: Record<string, ChartConfig> = {
  'peso_talla_ninos_0_2': {
    id: 'peso_talla_ninos_0_2',
    name: 'Peso para la Talla (Niños 0 a 2 años)',
    imageSrc: '/oms_charts/peso_talla_ninos_0_2.jpg',
    minX: 45,
    maxX: 110,
    minY: 1,
    maxY: 26,
    // Valores calibrados milimétricamente basados en la captura (Recorte Azul)
    gridLeftPct: 7.7,
    gridBottomPct: 9.9,
    gridWidthPct: 86.1, 
    gridHeightPct: 85.2,
    xLabel: 'Longitud (cm)',
    yLabel: 'Peso (kg)',
  },
  'peso_edad_ninos_0_2': {
    id: 'peso_edad_ninos_0_2',
    name: 'Peso para la Edad (Niños 0 a 2 años)',
    imageSrc: '/oms_charts/peso_edad_ninos_0_2.jpg',
    minX: 0,
    maxX: 24,
    minY: 1,
    maxY: 18,
    gridLeftPct: 5.6,
    gridBottomPct: 10.2,
    gridWidthPct: 91.3,
    gridHeightPct: 85.1,
    xLabel: 'Edad (meses)',
    yLabel: 'Peso (kg)',
  },
  'peso_talla_ninas_0_2': {
    id: 'peso_talla_ninas_0_2',
    name: 'Peso para la Talla (Niñas 0 a 2 años)',
    imageSrc: '/oms_charts/peso_talla_ninas_0_2.jpg',
    minX: 45,
    maxX: 110,
    minY: 1,
    maxY: 26,
    gridLeftPct: 7.7,
    gridBottomPct: 9.9,
    gridWidthPct: 86.1, 
    gridHeightPct: 85.2,
    xLabel: 'Longitud (cm)',
    yLabel: 'Peso (kg)',
  },
  'peso_edad_ninas_0_2': {
    id: 'peso_edad_ninas_0_2',
    name: 'Peso para la Edad (Niñas 0 a 2 años)',
    imageSrc: '/oms_charts/peso_edad_ninas_0_2.jpg',
    minX: 0,
    maxX: 24,
    minY: 1,
    maxY: 18,
    gridLeftPct: 5.6,
    gridBottomPct: 10.2,
    gridWidthPct: 91.3,
    gridHeightPct: 85.1,
    xLabel: 'Edad (meses)',
    yLabel: 'Peso (kg)',
  }
};

type Point = {
  x: number;
  y: number;
  date: string;
  tooltipInfo?: string;
};

type Props = {
  chartType: string;
  data: Point[];
  dbCalibrations?: Record<string, any>;
};

export default function OfficialGrowthChart({ chartType, data, dbCalibrations }: Props) {
  const config = OMS_CHART_CONFIGS[chartType];
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [isCalibrationMode, setIsCalibrationMode] = useState(false);
  
  const [saving, setSaving] = useState(false);
  
  const dbCalib = dbCalibrations?.[chartType];

  const [calib, setCalib] = useState({
    left: dbCalib?.left ?? config?.gridLeftPct ?? 0,
    bottom: dbCalib?.bottom ?? config?.gridBottomPct ?? 0,
    width: dbCalib?.width ?? config?.gridWidthPct ?? 0,
    height: dbCalib?.height ?? config?.gridHeightPct ?? 0
  });

  // Reset calibración al cambiar de gráfica
  useEffect(() => {
    if (config) {
      const currentDbCalib = dbCalibrations?.[chartType];
      setCalib({
        left: currentDbCalib?.left ?? config.gridLeftPct,
        bottom: currentDbCalib?.bottom ?? config.gridBottomPct,
        width: currentDbCalib?.width ?? config.gridWidthPct,
        height: currentDbCalib?.height ?? config.gridHeightPct
      });
    }
  }, [config, dbCalibrations, chartType]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveOmsChartCalibration(chartType, calib.left, calib.bottom, calib.width, calib.height);
      alert('Calibración guardada exitosamente en la base de datos.');
    } catch (e: any) {
      alert('Error al guardar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return <div style={{ padding: 20, color: 'red' }}>Configuración de gráfica no encontrada: {chartType}</div>;
  }

  // Filtrar puntos fuera de rango para evitar que se salgan de la gráfica
  const validData = data.filter(pt => 
    pt.x >= config.minX && pt.x <= config.maxX && 
    pt.y >= config.minY && pt.y <= config.maxY
  ).sort((a, b) => a.x - b.x); // Ordenar por eje X para la línea

  console.log('OfficialGrowthChart render', { chartType, dataLength: data.length, validDataLength: validData.length, data, validData });

  // Función para mapear un punto a coordenadas de porcentaje dentro del GRID
  const getCoordinates = (x: number, y: number) => {
    // 1. Porcentaje dentro de la cuadrícula (0 a 1)
    const xPct = ((x - config.minX) / (config.maxX - config.minX)) * 100;
    const yPct = ((y - config.minY) / (config.maxY - config.minY)) * 100;
    
    return {
      left: calib.left + (xPct * calib.width) / 100,
      bottom: calib.bottom + (yPct * calib.height) / 100,
    };
  };

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
          {config.name}
        </h3>
        {!isCalibrationMode && (
          <button 
            onClick={() => setIsCalibrationMode(true)}
            style={{ fontSize: '12px', backgroundColor: '#e2e8f0', color: '#475569', padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Calibrar Gráfica
          </button>
        )}
      </div>
      
      {isCalibrationMode && (
        <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>🛠 Modo Calibración Activo</h3>
            <button onClick={() => setIsCalibrationMode(false)} style={{ fontSize: '12px', backgroundColor: '#bfdbfe', color: '#1e3a8a', padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Cerrar</button>
          </div>
          <p style={{ fontSize: '12px', color: '#2563eb', marginBottom: '12px', marginTop: 0 }}>Ajusta estos valores hasta que el recuadro verde con borde grueso cubra exactamente las líneas de la cuadrícula gris de la imagen de fondo (desde el eje 0 hasta el final).</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Izquierda (Left %)</label>
              <input type="number" step="0.1" value={calib.left} onChange={e => setCalib({...calib, left: Number(e.target.value)})} style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Abajo (Bottom %)</label>
              <input type="number" step="0.1" value={calib.bottom} onChange={e => setCalib({...calib, bottom: Number(e.target.value)})} style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Ancho (Width %)</label>
              <input type="number" step="0.1" value={calib.width} onChange={e => setCalib({...calib, width: Number(e.target.value)})} style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Alto (Height %)</label>
              <input type="number" step="0.1" value={calib.height} onChange={e => setCalib({...calib, height: Number(e.target.value)})} style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }} />
            </div>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', backgroundColor: 'white', padding: '8px', borderRadius: '4px', border: '1px solid #dbeafe', fontFamily: 'monospace', color: '#334155' }}>
              gridLeftPct: <b>{calib.left}</b>, gridBottomPct: <b>{calib.bottom}</b>, gridWidthPct: <b>{calib.width}</b>, gridHeightPct: <b>{calib.height}</b>
            </div>
            <button 
              onClick={handleSave} 
              disabled={saving}
              style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Guardando...' : 'Guardar Calibración'}
            </button>
          </div>
        </div>
      )}

      {/* Contenedor relativo que mantiene la relación de aspecto y carga la imagen */}
        <div 
          style={{ 
            position: 'relative', 
            width: '100%', 
            aspectRatio: '16/9', // Ajustar según las imágenes reales
            backgroundColor: '#f8fafc',
            backgroundImage: `url('${dbCalibrations?.[chartType]?.image_url || config.imageSrc}')`,
            backgroundSize: '100% 100%', // Forzamos estiramiento para coincidir exactamente
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
        {/* Línea que conecta los puntos */}
        {validData.length > 1 && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1, overflow: 'visible' }}>
            <polyline 
              points={validData.map(pt => {
                const coords = getCoordinates(pt.x, pt.y);
                return `${coords.left},${100 - coords.bottom}`; // SVG y es invertido
              }).join(' ')}
              fill="none"
              stroke="#6b21a8" // purple-800
              strokeWidth="0.4" // Porque el viewBox es 100x100
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* Recuadro de calibración (Se muestra solo en modo calibración) */}
        {isCalibrationMode && (
          <div 
            style={{
              position: 'absolute',
              left: `${calib.left}%`,
              bottom: `${calib.bottom}%`,
              width: `${calib.width}%`,
              height: `${calib.height}%`,
              backgroundColor: 'rgba(34, 197, 94, 0.15)', // Verde semitransparente
              border: '2px solid rgb(21, 128, 61)', // Borde verde oscuro
              boxSizing: 'border-box',
              pointerEvents: 'none',
              zIndex: 0
            }}
          />
        )}

        {/* Líneas guía (Crosshairs) para depuración y calibración */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1, overflow: 'visible' }}>
          {validData.map((pt, i) => {
             const coords = getCoordinates(pt.x, pt.y);
             return (
               <g key={`crosshair-${i}`}>
                 {/* Linea vertical de extremo a extremo */}
                 <line x1={coords.left} y1="0" x2={coords.left} y2="100" stroke="rgba(255, 0, 0, 0.4)" strokeWidth="0.15" strokeDasharray="0.5,0.5" />
                 {/* Linea horizontal de extremo a extremo */}
                 <line x1="0" y1={100 - coords.bottom} x2="100" y2={100 - coords.bottom} stroke="rgba(255, 0, 0, 0.4)" strokeWidth="0.15" strokeDasharray="0.5,0.5" />
               </g>
             )
          })}
        </svg>

        {/* Puntos de datos */}
        {validData.map((pt, i) => {
          const coords = getCoordinates(pt.x, pt.y);
          const isHovered = hoveredPoint === i;
          return (
            <div 
              key={i}
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{
                position: 'absolute',
                left: `${coords.left}%`,
                bottom: `${coords.bottom}%`,
                width: '14px',
                height: '14px',
                backgroundColor: isHovered ? '#d8b4fe' : '#6b21a8',
                border: '3px solid white',
                borderRadius: '50%',
                transform: 'translate(-50%, 50%)', // Centrar exactamente en el punto
                zIndex: isHovered ? 10 : 2,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  zIndex: 20
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid #334155', paddingBottom: '4px' }}>
                    Fecha: {pt.date}
                  </div>
                  <div>{config.xLabel}: <strong>{pt.x}</strong></div>
                  <div>{config.yLabel}: <strong>{pt.y}</strong></div>
                  
                  {/* Triangulito del tooltip */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%) rotate(45deg)',
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
