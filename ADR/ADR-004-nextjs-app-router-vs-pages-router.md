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

# ADR-004: Next.js 16 App Router vs Pages Router para Plataforma Médica Multi-Tenant

**Fecha:** 2026-06-21  
**Estado:** Aprobado  
**Agentes Involucrados:** 🎨 Frontend & Medical UX/UI Specialist & 🏛️ Principal Platform Architect  
**Actualización Bitácora:** v1.0 — Adopción de App Router & RSC  

---

## 1. Contexto y Problema

HubMed Platform requiere una arquitectura frontend capaz de satisfacer tres perfiles de usuario totalmente disímiles en la misma base de código:
1. **Pacientes (Espacio Público):** Tiempos de carga ultrarrápidos, optimización SEO de contenidos médicos, portales estáticos con hidratación mínima.
2. **Médicos (Consola Clínica / Inventario):** Interfaces interactivas de alto dinamismo (gráficas antropométricas OMS con Recharts, editor clínico TipTap enriquecido, modales POS de facturación e inventario).
3. **SuperAdmin (Operador SaaS):** Métricas analíticas, creación atómica de tenants y auditoría global.

Se contrastó el uso del tradicional **Pages Router** (`/pages`) frente al moderno **App Router** (`/app`) en Next.js 16 con React 19.

---

## 2. Decisión

Se seleccionó **Next.js 16 App Router con React 19 y Server Actions** como el estándar arquitectónico de la plataforma por los siguientes motivos:

1. **Seguridad Nativa mediante React Server Components (RSC):**
   - En el App Router, los componentes son de servidor por defecto. Esto garantiza que lógica crítica, llaves de API y consultas a Supabase nunca se expongan en el bundle JavaScript enviado al navegador del paciente o médico, reduciendo la superficie de ataque XSS.
2. **Layouts Anidados para los 3 Espacios del Sistema:**
   - Facilita la división física y visual de la aplicación mediante `layout.tsx` independientes:
     - `app/superadmin/layout.tsx`: Layout oscuro con navegación global para el operador.
     - `app/[slug]/admin/layout.tsx`: Sidebar clínica, métricas de inventario y estado del consultorio.
     - `app/[slug]/(public)/layout.tsx`: Portal minimalista, accesible y optimizado para móviles de pacientes.
   - Los layouts anidados preservan el estado entre transiciones de ruta sin re-renderizar la jerarquía superior.
3. **Server Actions (`'use server'`) para Operaciones Críticas:**
   - Reemplaza la necesidad de mantener cientos de endpoints de API REST intermedios (`/api/...`). Operaciones como el guardado de folios médicos, adición de vacunas o actualización de configuración se ejecutan como funciones asíncronas fuertemente tipadas en el servidor.
4. **Streaming y React Suspense:**
   - Permite cargar de manera progresiva componentes pesados como las tablas mundiales OMS y curvas somatométricas sin bloquear el renderizado inicial de la historia médica.

---

## 3. Consecuencias y Trade-offs

### Positivas
- Reducción drástica del bundle de JavaScript en el cliente.
- Prevención de fugas de credenciales y consultas no filtradas en el frontend.
- Cero waterfalls de red al consultar la base de datos directamente en Server Components con `Promise.all`.

### Negativas / Mitigaciones
- *Curva de Aprendizaje de `'use client'` vs Server Components:* Se documentó en `RULES_AND_SECURITY.md` y `SPECIALIZED_AGENTS.md` la prohibición de colocar lógica sensible en componentes marcados con `'use client'`.
- *Compatibilidad con Librerías Client-Side (TipTap, Recharts):* Componentes gráficos interactivos se aíslan estrictamente con la directiva `'use client'` en archivos dedicados (ej: `OfficialGrowthChart.tsx`, `RichTextEditor.tsx`) y son consumidos por Server Components.
