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

# 📘 BITÁCORA MAESTRA / MASTER SYSTEM BLUEPRINT: PORTAL_MEDICO (HUBMED)
## ARQUITECTURA SAAS MULTI-TENANT, GOBERNANZA CLOUD Y EFICIENCIA DE BASE DE DATOS

> **Nombre Técnico del Proyecto / Repositorio:** 💻 `Portal_Medico` ([GEME80/Portal_Medico](https://github.com/GEME80/Portal_Medico.git))  
> **Nombre Comercial / Marca de la Plataforma:** 🏥 **HubMed** (`HubMed Platform` / `hubmed.app`)  
> **URL de Producción:** 🌐 **[`https://portal-medico-five.vercel.app`](https://portal-medico-five.vercel.app)** — Vercel Edge Network Global  
> **Base de Datos:** 🗄️ **Supabase** (`nstiomejmhmcasxqxnbf` / PostgreSQL 15 `us-west-2` — Auth + RLS + PgBouncer 6543)  
> **Arquitectura Multi-Cliente:** SaaS Multi-Tenant Dinámico con capacidad para $N$ clientes médicos/clínicas  
> **Primer Cliente / Tenant Piloto (Tenant #1):** 👨‍⚕️ **Dr. Carlos Torres** (slug canónico en DB: `dr-torres`, alias/redirect: `dr-carlos-torres` / Infectología Pediátrica y Vacunología)  
> **Consola Maestra Global:** 👑 **SuperAdmin** (`gerkof@gmail.com` — `/superadmin` — Operación, Aprovisionamiento y Facturación SaaS)  
> **Autoridad Rectora:** 🏛️ **Agente Principal (Principal Platform Architect & DevSecOps Lead)**  
> **Infraestructura Cloud:** ☁️ **Vercel Global Edge Network (Next.js 16) + Supabase Managed PostgreSQL (AWS Multi-AZ)**  
> **Estándar Ciberseguridad:** 🔒 **Multi-Tenant RLS Deny-by-Default + AES-256-GCM Column Encryption + Privacy-Preserving Scheduling**  
> **Estándar Normativo Sanitario:** ⚕️ **Ministerio de Salud de Colombia (Resolución 2465 de 2016, Resolución 2275 de 2023, Resolución 000948 de 2026, RIPS, CIE-10, CUPS, REPS, ReTHUS)**  
> **Fecha de Actualización:** 17 de Septiembre 2026 (v3.15.0)  

---

## 🧭 Índice de Documentación Oficial de HubMed Platform

1. 📘 [BITACORA_MAESTRA.md](file:///Users/germanmorales/.gemini/antigravity/scratch/portal_medico/BITACORA_MAESTRA.md) — Bitácora Maestra, Arquitectura Global, Espacios del Sistema y Eficiencia de DB.
2. 🛡️ [RULES_AND_SECURITY.md](file:///Users/germanmorales/.gemini/antigravity/scratch/portal_medico/RULES_AND_SECURITY.md) — Código Rector de Reglas, Ciberseguridad, Aislamiento Multi-Tenant y QA.
3. 🤖 [SPECIALIZED_AGENTS.md](file:///Users/germanmorales/.gemini/antigravity/scratch/portal_medico/SPECIALIZED_AGENTS.md) — Ecosistema de Agentes Especializados, Jerarquía y Skills Técnicos/Clínicos.
4. ⚕️ [PROTOCOLO_MINSALUD_HISTORIAS_MEDICAS.md](file:///Users/germanmorales/.gemini/antigravity/scratch/portal_medico/PROTOCOLO_MINSALUD_HISTORIAS_MEDICAS.md) — Protocolo MinSalud de Inalterabilidad, Custodia, Cifrado y Archivo de Historias Clínicas (HCE / RIPS 2026).
5. 🛡️ [SECURITY.md](file:///Users/germanmorales/.gemini/antigravity/scratch/portal_medico/SECURITY.md) — Política oficial de ciberseguridad, reporte coordinado de vulnerabilidades y cumplimiento sanitario.
6. 📋 [CHANGELOG.md](file:///Users/germanmorales/.gemini/antigravity/scratch/portal_medico/CHANGELOG.md) — Registro histórico formal de versiones (Keep a Changelog / SemVer).
7. 🔍 [AUDITORIA_PLATAFORMA.md](file:///Users/germanmorales/.gemini/antigravity/scratch/portal_medico/AUDITORIA_PLATAFORMA.md) — Inventario técnico integral de rutas, tablas, server actions y scorecard.
8. 🏛️ [ADR/](file:///Users/germanmorales/.gemini/antigravity/scratch/portal_medico/ADR) — Registros de Decisiones de Arquitectura (ADR-001 a ADR-005: Supabase, AES-256-GCM, Routing Híbrido, App Router y Automatización Asíncrona RIPS/MUV/FEV).

---

## 🏛️ 1. Arquitectura de los 3 Espacios del Ecosistema

La plataforma divide rigurosamente sus operaciones en tres espacios complementarios y desacoplados:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ESPACIO 1: CONSOLA GLOBAL SUPERADMIN                   │
│                                 (/superadmin)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Operado por: Propietario / Operador de HubMed (gerkof@gmail.com)          │
│ • Control central de clínicas/doctores: Creación en 1-click de nuevos tenants│
│ • Gestión de planes SaaS, estado de pago (activo, suspendido) y facturación │
│ • Monitoreo de infraestructura cloud, cuotas de BD y telemetría global      │
│ • Privacidad de Datos: NO accede a registros clínicos individuales          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
┌─────────────────────────────────────────┐   ┌─────────────────────────────────────────┐
│     ESPACIO 2: ESPACIO DE CLIENTE       │   │    ESPACIO 3: ESPACIO PACIENTE/PÚBLICO  │
│        (TENANT CONSOLE: /[slug]/admin)  │   │       (PORTAL PÚBLICO: /[slug])         │
├─────────────────────────────────────────┤   ├─────────────────────────────────────────┤
│ • Operado por: Cada Médico o Clínica    │   │ • Accedido por: Pacientes y Comunidad   │
│   (Ej: Dr. Carlos Torres = Tenant #1)   │   │ • Subdominio: drcarlos.hubmed.app       │
│   (Futuros clientes: Dr. Pérez, etc.)   │   │ • Dominio Propio: drtorres.com (CNAME)  │
│ • Gestión privada de sus pacientes      │   │ • Presentación médica y servicios       │
│ • Historias Clínicas y EMR inalterable  │   │ • Información de vacunación pediátrica  │
│ • Inventario POS y lotes de biológicos  │   │ • Portal de citas y contacto            │
│ • Personalización de colores y marca    │   │ • Carné vacunal digital de paciente     │
└─────────────────────────────────────────┘   └─────────────────────────────────────────┘
```

### A. Espacio SuperAdmin (`/superadmin`)
* **Propósito:** Gestión integral de la plataforma como negocio SaaS.
* **Componentes:**
  * `Dashboard`: KPIs consolidados de clientes (`TOTAL CLÍNICAS`, `CLÍNICAS ACTIVAS`, `CLÍNICAS SUSPENDIDAS`).
  * `CreateTenantModal`: Formulario de onboarding que aprovisiona atómicamente el registro en `tenants`, las plantillas en `configuraciones` y el usuario administrador del consultorio.
  * `Infraestructura (/superadmin/config)`: Monitor de latencia, estado de conectividad con Supabase PostgreSQL y enlaces directos a consolas cloud.

### B. Espacio de Cliente / Tenant (`/[slug]/admin`)
* **Propósito:** Software operativo de gestión médica para el profesional de salud.
* **Cliente Piloto (Tenant #1):** **Dr. Carlos Torres** (`slug: dr-carlos-torres`), pediatra y especialista en vacunación.
* **Escalabilidad:** Diseñado para admitir ilimitados clientes concurrentes ($N$ clientes), donde cada uno disfruta de estanqueidad total en sus datos bajo la misma base de datos gracias a RLS.

### C. Espacio Público / Pacientes (`/[slug]/(public)`)
* **Propósito:** Cara pública del médico hacia sus pacientes con diseño optimizado para conversión, branding profesional y acceso seguro a carné de vacunación.

---

## ⚡ 2. Eficiencia en Lecturas, Escrituras y Manejo de Bases de Datos

Para soportar el crecimiento de $N$ clientes concurrentes sin degradación de latencia ni explosión de costos, la plataforma implementa una estrategia de alto rendimiento en PostgreSQL:

```
                                  [ SERVERLESS APIS / EDGE ]
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │  PgBouncer Connection Pooler     │
                              │  (Modo Transacción / Port 6543)  │
                              └────────────────┬─────────────────┘
                                               │
                         ┌─────────────────────┴─────────────────────┐
                         ▼                                           ▼
             [ ESTRATEGIA DE LECTURA ]                   [ ESTRATEGIA DE ESCRITURA ]
             ├───────────────────────┤                   ├─────────────────────────┤
             │ • Índices B-Tree Comp.│                   │ • Transacciones ACID    │
             │   (tenant_id + doc)   │                   │ • Patrón Append-Only    │
             │ • Índices GIN en JSONB│                   │ • Triggers O(1) PL/pgSQL│
             │ • Data Minimization   │                   │ • Inalterabilidad HCE   │
             │ • Caché en Borde (CIE)│                   │ • Deducción Atómica FEFO│
             └───────────────────────┘                   └─────────────────────────┘
```

### A. Optimización de Lecturas (High-Efficiency Reads)
1. **Indexación Compuesta Multi-Tenant:**
   * Toda consulta filtra por `tenant_id`. Para erradicar escaneos secuenciales (*Sequential Scans*), se definen índices compuestos especializados:
     * `CREATE INDEX idx_pacientes_tenant_doc ON pacientes(tenant_id, documento);`
     * `CREATE INDEX idx_historias_tenant_fecha ON historias_clinicas(tenant_id, created_at DESC);`
     * `CREATE INDEX idx_inventario_tenant_stock ON inventario_medico(tenant_id, stock_actual);`
2. **Índices GIN sobre Columnas JSONB (Consultas Rápidas RIPS y Métricas):**
   * Las columnas `impresion_diagnostica`, `procedimientos` y `signos_vitales` utilizan índices **GIN (*Generalized Inverted Index*)**, permitiendo búsquedas de diagnósticos CIE-10 en milisegundos a través del operador `@>`:
     * `CREATE INDEX idx_historias_diagnosticos_gin ON historias_clinicas USING GIN (impresion_diagnostica);`
3. **Data Minimization (Control de Egress y Ancho de Banda):**
   * Queda terminantemente prohibido ejecutar `.select('*')` en vistas de alto tráfico. Las consultas deben proyectar únicamente las columnas estrictamente necesarias (ej. `.select('id, nombres, apellidos, documento')`), reduciendo drásticamente el peso de las transferencias y el uso de memoria en Node.js.
4. **Caché Perimetral para Catálogos Universales:**
   * Tablas estáticas compartidas por todos los médicos (`catalogo_cie10`, `catalogo_cups`, `oms_tablas`, `oms_zscores`) se sirven con cabeceras `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` en Vercel Edge, reduciendo consultas repetitivas a la base de datos a costo $0.

### B. Optimización de Escrituras (High-Integrity Writes)
1. **Atomicidad Transaccional (ACID):**
   * El acto de cerrar una consulta médica y aplicar una vacuna requiere transaccionalidad atómica:
     1. Actualizar `historias_clinicas` a `estado = 'cerrado'` con su `snapshot_demografico`.
     2. Deducir el stock en `lotes_inventario` y registrar el movimiento en `movimientos_inventario`.
     * Ambas operaciones deben ejecutarse en un solo bloque transaccional para evitar inconsistencias de inventario o folios incompletos.
2. **Patrón Append-Only (Cero Bloqueos de Fila en Históricos):**
   * Las enmiendas clínicas no ejecutan `UPDATE` sobre folios cerrados, sino inserciones de notas aclaratorias subordinadas (`parent_id`).
   * Los registros de auditoría (`logs_auditoria`) son exclusivamente `INSERT`. Al no existir sentencias `UPDATE` sobre datos históricos, se elimina la contención de bloqueos (*Row-Level Locks*) en la base de datos, maximizando la concurrencia de escritura.
3. **Triggers Ultraligeros en PL/pgSQL:**
   * El trigger `check_inalterabilidad()` ejecuta validaciones puramente en memoria en tiempo $O(1)$ (`IF OLD.estado = 'cerrado' THEN RAISE EXCEPTION...`), abortando operaciones prohibidas antes de tocar el subsistema de almacenamiento.

### C. Manejo Concurrente y Pool de Conexiones (PgBouncer)
* **Arquitectura Serverless:** Las funciones de Next.js en Vercel son efímeras y pueden escalar a cientos de instancias simultáneas.
* **Pooler Transaccional:** Todas las conexiones de la aplicación se dirigen al puerto **6543** de Supabase (PgBouncer en modo transacción). Esto permite reutilizar conexiones activas de PostgreSQL y evita el error fatal `FATAL: remaining connection slots are reserved for non-replication superuser connections`.

---

## 🗄️ 3. Esquema Relacional de Base de Datos

```
                               ┌─────────────────┐
                               │     tenants     │
                               └────────┬────────┘
                                        │ 1:N
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
┌───────────────┐               ┌───────────────┐               ┌───────────────┐
│ configuracion │               │   pacientes   │               │ inventario_med│
└───────────────┘               └───────┬───────┘               └───────┬───────┘
                                        │ 1:N                           │ 1:N
                                        ▼                               ▼
                                ┌───────────────┐               ┌───────────────┐
                                │ historias_clin│◄──┐parent_id  │ lotes_inventar│
                                └───────┬───────┘   │(aclarat.) └───────┬───────┘
                                        │           │                   │ 1:N
                                        └───────────┘                   ▼
                                                                ┌───────────────┐
                                                                │ movimientos_in│
                                                                └───────────────┘
```

1. **`tenants`:** `id (UUID)`, `nombre`, `slug`, `custom_domain`, `activo`, `plan_saas`, `estado_pago`.
2. **`pacientes`:** `id`, `tenant_id`, `documento`, `tipo_documento`, `nombres`, `apellidos`, `fecha_nacimiento`, `eps`, `token_acceso (UUID v4 único para acceso seguro a Carné Digital y Curvas de Crecimiento OMS sin credenciales)`.
3. **`historias_clinicas`:** `id`, `tenant_id`, `paciente_id`, `medico_id`, `estado ('borrador'|'cerrado'|'aclaratoria')`, `enfermedad_actual (AES-256)`, `motivo_consulta (AES-256)`, `anamnesis (AES-256)`, `plan_manejo (AES-256)`, `impresion_diagnostica (JSONB RIPS)`, `procedimientos (JSONB CUPS)`, `snapshot_demografico (JSONB)`, `parent_id (UUID reflexivo para notas aclaratorias)`, `motivo_aclaratoria`, `closed_at`.
4. **`citas_medicas`:** `id`, `tenant_id`, `paciente_id`, `medico_id`, `estado ('programada'|'confirmada'|'cancelada'|'completada')`, `fecha_hora`, `duracion_minutos`, `motivo`, `notas`.
5. **`miembros_equipo`:** `id`, `tenant_id`, `user_id`, `rol ('admin'|'medico'|'recepcion')`.
6. **`inventario_medico` & `lotes_inventario`:** Control de existencias, vacunas, insumos, lotes, vencimiento, dosis aplicadas y valores comerciales.
7. **`paciente_mediciones_antropometricas`:** Historial cronológico de peso, talla y perímetro cefálico para trazado continuo de curvas de somatometría infantil.
8. **`oms_tablas` & `oms_zscores`:** Tablas canónicas de referencia antropométrica de la OMS (Resolución 2465 de 2016 de MinSalud).
9. **`logs_auditoria`:** Registro pericial inmutable de cada consulta o acceso clínico.

---

## 📊 4. Matriz de Propiedad de Infraestructura y Cuentas

| Activo / Rol | Identidad / Titular | Propósito y Alcance |
| :--- | :--- | :--- |
| **Repositorio GitHub** | `GEME80/Portal_Medico` | Código fuente del motor HubMed y portales de clientes. |
| **SuperAdmin Global HubMed** | `gerkof@gmail.com` | Propietario de la plataforma SaaS, administración de tenants e infraestructura. |
| **Tenant Piloto #1** | **Dr. Carlos Torres** | Primer médico especialista activo en la plataforma (`dr-carlos-torres`). |
| **Hosting Serverless** | Vercel — [https://portal-medico-five.vercel.app](https://portal-medico-five.vercel.app) | Compute Edge, CDN Global y enrutamiento dinámico Multi-Tenant por Hostname. |
| **Base de Datos BaaS** | Supabase — [`nstiomejmhmcasxqxnbf.supabase.co`](https://nstiomejmhmcasxqxnbf.supabase.co) | PostgreSQL 15 Managed · Región: **West US (Oregon) `us-west-2`** · Compute: `t4g.nano` · Auth + RLS + PgBouncer Puerto 6543. |

---

## 📜 5. Historial de Versiones e Hitos Técnicos

| Versión / Fecha | Módulo | Descripción del Avance |
| :--- | :--- | :--- |
| **v1.0** | Core Multi-Tenant | Despliegue de la arquitectura de tenants con enrutamiento dinámico `[slug]` y consola `/superadmin`. |
| **v1.3** | Módulo Vacunas | POS clínico de inventario de biológicos y medicamentos con control de lotes y fechas de vencimiento. |
| **v1.8** | Somatometría OMS | Curvas de crecimiento pediátricas interactivas con z-scores de la OMS para el Dr. Carlos Torres. |
| **v2.0** | EMR & MinSalud | Creación de esquemas de historias clínicas con metadatos RIPS 2026, catálogos CIE-10/CUPS y trigger de inalterabilidad. |
| **v2.2** | Criptografía | Implementación del motor `lib/crypto.ts` (AES-256-GCM con authTag de detección de manipulación en base de datos). |
| **v3.0** | **Estandarización Canónica** | Proyecto `Portal_Medico`, marca `HubMed`, cliente piloto `Dr. Carlos Torres`. Documentación oficial y estandarización. |
| **v3.1** | Arquitectura de Espacios & Eficiencia DB | Formalización de los 3 espacios (SuperAdmin, Clientes y Público), indexación B-Tree/GIN en PostgreSQL, PgBouncer pooler transaccional y optimización de lecturas/escrituras. |
| **v3.2** | **Estandarización de Infraestructura & Cierre de Auditoría** | Documentación oficial canónica completada: `ADR/` (001 a 004), `SECURITY.md`, `CHANGELOG.md`, `AUDITORIA_PLATAFORMA.md`, eliminación de `PROJECT_BITACORA.md`. Saneamiento de los 26 scripts ad-hoc hacia `scripts/legacy_patches/`, estandarización de Server Actions (`ActionResponse` con `{ code }`), mapa de migraciones en `supabase/migrations/` y cabeceras HTTP de seguridad clínica en `next.config.ts` (CSP/HSTS/X-Frame-Options). 0 errores TypeScript y build validado. |
| **v3.3** | **Fases 1, 2 y 3: Gobernanza Clínica, RIPS 2026 y Módulos de Negocio** | **Fase 1:** Trigger duro de inalterabilidad de historias clínicas cerradas y notas aclaratorias (`check_inalterabilidad()`), índices compuestos B-Tree y GIN para RLS, esquemas de validación Type-Safe con Zod (`lib/validations/clinical.ts`) acoplados a Server Actions. **Fase 2:** Motor de generación RIPS JSON bajo Resolución 000948/2026 de MinSalud (`lib/rips/generator.ts`), corrección de estanqueidad de marca 'HubMed' en noticias. **Fase 3:** Módulo de Citas y Agenda (`/[slug]/admin/citas`), Carné Vacunal Digital público sin costo de MAU mediante Magic Token (`/[slug]/carne/[token]`), Panel de exportación RIPS (`/[slug]/admin/reportes`), Gestión de Equipo y permisos recepcionista (`/[slug]/admin/equipo`) y Facturación SaaS SuperAdmin (`/superadmin/facturacion`). Verificación completa de tipado (`tsc --noEmit`) con 0 errores y build de producción Next.js exitoso. |
| **v3.5.0** | **Sincronización Universal de Calendarios & Rediseño Sobrio** | Generador e inyector de archivos `.ics` con dos alarmas nativas integradas (-P1D, -PT2H) para Apple/Outlook y enlace directo para Google Calendar a costo \$0. Modal administrativo con editor de plantilla para el médico con tags dinámicos. Erradicación de iconografía infantil/emojis y adopción estricta de Lucide React. |
| **v3.6.0** | **Resiliencia de Clientes Supabase, Mitigación de Claves Revocadas & Fix 404 Admin** | Desacoplamiento de rutas públicas (`/[slug]`, `layout.tsx`, `citas`) para usar el cliente anónimo RLS (`createClient()`), eliminando dependencias de `service_role` en la web pública. Filtro guardrail en `createAdminClient()` que neutraliza claves comprometidas (`sb_secret_SsKNg...`). Resolución del error 404 en el panel de administración (`/[slug]/admin`): carga de tenant mediante sesión autenticada con fallback, corrección de esquema (eliminada consulta a columna inexistente `nombre_menu_vacunas`) y normalización canónica de slugs. |
| **v3.8.0** | **Arquitectura de Navegación Persistente (Sticky/Fixed en Scroll) & Erradicación Total de Emojis** | Solución definitiva al corte de navegación en scroll: Corrección de la trampa W3C de `overflow-x: hidden` hacia `overflow-x: clip` en `.admin-shell` y `.admin-main`, habilitando `position: sticky` en toda la jerarquía DOM. Sidebar lateral desktop fijado (`position: fixed; width: 240px; height: 100vh; overflow: hidden`) con Brand y Perfil anclados (`flex-shrink: 0`) y scroll interior contenido (`overscroll-behavior: contain`). Barra de navegación superior (`.admin-topbar`) estandarizada con `position: sticky; top: 0; z-index: 40;` y glassmorphism (`backdrop-filter: blur(12px)`) en todas las vistas del portal (`/admin`, `/citas`, `/pacientes`, `/inventario`, `/reportes`, `/noticias`, `/personalizar`, `/equipo`). Sub-navegación flotante `.sticky-subnav` en `personalizar` para mantener accesibles las pestañas a lo largo de formularios de 2000+ líneas. Erradicación completa de emojis residuales en encabezados y botones. 0 errores TypeScript. |
| **v3.9.0** | **Habilitación RIPS MinSalud Oficial (Res. 2275/2023), Espacio de Consultorio REPS, Tooltips UX, Manual Interactivo & Diseño de Automatización Asíncrona (ADR-005)** | **Estándar Oficial:** Elevación del generador RIPS (`lib/rips/generator.ts`) al esquema jerárquico oficial MinSalud (agrupación `usuarios`, consultas con `codPrestador` de 12 dígitos, CUPS, CIE-10, modalidad, `vrServicio` y normalización DANE). **Configuración del Consultorio:** Pestaña dedicada en `/personalizar?tab=rips_habilitacion` para Código REPS 12 dígitos (con validador en vivo y enlace a consulta REPS oficial), NIT/Cédula, Servicio REPS, Municipio DANE, Modalidad, Prefijo FEV y Honorarios habituales, con persistencia Zero-DDL en `hero_badge_texto.rips_config`. **UX/UI Médico:** Tooltips contextuales interactivos (`RipsInfoTooltip`) que traducen la jerga legal a términos sencillos. **Manual de Apoyo & Guía RIPS 2026:** Slide-over drawer interactivo en `/reportes` con 4 pestañas (¿Qué es RIPS?, Flujo a SISPRO/MUV y DIAN FEV, Glosario y FAQ de rechazos). Tarjeta de estado de habilitación y pre-validador en vivo con 0 errores de compilación y build exitoso. **Arquitectura Futura:** Aprobación y documentación de [ADR-005](file:///Users/germanmorales/.gemini/antigravity/scratch/portal_medico/ADR/ADR-005-automatizacion-rips-muv-facturacion-electronica.md) y Fase 4 en `BACKLOG_MEJORAS.md` para el pipeline asíncrono de auto-generación de RIPS, CUV MUV y facturación electrónica DIAN con software contable. |
| **v3.10.0** | **Control de Acceso Granular & Segregación Médica para Personal Administrativo (Res. 1995/1999)** | **Gobernanza y Permisos Administrativos:** Módulo completo en `/[slug]/admin/equipo` para aprovisionar colaboradores administrativos (recepción/secretaría) con asignación de credenciales y permisos granulares (`citas`, `pacientes_demograficos`, `inventario`, `noticias`). **Segregación y Blindaje de Actos Médicos:** Ocultamiento total en UI y bloqueo backend de opciones médicas (historias clínicas, evoluciones, diagnósticos CIE-10, fórmulas médicas, curvas OMS y RIPS). En `pacientes/[id]`, tarjeta de confidencialidad médica con base legal; en `pacientes`, modo admisión solo para captura demográfica. **Seguridad en Profundidad:** Hard RLS en `historias_clinicas`, guardia de ruta en `middleware.ts`, Server Actions de bloqueo criptográfico en `clinical-actions.ts`, y migración `20260916120000_permisos_administrativos.sql`. 0 errores TypeScript y build validado. |
| **v3.10.2** | **Rendimiento Instantáneo & Navegación Zero-Lag** | Esqueleto de carga clínico con microanimación de pulso (`loading.tsx`), prefetching activado en enlaces de navegación, cambio optimista visual (0ms) con `pendingHref` y barra de progreso superior. Caché perimetral en memoria para resolución de tenants en `middleware.ts` reduciendo la latencia de clic a 0ms. |
| **v3.11.0** | **Tarjetas y Carné de Vacunación Digital (Inmunización & Trazabilidad)** | **Base de Datos & Trazabilidad:** Migración `20260916170000_aplicaciones_vacunas.sql` con tabla `aplicaciones_vacunas`, claves foráneas, índices de alta velocidad y políticas RLS multi-tenant y públicas vía Magic Token (`token_acceso`). **Server Actions & Inventario:** `lib/actions/vacunas-actions.ts` con registro de vacunas aplicadas, descuento opcional atómico de stock de biológicos y lotes con movimiento automático en Kardex, y catálogo de esquemas sugeridos en `lib/vacunas/constants.ts`. **Gestión Clínica (Admin):** Modal interactivo `CarneVacunacionModal.tsx` en el perfil del paciente con visualización en tarjetas, registro rápido y botón de 1-clic para compartir el carné oficial por WhatsApp a los padres. **Carné Digital Público (`/[slug]/carne/[token]`):** Visor responsivo institucional con sello de verificación en línea, desglose de dosis aplicadas, sello médico digital con ReTHUS y botón de exportación/impresión a PDF (`CarnePrintButton.tsx`). Build exitoso con 0 errores TypeScript. |
| **v3.12.0** | **Optimización de Inventario & Kardex Server-Side** | Corrección de popup cortado en modales de inventario mediante contención de scroll, plantillas inteligentes para nuevo ítem que reducen pasos repetitivos, bordes redondeados ergonómicos y paginación server-side del historial de movimientos Kardex para soportar crecimiento exponencial sin degradar la memoria ni el rendimiento de la base de datos. |
| **v3.13.0** | **Rediseño Minimalista Corporativo del Dashboard** | Estandarización estética según lineamientos de HubMed: eliminación integral de emojis en títulos y botones, adopción estricta de iconos médicos sobrios de Lucide React, y tira superior de métricas clínicas compactada (pacientes activos, citas del día, valor de inventario). |
| **v3.14.0** | **Reingeniería de Pacientes, Consulta Médica & Smart IMC** | Reemplazo del drawer lateral derecho por modales ergonómicos centrados (~680px y ~940px) para registro de paciente y consulta médica. Signos vitales 100% opcionales, widget reactivo de Smart IMC con cálculo instantáneo, etiqueta nutricional OMS y rango de peso saludable sugerido para la estatura. Chips de motivos frecuentes y diagnósticos CIE-10 a 1-clic, copia rápida de antecedentes anteriores y estructuración estándar en el plan de manejo. |
| **v3.15.0 (Actual)** | **Curvas de Crecimiento OMS Vectoriales (Res. 2465/2016), Visor Digital Público y Cero Scroll** | Reingeniería de somatometría infantil: gráficos 100% vectoriales en SVG fieles al folleto físico de MinSalud/OMS (marcos celeste/rosa, cuadrícula milimétrica, ejes duales, mediana verde 0 DE, curvas ±1, ±2, ±3 DE y corredor normal sombreado). Filtrado automático según edad y género (solo 2 a 4 curvas pertinentes activas). Visualización sin scroll: data labels directos sobre cada punto trazado, tooltip in-situ y barra de control activo superior. Portal público para padres (`/[slug]/crecimiento/[token]`) por Magic Token con código QR, firma médica auténtica, WhatsApp y PDF. Corrección del error 404 y siembra en Supabase de 6 pacientes arquetípicos con historiales continuos para comprobar el 100% de las 20 curvas oficiales. |
