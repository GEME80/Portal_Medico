# 📋 BACKLOG DE MEJORAS — ZERO TECHNICAL DEBT
## PROYECTO: PORTAL_MEDICO (HUBMED) | Actualizado: Septiembre 2026 v3.2

> **Modo Actual:** 🔍 AUDITORÍA DE DOCUMENTACIÓN Y ESTRUCTURA  
> Documento vivo. Marcar `[x]` cuando esté deployado y validado en producción.  
> Prioridad: mientras estemos en modo auditoría, NO implementar código — solo documentar, revisar y mejorar la estructura.

---

## ✅ COMPLETADO EN ESTA SESIÓN DE AUDITORÍA

- [x] **Documentación** — URL de producción Vercel y Supabase (`nstlomejmhmcasxqxnbf`) actualizada en TODOS los docs
- [x] **Documentación** — `DATABASE_GOVERNANCE.md` creado: normativa SRE completa para agentes
- [x] **Documentación** — `AUDITORIA_PLATAFORMA.md` creado: inventario completo + scorecard
- [x] **Agentes** — System-prompts ejecutables reescritos para los 6 agentes especializados
- [x] **Agentes** — `GEMINI.md` y `CLAUDE.md` actualizados con context completo y anti-patterns
- [x] **Agentes** — `SPECIALIZED_AGENTS.md` actualizado con skills detallados y fichas de rol

---

## 🔍 EN MODO AUDITORÍA (No implementar código aún)

### Documentación Pendiente
- [ ] **[DOC-01]** Crear directorio `ADR/` con Architecture Decision Records retrospectivos
  - ADR-001: Supabase vs Firebase (elección de BaaS)
  - ADR-002: AES-256-GCM vs pgcrypto (estrategia de cifrado)
  - ADR-003: Path-based Multi-Tenant vs Subdomain routing
  - ADR-004: Next.js App Router vs Pages Router
- [ ] **[DOC-02]** Crear `SECURITY.md` — Política de divulgación de vulnerabilidades (obligatorio para plataformas médicas)
- [ ] **[DOC-03]** Crear `CHANGELOG.md` — Registro formal de versiones (v1.0 → v3.2)
- [ ] **[DOC-04]** Eliminar o fusionar `PROJECT_BITACORA.md` (redundante con BITACORA_MAESTRA)

### Estructura de Código Pendiente de Auditoría
- [ ] **[EST-01]** Revisar y catalogar los 17 scripts `.js` en raíz del proyecto (decidir cuáles mover a `/scripts/`, cuáles eliminar)
- [ ] **[EST-02]** Revisar la numeración inconsistente de migraciones SQL (salto de 009 → 013, mezcla de formatos)
- [ ] **[EST-03]** Auditar que TODOS los Server Actions en `lib/actions/` tienen manejo de errores normalizado (`{ error: string, code: string }`)
- [ ] **[EST-04]** Auditar que `next.config.ts` tiene configuración de seguridad completa (headers, CSP)

---

## 🔴 FASE 1 — CRÍTICA (Después de Auditoría)

- [ ] **[DB-01]** Trigger duro de inalterabilidad en PostgreSQL (`020_trigger_inalterabilidad.sql`)
- [ ] **[DB-02]** Índices compuestos en tablas clínicas (`021_performance_indexes.sql`)
  - `idx_pacientes_tenant_doc ON pacientes(tenant_id, documento)`
  - `idx_historias_tenant_paciente_fecha ON historias_clinicas(tenant_id, paciente_id, created_at DESC)`
  - `idx_historias_diagnosticos_gin ON historias_clinicas USING GIN (impresion_diagnostica)`
- [ ] **[BACK-01]** Instalar Zod + crear `lib/validations/` con esquemas de cada entidad
- [ ] **[INFRA-01]** Security Headers HTTP en `next.config.ts` (CSP, HSTS, X-Frame-Options)
- [ ] **[INFRA-02]** Limpiar scripts ad-hoc de la raíz del repositorio

---

## 🟠 FASE 2 — ALTA (2 Semanas)

- [ ] **[QA-01]** Instalar Vitest + suite mínima de tests de estanqueidad multi-tenant
- [ ] **[BACK-02]** Crear `lib/rips/generator.ts` — Motor de generación RIPS JSON (Res. 000948)
- [ ] **[INFRA-03]** Rate Limiting en Middleware (`@upstash/ratelimit` + Vercel KV)
- [ ] **[INFRA-04]** CI/CD Pipeline (`.github/workflows/check.yml`)
- [ ] **[DB-03]** Migrar referencia `'EcoVaccine'` → `'HubMed'` en CHECK constraint de `noticias_posts`

---

## 🟡 FASE 3 — FEATURES (1 Mes)

- [ ] **[FEAT-01]** Módulo de Citas/Agenda (`/[slug]/admin/citas` + `/[slug]/citas`)
- [ ] **[FEAT-02]** Carné Vacunal Digital para Pacientes (`/[slug]/carne-vacunal`)
- [ ] **[FEAT-03]** Módulo RIPS Exportable (`/[slug]/admin/reportes`)
- [ ] **[FEAT-04]** Gestión de equipo del consultorio (`/[slug]/admin/equipo`) con rol `recepcion`
- [ ] **[INFRA-05]** Monitoreo de errores Sentry (`@sentry/nextjs`)
- [ ] **[INFRA-06]** Módulo de Facturación SuperAdmin (`/superadmin/facturacion`)
