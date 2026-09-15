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

# 🏥 HubMed Platform (`Portal_Medico`)
### Plataforma SaaS Multi-Tenant de Gestión Médica, Vacunación e Historias Clínicas Electrónicas (HCE)

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%2015-emerald?logo=supabase)](https://supabase.com/)
[![Version](https://img.shields.io/badge/Version-v3.5.0-teal)](https://github.com/GEME80/Portal_Medico)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

---

## 🌟 Visión del Proyecto

**Portal_Medico** (nombre comercial **HubMed Platform**) es una solución SaaS elástica y de grado médico diseñada para consultorios individuales, clínicas de especialistas y centros de salud. Provee a cada profesional de la salud un portal independiente con su propia identidad de marca, dominio o subdominio (`*.hubmed.app`), gestión de citas, inventario POS de biológicos y un expediente médico electrónico (EMR) blindado conforme a la legislación del **Ministerio de Salud y Protección Social de Colombia**.

* **🌐 URL de Producción:** [`https://portal-medico-five.vercel.app`](https://portal-medico-five.vercel.app)
* **🗄️ Base de Datos:** [Supabase](https://supabase.com/) — `nstiomejmhmcasxqxnbf` / PostgreSQL 15 `us-west-2` (Auth + RLS + PgBouncer)
* **☁️ Hosting:** [Vercel](https://vercel.com/) — Edge Network Global (Next.js 16)
* **Primer Cliente Activo (Tenant Piloto #1):** 👨‍⚕️ **Dr. Carlos Torres** (`/dr-carlos-torres`), pediatra y especialista en vacunación basada en evidencia.

---

## 🏛️ Arquitectura de la Plataforma

```
                                     [ PACIENTES / PÚBLICO ]
                                                │
                          ┌─────────────────────┴─────────────────────┐
                          ▼                                           ▼
               [ Dominio Personalizado ]                   [ Subdominio *.hubmed.app ]
               (ej: drtorres.com)                          (ej: drcarlos.hubmed.app)
                          │                                           │
                          └─────────────────────┬─────────────────────┘
                                                │
                                                ▼
                     ┌─────────────────────────────────────────────────────┐
                     │          GLOBAL EDGE & CDN NETWORK (VERCEL)         │
                     │  - Enrutamiento dinámico Multi-Tenant por hostname │
                     │  - Terminación TLS 1.3 con certificados wildcard    │
                     │  - Middleware de resolución de slug de clínica/médico│
                     └──────────────────────────┬──────────────────────────┘
                                                │
                                                ▼
                     ┌─────────────────────────────────────────────────────┐
                     │       COMPUTE LAYER: NEXT.JS 16 (APP ROUTER)        │
                     │  - [slug]/(public)   : Portales públicos de médicos │
                     │  - [slug]/admin      : Consola clínica / inventario │
                     │  - /superadmin       : Gestión global de tenants    │
                     │  - React 19.2 + Recharts 3.9 + TipTap Editor        │
                     │  - Node.js 20.x Serverless Runtimes                 │
                     └──────────────────────────┬──────────────────────────┘
                                                │
                            ┌───────────────────┴───────────────────┐
                            │ (Supabase SSR / Service Role)         │ (AES-256-GCM Engine)
                            ▼                                       ▼
         ┌─────────────────────────────────────────────────────────────────────────┐
         │              DATABASE & STORAGE CLOUD LAYER (SUPABASE)                  │
         │  - Managed PostgreSQL 15 Engine con particionado lógico por tenant_id    │
         │  - Row Level Security (RLS) Estricto: get_tenant_id() & is_superadmin() │
         │  - PgBouncer Transaction Pooler (Puerto 6543)                           │
         │  - Trigger check_inalterabilidad() para folios clínicos cerrados        │
         │  - Módulo Criptográfico lib/crypto.ts (CLINICAL_ENCRYPTION_KEY)         │
         │  - S3-Compatible Encrypted Object Storage (Logos, Documentos, Fotos)    │
         └─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Pilares de Ciberseguridad y Cumplimiento Normativo (MinSalud Colombia)

1. **Aislamiento Multi-Tenant Deny-by-Default:** Cada consulta está segregada mediante `tenant_id = get_tenant_id()` y reforzada con políticas de PostgreSQL Row Level Security (RLS).
2. **Inalterabilidad Jurídica (Resolución 1995/1999 y Res. 000948/2026):** Los folios clínicos en estado `'cerrado'` no pueden ser modificados ni eliminados. El trigger de base de datos `check_inalterabilidad()` aborta cualquier intento.
3. **Notas Aclaratorias Append-Only:** Las enmiendas médicas se registran como folios subordinados vinculados por `parent_id` con timestamp y autoría verificada.
4. **Criptografía AES-256-GCM:** Los campos clínicos confidenciales (`enfermedad_actual`, `anamnesis`, `motivo_consulta`, `plan_manejo`) se encriptan a nivel de columna con el módulo `lib/crypto.ts` validando la etiqueta de autenticación (`authTag`).
5. **Snapshot Demográfico:** Se congelan los datos demográficos y de aseguramiento del paciente al instante del cierre (`snapshot_demografico` JSONB).
6. **Retención Legal a 15-20 Años (Resolución 839/2017):** Estrategia de archivo de gestión (5 años) y archivo central/frío (10 a 15 años más), con custodia extendida hasta los 33 años para pacientes pediátricos.

---

## 🛠️ Stack Tecnológico

* **Framework:** Next.js 16.2.9 (App Router)
* **Frontend:** React 19.2.4, Tailwind CSS v4, Motion, Lucide React
* **Editor Clínico:** TipTap (`@tiptap/react`) con sanitización XSS
* **Antropometría & Somatometría:** Recharts 3.9 (Curvas de crecimiento OMS y percentiles z-scores)
* **Base de Datos & Auth:** Supabase (PostgreSQL 15 administrado) con PgBouncer
* **Criptografía:** `crypto` nativo de Node.js (AES-256-GCM) y Supabase Vault
* **Validación de Datos:** Zod v4 (`lib/validations/clinical.ts`) con tipado estricto

---

## 📦 Módulos Funcionales Implementados

* 📅 **Agenda de Citas (`/[slug]/admin/citas`):** Programación y control de estados (`programada`, `confirmada`, `cancelada`, `completada`) con persistencia multi-tenant y revalidación de caché.
* 🪪 **Carné Vacunal Digital (`/[slug]/carne/[token]`):** Portal público interactivo accesible mediante Magic Token criptográfico (sin coste de usuarios MAU en Supabase Auth) con exportación nativa a PDF.
* 📊 **Panel de Reportes RIPS (`/[slug]/admin/reportes`):** Exportación masiva en JSON estructurado conforme a la Resolución 000948/2026 de MinSalud (CIE-10, CUPS y snapshot demográfico).
* 👥 **Gestión de Equipo y Roles (`/[slug]/admin/equipo`):** Aprovisionamiento y asignación de roles (`admin`, `medico`, `recepcion`) protegiendo el acceso a historias clínicas confidenciales.
* 💳 **Facturación y Finanzas SuperAdmin (`/superadmin/facturacion`):** Consola ejecutiva global con control de ingresos recurrentes (MRR), suspensiones y activaciones de consultorios.
* 📈 **Somatometría & Curvas OMS (`/[slug]/admin/pacientes/[id]`):** Gráficos calibrados interactivos con percentiles y z-scores oficiales de la OMS.

---

## 🚀 Inicio Rápido en Desarrollo Local

### 1. Clonar el Repositorio
```bash
git clone https://github.com/GEME80/Portal_Medico.git
cd Portal_Medico
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno

#### Desarrollo Local (`.env.local`)
```env
# Supabase (Instancia local via supabase start)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_local
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_local

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# SuperAdmin y Criptografía
SUPERADMIN_EMAIL=gerkof@gmail.com
CLINICAL_ENCRYPTION_KEY=tu_clave_hex_de_64_caracteres_aes256
```

#### Producción (Variables en Vercel Dashboard)
```env
# Supabase Cloud (Producción — configurar en vercel.com/dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://nstiomejmhmcasxqxnbf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key_produccion>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_produccion>

# App (URL de Producción Vercel)
NEXT_PUBLIC_APP_URL=https://portal-medico-five.vercel.app

# SuperAdmin y Criptografía
SUPERADMIN_EMAIL=gerkof@gmail.com
CLINICAL_ENCRYPTION_KEY=<clave_hex_64_chars_aes256_produccion>
```

> **⚠️ IMPORTANTE:** La URL de Supabase en producción se configura directamente en el **Vercel Dashboard** → Settings → Environment Variables. Nunca subir claves de producción al repositorio.

### 4. Ejecutar Servidor de Desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 5. Chequeo de Tipado Estricto (QA)
```bash
npx tsc --noEmit
```
*Debe retornar 0 errores de compilación de forma obligatoria.*

---

## 📑 Documentación Canónica Oficial

* 📘 **[BITACORA_MAESTRA.md](BITACORA_MAESTRA.md):** Arquitectura completa, esquemas relacionales, estado del arte y roadmap.
* 🛡️ **[RULES_AND_SECURITY.md](RULES_AND_SECURITY.md):** Código rector de reglas de ingeniería, matriz de ciberseguridad y QA.
* 🤖 **[SPECIALIZED_AGENTS.md](SPECIALIZED_AGENTS.md):** Organigrama de agentes especializados, jerarquía y matriz de 7 Skills.
* ⚕️ **[PROTOCOLO_MINSALUD_HISTORIAS_MEDICAS.md](PROTOCOLO_MINSALUD_HISTORIAS_MEDICAS.md):** Protocolo normativo y técnico para custodia, inalterabilidad y retención de HCE.
* 🛡️ **[SECURITY.md](SECURITY.md):** Política oficial de seguridad y reporte de vulnerabilidades.
* 📋 **[CHANGELOG.md](CHANGELOG.md):** Registro histórico y formal de versiones (Keep a Changelog / SemVer).
* 🔍 **[AUDITORIA_PLATAFORMA.md](AUDITORIA_PLATAFORMA.md):** Inventario técnico integral y scorecard de madurez de seguridad.
* 🏛️ **[ADR/](ADR/):** Registros de Decisiones de Arquitectura (Supabase, AES-256-GCM, Routing, App Router).
