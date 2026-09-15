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

# 🩺 CONTEXTO DEL PROYECTO: PORTAL_MEDICO (HUBMED)
## Directrices para Modelos Gemini — Arquitectura, Estándares y Guardrails

> **Proyecto Técnico:** `Portal_Medico` ([GEME80/Portal_Medico](https://github.com/GEME80/Portal_Medico.git))
> **Marca Comercial:** 🏥 **HubMed** (`HubMed Platform` / `hubmed.app`)
> **URL de Producción:** 🌐 [`https://portal-medico-five.vercel.app`](https://portal-medico-five.vercel.app) — Vercel Edge Network
> **Base de Datos:** 🗄️ **Supabase** (`nstiomejmhmcasxqxnbf` / PostgreSQL 15 `us-west-2` — Auth + RLS + PgBouncer 6543)
> **Tenant Piloto #1:** 👨‍⚕️ **Dr. Carlos Torres** (slug: `dr-carlos-torres`) — Pediatra y Vacunación
> **SuperAdmin:** 👑 `gerkof@gmail.com` (Propietario HubMed — consola `/superadmin`)
> **Marco Regulatorio:** Ministerio de Salud y Protección Social de Colombia
> **Single Source of Truth:** 📘 `BITACORA_MAESTRA.md` | **Agentes:** 🤖 `SPECIALIZED_AGENTS.md`

---

## 🛠️ Stack Tecnológico Oficial

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.9 |
| UI Library | React + Tailwind CSS v4 | 19.2.4 |
| Iconografía | Lucide React | v1.21.0 |
| Gráficas | Recharts (Curvas OMS z-scores) | 3.9.0 |
| Editor Clínico | TipTap (sanitización XSS) | 3.27.x |
| Base de Datos BaaS | Supabase — PostgreSQL 15 Managed | - |
| Seguridad DB | Row Level Security (RLS) Multi-Tenant | - |
| Connection Pool | PgBouncer Transaction Mode | Puerto 6543 |
| Cifrado | AES-256-GCM nativo (`lib/crypto.ts`) | - |
| Hosting | Vercel Edge Network | - |

---

## 🏗️ Arquitectura de los 3 Espacios

```
/superadmin          → Propietario de la plataforma HubMed (gerkof@gmail.com)
                       Gestión de N tenants médicos. NO accede a datos clínicos.

/[slug]/admin        → Espacio privado de cada médico/clínica.
                       Aislado por tenant_id con RLS en PostgreSQL.
                       Ej: /dr-carlos-torres/admin

/[slug]/(public)     → Portal público del médico para sus pacientes.
                       Accesible sin auth. Ej: /dr-carlos-torres
```

---

## ⚕️ Estándares Técnicos Obligatorios (MinSalud Colombia)

1. **CIE-10 / CIE-11:** Toda codificación de diagnóstico DEBE estructurarse contra `catalogo_cie10`. Mínimo 1 código CIE-10 para cerrar una historia clínica.
2. **CUPS:** Toda orden médica o procedimiento DEBE usar `catalogo_cups` (Clasificación Única de Procedimientos en Salud de Colombia).
3. **RIPS 2026 (Resolución 000948/Mayo 2026):** Los datos clínicos DEBEN persistirse listos para serializar al JSON oficial del validador de MinSalud.
4. **Inalterabilidad (Append-Only):** Folios cerrados (`estado = 'cerrado'`) son inmutables por ley. Rectificaciones SOLO vía notas aclaratorias con `parent_id`.
5. **Snapshot Demográfico:** Congelar edad y afiliación del paciente al momento del cierre en `snapshot_demografico` (JSONB).
6. **Zona Horaria:** El backend fuerza `America/Bogota`. Se usa exclusivamente `now()` certificado por el motor de DB.
7. **TypeScript Estricto:** `strict: true`. Todo payload clínico DEBE tener contratos de tipado. `tsc --noEmit` = 0 errores.

---

## 🔐 Reglas de Seguridad que el Modelo DEBE Respetar

### Multi-Tenant — Obligatorio
```typescript
// ANTI-PATTERN (acceso sin filtro):
const { data } = await supabase.from('pacientes').select('*');

// GOOD PATTERN (siempre filtrar + proyección mínima):
const { data } = await supabase
  .from('pacientes')
  .select('id, nombres, apellidos, documento')
  .eq('tenant_id', tenantId)
  .order('apellidos')
  .limit(50);
```

### Criptografía — Obligatorio
```typescript
// Campos que DEBEN cifrarse antes de INSERT en DB:
// enfermedad_actual, motivo_consulta, anamnesis, plan_manejo

import { encryptClinicalData } from '@/lib/crypto';
const encrypted = encryptClinicalData(textoSensible); // AES-256-GCM
```

### Variables de Entorno — Obligatorio
```
// SERVER ONLY (nunca en 'use client'):
SUPABASE_SERVICE_ROLE_KEY, CLINICAL_ENCRYPTION_KEY, SUPERADMIN_EMAIL

// SEGUROS EN CLIENTE (NEXT_PUBLIC_* están diseñados para eso):
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL
```

---

## 🚫 Anti-Patterns Prohibidos para Modelos Gemini

| Anti-Pattern | Por qué está prohibido | Alternativa |
|-------------|----------------------|-------------|
| `.select('*')` en tablas de alto tráfico | Egress innecesario + lento sin índices | Proyectar solo columnas necesarias |
| `useEffect` para fetch de datos | Causa waterfall de red | Server Components con `Promise.all()` |
| SQL dinámico con concatenación de strings | Vulnerabilidad a SQL Injection | Parámetros `$1` de Supabase |
| Persistir datos clínicos en texto plano | Violación de privacidad médica | `encryptClinicalData()` de `lib/crypto.ts` |
| Exponer `SERVICE_ROLE_KEY` en cliente | Acceso ilimitado a la DB desde el navegador | Solo en Server Actions y Routes |
| `UPDATE` sobre `estado = 'cerrado'` | Violación de la inalterabilidad legal | Nota aclaratoria con `parent_id` |
| Usar puerto 5432 desde funciones serverless | Agota el pool de PostgreSQL | Puerto 6543 (PgBouncer Transaction Mode) |
| Hardcodear `tenant_id` o `slug` | Acoplamiento que rompe la arquitectura multi-tenant | Leerlo del JWT (`app_metadata.tenant_id`) |

---

## 📑 Documentos Oficiales del Ecosistema

| Documento | Propósito |
|-----------|----------|
| 📘 `BITACORA_MAESTRA.md` | Single Source of Truth — arquitectura, DB, roadmap, versiones |
| 🛡️ `RULES_AND_SECURITY.md` | Código rector de reglas, RBAC, criptografía y QA |
| 🤖 `SPECIALIZED_AGENTS.md` | System-prompts ejecutables de los 6 agentes especializados |
| ⚕️ `PROTOCOLO_MINSALUD_HISTORIAS_MEDICAS.md` | Marco legal HCE, RIPS 2026, retención |
| 🗄️ `DATABASE_GOVERNANCE.md` | Normativa SRE para agentes — RCA, debugging, CI/CD |
| 📋 `BACKLOG_MEJORAS.md` | Backlog vivo de deuda técnica (Zero Technical Debt) |
| 🔒 `GUARDRAILS.md` | Restricciones de última instancia — tolerancia cero |
