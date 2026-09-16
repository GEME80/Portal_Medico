<!-- ===================================================================== -->
<!-- 🏥 HUBMED PLATFORM — DOCUMENTACIÓN CANÓNICA OFICIAL                   -->
<!-- PROYECTO: Portal_Medico | MARCA: HubMed (hubmed.app)                  -->
<!-- REGLA DE AISLAMIENTO: Exclusivo de HubMed. Prohibida mezcla externa.  -->
<!-- ===================================================================== -->

> 🏥 **DOCUMENTO OFICIAL HUBMED PLATFORM** (`Portal_Medico`)  
> **Plataforma:** HubMed · SaaS Médico Multi-Tenant | **URL:** [`portal-medico-five.vercel.app`](https://portal-medico-five.vercel.app)  
> **Base de Datos:** Supabase (`nstiomejmhmcasxqxnbf` / `us-west-2`) | **SuperAdmin:** `gerkof@gmail.com`  
> 🔒 **INDICADOR DE ESTANQUEIDAD:** Este archivo pertenece exclusivamente a **HubMed**. Queda estrictamente prohibido mezclar directivas, esquemas o reglas con proyectos ajenos.

---

# 🗄️ GOBERNANZA Y REGISTRO DE MIGRACIONES SQL (`supabase/migrations/`)

**Autoridad Responsable:** 🗄️ Database & Data Integrity Custodian (DBA Agent)  
**Supervisión:** 🏛️ Principal Platform Architect  
**Motor de Persistencia:** PostgreSQL 15 Managed (Supabase `nstiomejmhmcasxqxnbf` en `us-west-2`)  
**Puerto de Conexión:** PgBouncer `6543` (Modo Transacción)  

---

## 1. Convención de Nomenclatura y Estándar Futuro

Para evitar colisiones entre ramas y garantizar determinismo cronológico en entornos CI/CD, a partir de la versión v2.0 se deprecó el prefijo secuencial simple (`001`, `002`) y **se adoptó formalmente la convención de timestamp UTC de 14 dígitos**:

```text
YYYYMMDDHHMMSS_descripcion_corta.sql
```

Ejemplo: `20260715165700_fix_clinical_grants.sql`

---

## 2. Estructura Obligatoria para Toda Nueva Migración

Conforme a `DATABASE_GOVERNANCE.md` y `SPECIALIZED_AGENTS.md`, queda terminantemente prohibido incorporar archivos `.sql` sin los tres bloques obligatorios:

```sql
-- ============================================================
-- MIGRACIÓN: [YYYYMMDDHHMMSS_nombre.sql]
-- AGENTE: DBA Custodian | FECHA: [ISO Date]
-- ============================================================

-- UP: Sentencias que aplican el cambio
[Sentencias SQL DDL/DML idempotentes con IF NOT EXISTS / ON CONFLICT]

-- DOWN: Sentencias de compensación o reversión completa
[Sentencias SQL de Rollback]

-- IMPACT_ESTIMATE:
-- · Tablas afectadas: [Lista]
-- · Filas estimadas: [N]
-- · Bloqueos: [Exclusivo / Compartido / Ninguno]
-- · Tiempo estimado de ejecución: [< 100ms / segundos]
-- · Aprobación requerida: [Automática / Requiere Agente Principal / Human-in-the-Loop]
```

---

## 3. Mapa y Secuencia Histórica de Migraciones

| Archivo | Fecha | Contenido y Propósito | Estado |
| :--- | :--- | :--- | :--- |
| `001_schema.sql` | 2026-06-23 | Estructura base de `tenants`, `configuracion`, perfiles y usuarios. | ✅ Aplicada |
| `002_rls.sql` | 2026-06-23 | Políticas iniciales de Row Level Security (RLS). | ✅ Aplicada |
| `003_seed.sql` | 2026-06-23 | Semilla del tenant piloto #1 (Dr. Carlos Torres). | ✅ Aplicada |
| `004_update_tenants.sql` | 2026-06-23 | Ampliación de campos para control de estado de suscripción SaaS. | ✅ Aplicada |
| `005_configuracion_vacunas.sql` | 2026-06-23 | Parámetros de biológicos y esquema de vacunación inicial. | ✅ Aplicada |
| `006_inventario_medico.sql` | 2026-06-23 | Tablas de inventario, lotes y movimientos (`kardex`). | ✅ Aplicada |
| `007_add_valor_mayorista.sql` | 2026-06-23 | Adición de columna `valor_mayorista` en inventario. | ✅ Aplicada |
| `008_add_valor_cobrado.sql` | 2026-06-23 | Adición de columna `valor_cobrado` en transacciones POS. | ✅ Aplicada |
| `009_grants.sql` | 2026-06-30 | Permisos de lectura/escritura para roles autenticados. | ✅ Aplicada |
| *(Gaps 010, 011, 012)* | — | *Nota:* Los cambios de las revisiones 010-012 fueron consolidados directamente en las migraciones de módulo clínico para evitar redundancias de esquemas efímeros. | ℹ️ Consolidado |
| `013_add_fecha_vencimiento.sql` | 2026-07-14 | Columna `fecha_vencimiento` en tabla de suscripción de tenants. | ✅ Aplicada |
| `20260630160131_clinical_module_multi_tenant.sql` | 2026-06-30 | Creación del EMR: `pacientes`, `historias_clinicas`, `logs_auditoria`, RLS. | ✅ Aplicada |
| `20260630160132_add_pacientes_fields.sql` | 2026-06-30 | Ampliación demográfica de pacientes (tipo_documento, EPS). | ✅ Aplicada |
| `20260630170000_ajustes_rips.sql` | 2026-06-30 | Campos de facturación y metadatos RIPS (Res. 000948/2026). | ✅ Aplicada |
| `20260630234142_oms_tables.sql` | 2026-06-30 | Tablas mundiales de referencia antropométrica de la OMS. | ✅ Aplicada |
| `20260701001602_oms_zscores.sql` | 2026-07-01 | Tablas de percentiles y desviaciones estándar z-scores de la OMS. | ✅ Aplicada |
| `20260701002507_oms_zscores_extension.sql` | 2026-07-01 | Extensión de rangos de edad en tablas z-score. | ✅ Aplicada |
| `20260701005000_oms_mediciones_independientes.sql` | 2026-07-01 | Mediciones antropométricas independientes de folios clínicos. | ✅ Aplicada |
| `20260701100000_fix_mediciones_rls.sql` | 2026-07-01 | Corrección de política RLS para mediciones de crecimiento. | ✅ Aplicada |
| `20260701161127_oms_chart_calibrations.sql` | 2026-07-01 | Calibración de curvas y z-scores para Recharts. | ✅ Aplicada |
| `20260701170044_add_image_url_to_oms_charts.sql` | 2026-07-01 | Soporte para curvas en formato gráfico vectorizado. | ✅ Aplicada |
| `20260715160300_grant_service_role.sql` | 2026-07-15 | Permisos `service_role` para procesos administrativos backend. | ✅ Aplicada |
| `20260715165700_fix_clinical_grants.sql` | 2026-07-15 | Alineación de permisos sobre esquemas clínicos para evitar errores 403. | ✅ Aplicada |
| `20260914095300_trigger_inalterabilidad.sql` | 2026-09-14 | Trigger PL/pgSQL duro de inalterabilidad para folios cerrados y soporte legal de notas aclaratorias. | ✅ Aplicada |
| `20260914095400_performance_indexes.sql` | 2026-09-14 | Índices compuestos B-Tree multi-tenant y GIN en `impresion_diagnostica` JSONB. | ✅ Aplicada |
| `20260914100000_rename_ecovaccine.sql` | 2026-09-14 | Actualización de CHECK constraint en `noticias_posts` a marca 'HubMed'. | ✅ Aplicada |
| `20260914104000_citas_y_carne.sql` | 2026-09-14 | Tablas `citas_medicas`, `miembros_equipo` y columna `token_acceso` en `pacientes` para carné digital. | ✅ Aplicada |
| `20260916120000_permisos_administrativos.sql` | 2026-09-16 | Permisos JSONB en `miembros_equipo` y segregación RLS en `historias_clinicas`. | ✅ Aplicada |
