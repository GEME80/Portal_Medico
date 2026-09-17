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

# 📋 BACKLOG DE MEJORAS — ZERO TECHNICAL DEBT
## PROYECTO: PORTAL_MEDICO (HUBMED) | Actualizado: Septiembre 2026 v3.2

> **Modo Actual:** 🔍 AUDITORÍA DE DOCUMENTACIÓN Y ESTRUCTURA  
> Documento vivo. Marcar `[x]` cuando esté deployado y validado en producción.  
> Prioridad: mientras estemos en modo auditoría, NO implementar código — solo documentar, revisar y mejorar la estructura.

---

## ✅ COMPLETADO EN ESTA SESIÓN DE AUDITORÍA (v3.2.0)

- [x] **Documentación** — URL de producción Vercel y Supabase (`nstiomejmhmcasxqxnbf`) actualizada en TODOS los docs
- [x] **Documentación** — `DATABASE_GOVERNANCE.md` creado: normativa SRE completa para agentes
- [x] **Documentación** — `AUDITORIA_PLATAFORMA.md` creado: inventario completo + scorecard
- [x] **Agentes** — System-prompts ejecutables reescritos para los 6 agentes especializados
- [x] **Agentes** — `GEMINI.md` y `CLAUDE.md` actualizados con context completo y anti-patterns
- [x] **Agentes** — `SPECIALIZED_AGENTS.md` actualizado con skills detallados y fichas de rol
- [x] **[DOC-01]** Crear directorio `ADR/` con Architecture Decision Records retrospectivos (ADR-001 al ADR-004)
- [x] **[DOC-02]** Crear `SECURITY.md` — Política formal de divulgación de vulnerabilidades y cumplimiento MinSalud/Habeas Data
- [x] **[DOC-03]** Crear `CHANGELOG.md` — Registro formal de versiones según Keep a Changelog (v1.0.0 → v3.2.0)
- [x] **[DOC-04]** Fusionar y eliminar `PROJECT_BITACORA.md` (consolidado en `BITACORA_MAESTRA.md`)
- [x] **[EST-01]** Saneamiento de scripts raíz: 26 scripts `.js` ad-hoc clasificados y reubicados en `scripts/legacy_patches/` con `README.md`
- [x] **[EST-02]** Estandarización de migraciones SQL en `supabase/migrations/README.md` (mapa histórico y timestamps UTC)
- [x] **[EST-03]** Normalización de respuestas de Server Actions en `lib/actions/clinical-actions.ts` (`{ success, error, code }`)
- [x] **[EST-04]** Security Headers HTTP de grado médico configurados en `next.config.ts` (CSP, HSTS, X-Frame-Options, etc.)

---

## 🔍 FASE DE AUDITORÍA CONCLUIDA (Cero Deuda Técnica Estructural)

> Todas las directivas de auditoría documental, saneamiento del repositorio y gobernanza han sido ejecutadas satisfactoriamente.
> La plataforma se encuentra lista para iniciar la **FASE 1 — CRÍTICA**.

---

## 🔴 FASE 1 — CRÍTICA (Después de Auditoría)

- [x] **[DB-01]** Trigger duro de inalterabilidad en PostgreSQL (`20260914095300_trigger_inalterabilidad.sql`)
- [x] **[DB-02]** Índices compuestos en tablas clínicas (`20260914095400_performance_indexes.sql`)
  - `idx_pacientes_tenant_doc ON pacientes(tenant_id, documento)`
  - `idx_historias_tenant_paciente_fecha ON historias_clinicas(tenant_id, paciente_id, created_at DESC)`
  - `idx_historias_diagnosticos_gin ON historias_clinicas USING GIN (impresion_diagnostica)`
- [x] **[BACK-01]** Instalar Zod + crear `lib/validations/` con esquemas de cada entidad
- [x] **[INFRA-01]** Security Headers HTTP en `next.config.ts` (CSP, HSTS, X-Frame-Options)
- [x] **[INFRA-02]** Limpiar scripts ad-hoc de la raíz del repositorio

---

## 🟠 FASE 2 — ALTA (2 Semanas)

- [x] **[QA-01]** Instalar Vitest + suite mínima de tests de estanqueidad multi-tenant
- [x] **[BACK-02]** Crear `lib/rips/generator.ts` — Motor de generación RIPS JSON (Res. 000948)
- [x] **[INFRA-03]** Rate Limiting en Middleware (`@upstash/ratelimit` + Vercel KV)
- [x] **[INFRA-04]** CI/CD Pipeline (`.github/workflows/check.yml`)
- [x] **[DB-03]** Migrar referencia `'EcoVaccine'` → `'HubMed'` en CHECK constraint de `noticias_posts`

---

## 🟡 FASE 3 — FEATURES (1 Mes)

- [x] **[FEAT-01]** Módulo de Citas/Agenda (`/[slug]/admin/citas` + `/[slug]/citas`)
- [x] **[FEAT-02]** Carné Vacunal Digital para Pacientes (`/[slug]/carne-vacunal`)
- [x] **[FEAT-03]** Módulo RIPS Exportable (`/[slug]/admin/reportes`)
- [x] **[FEAT-04]** Gestión de equipo del consultorio (`/[slug]/admin/equipo`) con rol `recepcion`
- [x] **[INFRA-05]** Monitoreo de errores Sentry (`@sentry/nextjs`)
- [x] **[INFRA-06]** Módulo de Facturación SuperAdmin (`/superadmin/facturacion`)

---

## 🟣 FASE 4 — AUTOMATIZACIÓN INTEGRAL RIPS & FACTURACIÓN ELECTRÓNICA (EN ROADMAP / ADR-005)

- [ ] **[RIPS-AUTO-01]** Pipeline Asíncrono de Auto-Generación RIPS al Cerrar Historia (`/api/rips/auto-process` o Edge Function en segundo plano sin bloquear al médico).
- [ ] **[RIPS-AUTO-02]** Conector API con Pasarela Contable / Validador MUV (Siigo API, Facturatech o Alegra) para transmisión del payload Res. 2275 y obtención del CUV.
- [ ] **[RIPS-AUTO-03]** Emisión automática de Factura Electrónica de Venta en Salud (FEV / DIAN) asociada al CUFE y CUV.
- [ ] **[RIPS-AUTO-04]** Trazabilidad y persistencia en la Historia Clínica (`historias_clinicas.facturacion`: CUV, CUFE, número de factura y URL del PDF/XML).
- [ ] **[RIPS-AUTO-05]** Envío automático o en 1-clic del PDF de la Factura y Carné al correo o WhatsApp del paciente.


