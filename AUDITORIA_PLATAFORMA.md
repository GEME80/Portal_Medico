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

# 🔍 AUDITORÍA INTEGRAL DE PLATAFORMA Y SCORECARD DE MADUREZ (AUDITORIA_PLATAFORMA.md)

**Versión de Plataforma:** 3.15.0  
**Fecha de Auditoría:** Septiembre 2026  
**Auditor Rector:** 🔐 QA, Seguridad & Cryptography Auditor  
**Supervisión y Aprobación:** 🏛️ Principal Platform Architect  

---

## 1. Inventario de Rutas y Espacios del Sistema

```
                                  [ HUBMED PLATFORM ]
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
   [ ESPACIO 1 ]                     [ ESPACIO 2 ]                     [ ESPACIO 3 ]
  /superadmin                       /[slug]/admin                     /[slug]/(public)
```

| Espacio | Ruta | Componente / Tipo | Propósito | Nivel de Acceso |
| :--- | :--- | :--- | :--- | :--- |
| **Espacio 1** | `/superadmin` | Server Component (`page.tsx`) | Métricas SaaS consolidadas, KPIs de clínicas | Solo SuperAdmin (`gerkof@gmail.com`) |
| **Espacio 1** | `/superadmin/config` | Client Component (`page.tsx`) | Monitor de latencia PostgreSQL, test crypto | Solo SuperAdmin |
| **Espacio 1** | `/superadmin/login` | Client Component (`page.tsx`) | Portal de acceso exclusivo del operador | Público |
| **Espacio 1** | `/superadmin/facturacion` | Server + Client (`page.tsx`) | Facturación SaaS de suscripciones y mora | Solo SuperAdmin |
| **Espacio 2** | `/[slug]/admin` | Server Component (`page.tsx`) | Dashboard clínico del médico, resumen diario | Médico del consultorio (`doctor`) |
| **Espacio 2** | `/[slug]/admin/citas` | Server + Client (`page.tsx` + `AdminCitasManager.tsx`) | Agenda médica, citas y bloqueos | Médico / Recepción |
| **Espacio 2** | `/[slug]/admin/pacientes` | Server + Client (`page.tsx`) | Censo de pacientes, buscador rápido por doc | Personal asistencial del tenant |
| **Espacio 2** | `/[slug]/admin/pacientes/[id]`| Server Component (`page.tsx`) | Expediente médico individual, historial folios | Médico del consultorio |
| **Espacio 2** | `/[slug]/admin/reportes` | Server + Client (`page.tsx` + `RipsManager.tsx`) | Centro de comando RIPS MinSalud 2026 | Médico del consultorio |
| **Espacio 2** | `/[slug]/admin/inventario` | Server + Client (`page.tsx`) | POS de biológicos, lotes, regla FEFO, merma | Médico / Recepción |
| **Espacio 2** | `/[slug]/admin/equipo` | Server Component (`page.tsx`) | Gestión de accesos, roles y recepcionistas | Médico del consultorio |
| **Espacio 2** | `/[slug]/admin/personalizar`| Client Component (`page.tsx`) | Identidad visual, colores, subnav sticky | Médico del consultorio |
| **Espacio 2** | `/[slug]/admin/noticias` | Client Component (`page.tsx`) | Editor de publicaciones y artículos médicos | Médico del consultorio |
| **Espacio 3** | `/[slug]` | Server Component (`page.tsx`) | Landing page pública del médico | Pacientes / Público general |
| **Espacio 3** | `/[slug]/citas` | Server + Client (`BookingForm.tsx`) | Agendamiento en línea para pacientes | Pacientes / Público general |
| **Espacio 3** | `/[slug]/carne/[token]` | Server Component (`page.tsx`) | Carné vacunal digital público (token UUID) | Pacientes / Acudientes |
| **Espacio 3** | `/[slug]/crecimiento/[token]` | Server Component (`page.tsx`) | Visor de Curvas de Crecimiento OMS con Z-scores y WhatsApp | Pacientes / Acudientes |
| **Espacio 3** | `/[slug]/servicios` | Server Component (`page.tsx`) | Catálogo de servicios y especialidades | Pacientes / Público general |
| **Espacio 3** | `/[slug]/noticias` | Server Component (`page.tsx`) | Blog y noticias divulgativas de salud | Pacientes / Público general |

---

## 2. Inventario de Server Actions (`'use server'`)

