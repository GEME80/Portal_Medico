# 📦 Scripts de Parcheo Histórico y Mantenimiento Ad-Hoc (`scripts/legacy_patches/`)

Este directorio archiva los 26 scripts JavaScript utilizados durante las fases tempranas de construcción (junio - julio 2026) para mutaciones de código en lote, pruebas de inyección y ajustes en caliente.

> ⚠️ **IMPORTANTE:** Estos scripts están archivados únicamente para propósitos de auditoría histórica y trazabilidad forense. **No deben ejecutarse en producción.**

---

## 🗂️ Clasificación del Inventario

### 1. Modificaciones de Vistas y Componentes UI
- `modify_page.js` / `modify_page_2.js`: Modificaciones en `inventario/page.tsx` para formularios y tipados de categorías.
- `modify_admin_page.js` / `modify_admin_page_fix.js`: Ajustes en la consola de administración `[slug]/admin/page.tsx`.
- `modify_admin_tweaks.js`: Ajustes en la presentación de métricas y enlaces de administración.
- `modify_layout.js`: Reorganización de alertas de reorden de inventario.
- `modify_merma.js`: Inyección de modales de registro de mermas y bajas de biológicos por vencimiento.
- `modify_inventario_page.js`: Filtros y ordenamiento dinámico en inventario.
- `replace_table.js`: Reemplazo de tablas de existencias con encabezados accesibles.
- `revert_admin_link.js` / `revert_diario.js`: Scripts de compensación y rollback de links y pestañas temporales.

### 2. Generación y Modificación de Gráficas
- `generate_charts.js` / `generate_charts_v3.js` / `generate_charts_v4.js`: Prototipos de gráficas financieras y de flujo con Recharts.
- `modify_charts.js` / `modify_charts_flujo.js` / `modify_charts_top.js`: Adaptación de gráficas de flujo de entradas/salidas y top items.
- `modify_dashboard_tabs.js`: Pestañas interactivas mensual/general en dashboard.
- `add_inflation_chart.js`: Prototipos de comparativas anuales de costos.

### 3. Dosis y Vacunación
- `fix_usar_dosis.js`: Lógica de deducción de dosis individuales de viales multidosis.
- `fix_recharts.js`: Ajuste de compatibilidad de tipos con Recharts.
- `get_hitos_cols.js`: Extracción de columnas de hitos de desarrollo.
- `update_admin_kpis.js`: Cálculo de KPIs de existencias inactivas en dashboard.

### 4. Pruebas y Diagnósticos
- `test-insert.js`: Prueba histórica de inserción con `service_role`.
- `verify_dashboard.js`: Generador de datos de prueba para verificación visual multitenant (credenciales saneadas).
