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

# CLAUDE.md — DIRECTRICES DE INGENIERÍA: PORTAL_MEDICO (HUBMED)

## Identidad del Proyecto
- **Proyecto Técnico:** `Portal_Medico` (GitHub: [`GEME80/Portal_Medico`](https://github.com/GEME80/Portal_Medico.git))
- **Marca Comercial:** `HubMed` (`HubMed Platform` / `hubmed.app`)
- **URL de Producción:** [`https://portal-medico-five.vercel.app`](https://portal-medico-five.vercel.app) — Vercel Edge Network
- **Base de Datos:** `Supabase` (`nstiomejmhmcasxqxnbf` / PostgreSQL 15 `us-west-2` — Auth + RLS + PgBouncer 6543)
- **SuperAdmin:** `gerkof@gmail.com` (Propietario HubMed — consola `/superadmin`)
- **Primer Cliente (Tenant #1):** `Dr. Carlos Torres` (`dr-carlos-torres`) — Pediatra y Vacunación

## Comandos Principales
```bash
npm run dev          # Desarrollo local (http://localhost:3000)
npm run build        # Build de producción
npm run lint         # ESLint
./node_modules/.bin/tsc --noEmit  # Type-check (DEBE ser 0 errores)
```

## Stack Tecnológico
- **Next.js 16.2.9** (App Router) + **React 19.2.4** + **TypeScript 5.x** (strict: true)
- **Tailwind CSS v4** + **Lucide React v1.21.0** + **TipTap 3.27.x** (editor clínico)
- **Recharts 3.9.0** (curvas de crecimiento OMS/pediatría)
- **Supabase SSR `^0.12.0`** + **`@supabase/supabase-js ^2.108.2`**
- `lib/crypto.ts` — AES-256-GCM para cifrado de campos clínicos sensibles

## Arquitectura — Los 3 Espacios
```
/superadmin           → SuperAdmin (gerkof@gmail.com) — gestión de N tenants SaaS
/[slug]/admin         → Médico — su consultorio privado, aislado por tenant_id + RLS
/[slug]/(public)      → Pacientes — portal público del médico (sin auth requerida)
```

## Reglas Inviolables de Arquitectura

### 1. Multi-Tenant Absoluto
```typescript
// PROHIBIDO — sin filtro de tenant:
const { data } = await supabase.from('pacientes').select('*');

// OBLIGATORIO — siempre filtrar + proyección mínima:
const { data } = await supabase
  .from('pacientes')
  .select('id, nombres, apellidos, documento')
  .eq('tenant_id', tenantId)
  .limit(50);
```

### 2. Inalterabilidad de Historias Clínicas (Mandato Legal MinSalud)
- Folios con `estado = 'cerrado'` son INMUTABLES por ley (Resolución 000948/2026).
- PROHIBIDO: `UPDATE historias_clinicas WHERE id = X` si el folio está cerrado.
- OBLIGATORIO: Notas aclaratorias con `parent_id` apuntando al folio original.

### 3. Criptografía AES-256-GCM
```typescript
// Campos que DEBEN cifrarse ANTES de INSERT:
// enfermedad_actual, motivo_consulta, anamnesis, plan_manejo
import { encryptClinicalData, decryptClinicalData } from '@/lib/crypto';
const encrypted = encryptClinicalData(textoSensible);  // Guardar esto en DB
const decrypted = decryptClinicalData(encryptedFromDB); // Al leer de DB
// Si authTag falla → CRITICAL AUDIT ALERT → logs_auditoria → notificar SuperAdmin
```

### 4. Conexión a Supabase & Resiliencia de Clientes
```typescript
// SIEMPRE puerto 6543 (PgBouncer Transaction Mode) — NUNCA 5432 desde serverless
// Rutas Públicas (/[slug]/(public)/*) → createClient() (anon key bajo RLS público)
// Rutas Administrativas (/[slug]/admin/*) → authSupabase = createClient() (sesión) con fallback
// Server Actions mutacionales de backend → lib/supabase/server.ts createAdminClient()
// Client Components ('use client') → lib/supabase/client.ts (anon key)
// NOTA: 'configuracion_portal' no tiene columnas de menú sueltas; parsear hero_badge_texto (JSON)
```

### 5. Normativa MinSalud Colombia
- **CIE-10:** Diagnósticos → tabla `catalogo_cie10` (mínimo 1 al cerrar historia)
- **CUPS:** Procedimientos → tabla `catalogo_cups`
- **RIPS 2026:** Datos persistidos listos para el JSON del validador MinSalud (Resolución 000948)
- **ReTHUS:** Validación de tarjeta profesional del médico

### 6. Variables de Entorno
```bash
# Solo en Server (NUNCA en 'use client'):
SUPABASE_SERVICE_ROLE_KEY, CLINICAL_ENCRYPTION_KEY, SUPERADMIN_EMAIL

# Seguros en cliente (NEXT_PUBLIC_*):
NEXT_PUBLIC_SUPABASE_URL=https://nstiomejmhmcasxqxnbf.supabase.co
NEXT_PUBLIC_APP_URL=https://portal-medico-five.vercel.app
```

## Anti-Patterns Prohibidos
| Prohibición | Alternativa |
|-------------|-------------|
| `.select('*')` sin LIMIT en tablas de alto tráfico | Proyección mínima + LIMIT |
| `useEffect` para fetch de datos | Server Components + `Promise.all()` |
| SQL con concatenación de strings | Parámetros `$1` de Supabase |
| Texto plano en campos clínicos sensibles | `encryptClinicalData()` |
| `SERVICE_ROLE_KEY` en código cliente | Solo en Server Actions |

## Fuentes de Verdad
- **Bitácora Maestra:** `BITACORA_MAESTRA.md` — Single Source of Truth
- **Reglas y Seguridad:** `RULES_AND_SECURITY.md`
- **Agentes Especializados:** `SPECIALIZED_AGENTS.md` — System-prompts ejecutables
- **Protocolo MinSalud:** `PROTOCOLO_MINSALUD_HISTORIAS_MEDICAS.md`
- **Gobernanza DB:** `DATABASE_GOVERNANCE.md`
- **Backlog:** `BACKLOG_MEJORAS.md`
