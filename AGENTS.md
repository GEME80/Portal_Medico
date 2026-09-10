# 🤖 DIRECTIVAS GLOBALES DE AGENTES — PORTAL_MEDICO (HUBMED)
## Protocolo de Gobernanza Multi-Agente | Reglas Supremas de Desarrollo

> **Proyecto Técnico:** `Portal_Medico` ([GEME80/Portal_Medico](https://github.com/GEME80/Portal_Medico.git))
> **Marca Comercial:** 🏥 **HubMed** (`HubMed Platform` / `hubmed.app`)
> **URL de Producción:** 🌐 [`https://portal-medico-five.vercel.app`](https://portal-medico-five.vercel.app)
> **Base de Datos:** 🗄️ **Supabase** (`nstlomejmhmcasxqxnbf` / PostgreSQL 15 `us-west-2` — Auth + RLS + PgBouncer 6543)
> **SuperAdmin:** 👑 `gerkof@gmail.com` — consola `/superadmin`
> **Tenant Piloto #1:** 👨‍⚕️ **Dr. Carlos Torres** (slug: `dr-carlos-torres`)
> **Autoridad Rectora:** 🏛️ **Agente Principal (Principal Platform Architect & DevSecOps Lead)**
> **Single Source of Truth:** 📘 `BITACORA_MAESTRA.md`
> **Código Rector:** 🛡️ `RULES_AND_SECURITY.md`
> **System-Prompts Ejecutables:** 🤖 `SPECIALIZED_AGENTS.md`

---

## 📌 1. Protocolo de Inicio Obligatorio (Todo Agente, Toda Sesión)

Al iniciar CUALQUIER tarea, el agente DEBE ejecutar este protocolo en orden:

1. **Leer `BITACORA_MAESTRA.md`** — Alinearse con el estado actual de la plataforma, la versión en curso y los hitos activos.
2. **Leer `RULES_AND_SECURITY.md`** — Confirmar las restricciones y guardrails vigentes.
3. **Leer `SPECIALIZED_AGENTS.md`** — Identificar qué agente corresponde a la tarea y seguir su system-prompt.
4. **Consultar `BACKLOG_MEJORAS.md`** — Verificar si la tarea tiene un ítem relacionado en el backlog.
5. **Ejecutar la tarea** — Dentro del marco definido por los documentos anteriores.
6. **Registrar el avance** — Si se cierra un hito, actualizar `BITACORA_MAESTRA.md`.

---

## 🏛️ 2. Los 3 Espacios del Sistema (Arquitectura Fundamental)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         PORTAL_MEDICO (HUBMED)                          │
│                    https://portal-medico-five.vercel.app                 │
├─────────────────────┬─────────────────────────┬────────────────────────┤
│   ESPACIO 1         │   ESPACIO 2             │   ESPACIO 3            │
│   /superadmin       │   /[slug]/admin         │   /[slug]/(public)     │
│                     │                         │                        │
│ · gerkof@gmail.com  │ · Médico / Doctor       │ · Pacientes            │
│ · Crea tenants      │ · Gestiona pacientes    │ · Portal del médico    │
│ · Facturación SaaS  │ · Historias clínicas    │ · Blog · Noticias      │
│ · Métricas globales │ · Inventario POS        │ · Vacunas públicas     │
│ · NO ve datos HCE   │ · Personaliza portal    │ · Login paciente       │
└─────────────────────┴─────────────────────────┴────────────────────────┘
```

**Regla Suprema de Aislamiento:** El Espacio 1 (SuperAdmin) NUNCA accede a datos clínicos individuales de pacientes. El Espacio 2 (Médico) NUNCA ve datos de otros tenants. Esta barrera es implementada por RLS de PostgreSQL y NO puede ser modificada sin aprobación del Agente Principal.

---

## 🔒 3. Reglas Inviolables de Desarrollo (Todo Agente)

### Multi-Tenant (MÁXIMA PRIORIDAD)
```typescript
// PROHIBIDO — acceso sin filtro de tenant:
const { data } = await supabase.from('pacientes').select('*');

// OBLIGATORIO — siempre filtrar por tenant:
const { data } = await supabase
  .from('pacientes')
  .select('id, nombres, apellidos, documento')  // Proyección mínima
  .eq('tenant_id', tenantId)                    // Filtro obligatorio
  .order('apellidos', { ascending: true })
  .limit(50);                                   // Siempre acotar
```

### Inalterabilidad de Historias Clínicas (MANDATO LEGAL)
```typescript
// PROHIBIDO — modificar folio cerrado directamente:
await supabase.from('historias_clinicas')
  .update({ plan_manejo: nuevoTexto })
  .eq('id', historiaId);  // ERROR: si estado='cerrado', trigger lo rechazará

// OBLIGATORIO — nota aclaratoria append-only:
await supabase.from('historias_clinicas').insert({
  tenant_id: tenantId,
  paciente_id: pacienteId,
  parent_id: historiaOriginalId,        // Vinculo al folio original
  estado: 'aclaratoria',
  motivo_aclaratoria: 'Corrección de...',
  medico_id: user.id,
  // ... resto de campos
});
```

### Criptografía (OBLIGATORIO para Datos Clínicos Sensibles)
```typescript
// ANTI-PATTERN: guardar texto plano en DB:
await supabase.from('historias_clinicas').insert({
  anamnesis: textoPaciente  // ❌ NUNCA texto plano
});

// GOOD PATTERN: cifrar antes de persistir:
import { encryptClinicalData } from '@/lib/crypto';
await supabase.from('historias_clinicas').insert({
  anamnesis: encryptClinicalData(textoPaciente)  // ✅ AES-256-GCM
});
```

### TypeScript (TOLERANCIA CERO A ERRORES)
```bash
# Ejecutar SIEMPRE antes de proponer código como final:
./node_modules/.bin/tsc --noEmit
# Resultado esperado: 0 errors, 0 warnings
```

### Variables de Entorno (SEGURIDAD)
```
# ✅ SOLO en Server Actions / Server Components / middleware:
SUPABASE_SERVICE_ROLE_KEY, CLINICAL_ENCRYPTION_KEY, SUPERADMIN_EMAIL

# ✅ Seguras en cliente (no son secretas):
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL

# ❌ PROHIBIDO — exponer en código 'use client':
SUPABASE_SERVICE_ROLE_KEY, CLINICAL_ENCRYPTION_KEY
```

---

## 📊 4. Jerarquía de Agentes y Delegación

| Agente | Activa para | Delega a |
| :--- | :--- | :--- |
| 🏛️ **Agente Principal** | Cualquier tarea nueva, decisiones de arquitectura, ADRs | Todos según dominio |
| 🌐 **Cloud Sentinel** | middleware.ts, Vercel, dominios, routing, TLS | Agente Principal (DDL) |
| 🗄️ **DBA Custodian** | Migraciones SQL, índices, triggers, RLS, PgBouncer | Agente Principal (DDL) |
| ⚕️ **Clinical Officer** | HCE, RIPS, CIE-10, CUPS, inalterabilidad, retención | DBA (schema) + Principal (aprobación) |
| 🎨 **Frontend Specialist** | Componentes, páginas, Design System, Recharts, TipTap | QA Auditor (pre-deploy) |
| 🔐 **QA Auditor** | Criptografía, tests, seguridad, pre-deploy checklist | Agente Principal (bloqueos) |

---

## 🚫 5. Guardrails Globales — PROHIBICIONES ABSOLUTAS

1. **PROHIBIDO** leer o modificar datos de un tenant desde el contexto de otro tenant.
2. **PROHIBIDO** generar migraciones DDL destructivas (DROP TABLE, TRUNCATE) sin aprobación humana explícita.
3. **PROHIBIDO** ejecutar `.select('*')` en tablas de alto tráfico sin justificación y sin `LIMIT`.
4. **PROHIBIDO** persistir campos clínicos sensibles (`anamnesis`, `enfermedad_actual`, `motivo_consulta`, `plan_manejo`) en texto plano.
5. **PROHIBIDO** exponer `SUPABASE_SERVICE_ROLE_KEY` o `CLINICAL_ENCRYPTION_KEY` en código del lado del cliente.
6. **PROHIBIDO** que `tsc --noEmit` falle con errores de tipado. Todo código propuesto DEBE compilar.
7. **PROHIBIDO** referenciar el proyecto como `lacombemedicalclinic`, `dr-carlos-torres-portal` o cualquier nombre distinto de `Portal_Medico` / `HubMed`.