| Archivo | Función | Entidad Afectada | Aislamiento Tenant | Normalización de Error |
| :--- | :--- | :--- | :--- | :--- |
| `lib/actions/clinical-actions.ts` | `guardarHistoriaClinica` | `historias_clinicas` | ✅ Valida `tenant_id` en sesión | ✅ `{ success, error, code }` |
| `lib/actions/clinical-actions.ts` | `crearPacienteExpress` | `pacientes` | ✅ Valida `tenant_id` en sesión | ✅ `{ success, error, code }` |
| `lib/actions/clinical-actions.ts` | `obtenerHistoriaClinica` | `historias_clinicas` | ✅ Valida `tenant_id` en sesión | ✅ `{ success, error, code }` |
| `lib/actions/clinical-actions.ts` | `guardarMedicionOMS` | `oms_mediciones` | ✅ Valida `tenant_id` en sesión | ✅ `{ success, error, code }` |
| `lib/actions/clinical-actions.ts` | `getCurvasDigitalPublico` | `pacientes`, `tenants`, `mediciones` | ✅ Resuelto por `token_acceso` y `tenant_id` | ✅ Objeto tipado o null |
| `lib/actions/clinical-actions.ts` | `agregarMedicionHistorica` | `paciente_mediciones_antropometricas`| ✅ Valida `tenant_id` y sesión médica | ✅ Inserción con perímetro cefálico |
| `lib/actions/vacunas-actions.ts` | `getCarneDigitalPublico` | `pacientes`, `tenants`, `aplicaciones_vacunas` | ✅ Resuelto por `token_acceso` y `tenant_id` | ✅ Objeto tipado o null |
| `app/superadmin/actions.ts` | `createTenantAction` | `tenants`, `configuracion` | ✅ Creación atómica de tenant | ✅ Validación y códigos |
| `app/superadmin/actions.ts` | `toggleTenantStatusAction`| `tenants` | ✅ Solo SuperAdmin | ✅ Validación y códigos |
| `app/[slug]/admin/actions.ts` | `payInvoiceAction` | `tenants` | ✅ Valida slug | ✅ Retorno estandarizado |
| `app/[slug]/admin/personalizar/actions.ts` | `guardarPersonalizacion` | `configuracion_portal`| ✅ Valida `tenant_id` | ✅ Retorno estandarizado |
| `app/[slug]/admin/noticias/actions.ts` | `guardarNoticiaAction` | `noticias_posts` | ✅ Valida `tenant_id` | ✅ Retorno estandarizado |

---

## 3. Inventario del Esquema Relacional en PostgreSQL 15 (Supabase)

| Tabla | Columnas Clave | Políticas RLS | Índices Principales | Estado |
| :--- | :--- | :--- | :--- | :--- |
| `tenants` | `id, nombre, slug, custom_domain, activo, estado_pago` | SuperAdmin Full, Lectura Pública por slug | `idx_tenants_slug`, `idx_tenants_domain` | ✅ Activo en prod |
| `configuracion_portal` | `id, tenant_id, nombre_comercial, colores, logo_url` | Segregado por `tenant_id` | `idx_config_tenant` | ✅ Activo en prod |
| `pacientes` | `id, tenant_id, documento, tipo_documento, nombres, apellidos` | Segregado por `tenant_id` | `idx_pacientes_tenant_doc` | ✅ Activo en prod |
| `historias_clinicas` | `id, tenant_id, paciente_id, medico_id, estado, parent_id` | Segregado por `tenant_id` | `idx_historias_tenant_fecha` | ✅ Activo en prod |
| `inventario_medico` | `id, tenant_id, nombre, stock_actual, precio_venta` | Segregado por `tenant_id` | `idx_inventario_tenant` | ✅ Activo en prod |
| `lotes_inventario` | `id, inventario_id, numero_lote, fecha_vencimiento, stock` | Segregado por `tenant_id` | `idx_lotes_vencimiento` | ✅ Activo en prod |
| `movimientos_inventario`| `id, tenant_id, lote_id, tipo, cantidad, motivo` | Append-Only por `tenant_id`| `idx_movimientos_tenant` | ✅ Activo en prod |
| `oms_tablas` & `zscores` | `id, indicador, sexo, edad_dias, l, m, s, sd0...` | Solo lectura global | `idx_oms_indicador_edad` | ✅ Activo en prod |
| `logs_auditoria` | `id, tenant_id, usuario_id, accion, entidad, created_at` | Append-Only estricto | `idx_auditoria_tenant_fecha` | ✅ Activo en prod |

