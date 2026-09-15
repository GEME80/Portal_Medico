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

# ADR-003: Arquitectura Multi-Tenant Híbrida (Path-Based Routing + Hostname Resolution)

**Fecha:** 2026-06-22  
**Estado:** Aprobado  
**Agentes Involucrados:** 🌐 Cloud & Multi-Tenant Routing Sentinel & 🏛️ Principal Platform Architect  
**Actualización Bitácora:** v1.0 — Core Multi-Tenant & Routing  

---

## 1. Contexto y Problema

HubMed Platform atiende múltiples clínicas y consultorios médicos independientes. Cada profesional de la salud o centro médico requiere:
1. Una URL directa para su portal público y consola administrativa.
2. Posibilidad de operar bajo la marca genérica de la plataforma (`hubmed.app` o subdominios `*.hubmed.app`).
3. Soporte para conectar su propio dominio comercial personalizado (ej: `drtorres.com` vía CNAME).
4. Acceso sin fricción en entornos de desarrollo local (`localhost:3000`) y entornos de staging (`*.vercel.app`).

Opciones evaluadas:
1. **Subdominios Puros Exclusivos (`[tenant].hubmed.app`):** Requiere configuración DNS wildcard y dificulta el desarrollo local sin manipular `/etc/hosts`.
2. **Path-Based Puro Exclusivo (`hubmed.app/[slug]`):** No permite dominios personalizados limpios de primer nivel para médicos prémium.
3. **Arquitectura Híbrida (Path-Based Canónico + Vercel Edge Middleware Re-writes):** El App Router maneja la estructura canónica interna en `app/[slug]/`, mientras el `middleware.ts` reescribe transparentemente las peticiones basadas en hostnames (subdominios y dominios personalizados).

---

## 2. Decisión

Se adoptó la **Arquitectura Híbrida de Enrutamiento Multi-Tenant**:

1. **Estructura Canónica en Next.js App Router:**
   - La raíz física del código reside en carpetas dinámicas `app/[slug]/(public)/` para portales de pacientes y `app/[slug]/admin/` para consolas médicas.
   - La consola del operador global se ubica fuera del espacio de tenants en `app/superadmin/`.
2. **Middleware de Resolución Perimetral (`middleware.ts`):**
   - Si el `host` entrante corresponde a un dominio personalizado (`custom_domain`) o subdominio asignado, el middleware consulta la caché/tabla `tenants` y reescribe silenciosamente (`NextResponse.rewrite`) la URL hacia `/[slug]/...`.
   - Si el request proviene del dominio base o de desarrollo, se navega directamente mediante el prefijo `/[slug]`.
3. **Reserva Estricta de Slugs (`RESERVED_SLUGS`):**
   - Se prohíbe el registro de tenants con nombres que colisionen con rutas de sistema: `superadmin`, `api`, `admin`, `_next`, `favicon.ico`, `auth`, `public`, `login`.
4. **Validación de Seguridad Cross-Tenant en Middleware:**
   - En rutas administrativas `/[slug]/admin`, el middleware valida que el usuario autenticado posea `tenant_id` coincidente con el registro del slug objetivo, o que cuente con privilegios de `superadmin`, previniendo la suplantación de identidad entre consultorios.

---

## 3. Consecuencias y Trade-offs

### Positivas
- Máxima flexibilidad: Funciona perfectamente en desarrollo local (`localhost:3000/dr-carlos-torres`), en staging de Vercel y con dominios propios en producción sin cambiar código.
- SEO optimizado para el portal del médico tanto con dominio propio como con subdominio.
- Desacoplamiento total entre la lógica de vistas y la resolución DNS.

### Negativas / Mitigaciones
- *Latencia en Búsqueda de Dominio:* Una consulta adicional a la base de datos por petición con hostname desconocido. **Mitigación:** Caché perimetral en cabeceras Edge y validación inmediata en el pool PgBouncer.