---

## 4. Scorecard de Madurez de Ciberseguridad y Deuda Técnica

| Dimensión | Puntuación (1-5) | Estado Actual | Medidas Correctivas |
| :--- | :---: | :--- | :--- |
| **Aislamiento Multi-Tenant** | ⭐⭐⭐⭐⭐ (5.0) | RLS activo en todas las tablas clínicas, `tenant_id` validado en Edge Middleware. | Mantener política Deny-by-Default en toda nueva migración. |
| **Criptografía de Datos Médicos**| ⭐⭐⭐⭐⭐ (5.0) | AES-256-GCM activo en evolución médica con verificación obligatoria de `authTag`. | Mantener rotación segura de `CLINICAL_ENCRYPTION_KEY`. |
| **Integridad Legal (Inalterabilidad)**| ⭐⭐⭐⭐⭐ (5.0) | Trigger duro de PostgreSQL implementado (`20260914095300_trigger_inalterabilidad.sql`). | Folios cerrados y notas aclaratorias 100% inmutables por ley. |
| **Higiene del Repositorio** | ⭐⭐⭐⭐⭐ (5.0) | Scripts ad-hoc aislados de la raíz, TypeScript en 0 errores, build de producción limpio. | Consolidar suite de tests en CI/CD. |
| **Seguridad de Red y HTTP** | ⭐⭐⭐⭐⭐ (5.0) | Security Headers HTTP de grado médico (CSP, HSTS, X-Frame-Options) configurados en `next.config.ts`. | Monitorear compatibilidad de scripts en futuras dependencias. |
| **Gobernanza y Documentación** | ⭐⭐⭐⭐⭐ (5.0) | Conjunto documental canónico completo (`BITACORA_MAESTRA`, `ADR/`, `SECURITY.md`, `CHANGELOG.md`). | Mantener sincronización con cada hito productivo. |

---

## 5. Censo y Telemetría Real de Base de Datos (`nstiomejmhmcasxqxnbf`)

*Datos verificados en vivo mediante introspección directa con el motor Supabase:*

| Entidad / Tabla | Conteo Real | Metadatos y Datos Clave en Producción |
| :--- | :---: | :--- |
| **`tenants`** | **1** | **Tenant Piloto #1:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890`<br>• **Slug:** `dr-torres` (alias `/dr-carlos-torres` activo)<br>• **Nombre:** `Dr. Carlos Torres Martínez — Infectólogo Pediatra`<br>• **Plan:** `pro` · **Estado Pago:** `activo` |
| **`configuracion_portal`** | **1** | • **Doctor:** Dr. Carlos Torres Martínez (Infectología Pediátrica y Vacunología)<br>• **Clínica:** EcoVaccine Medical · **Consultorios:** 2<br>• **Contacto:** `drtorres@ecovaccine.med`, Tel/WhatsApp: `+573153546360`<br>• **Dirección:** Calle 134 N° 7b- 83, Bogotá, Colombia |
| **`catalogo_cie10`** | **14,484** | Catálogo oficial completo de la OMS / MinSalud Colombia importado y activo. |
| **`inventario_medico`** | **9** | Productos biológicos y medicamentos registrados. |
| **`lotes_inventario`** | **9** | Lotes de biológicos con trazabilidad y fecha de expiración. |
| **`categorias_inventario`**| **3** | Categorías activas (`Jeringas`, `Sueros`, etc.). |
| **`lineas_investigacion`** | **4** | Líneas activas: Infectología Pediátrica, Vacunología, Epidemiología, Hesitación Vacunal. |
| **`hitos_timeline`** | **6** | Hitos cronológicos de trayectoria médica del Dr. Torres. |
| **`noticias_posts`** | **4** | Artículos divulgativos publicados (`Epidemiología`, `Académico`). |
| **`pacientes`** | **1** | Paciente clínico verificado (`Mateo Silva Beltrán`, RC `123456789`). |
| **`historias_clinicas`** | **1** | Folio clínico en estado `cerrado` (`f2a179e0-9c12-46d5-b12b-15db8d912851`). |
| **`logs_auditoria`** | **1** | Registro de auditoría pericial inicial. |

