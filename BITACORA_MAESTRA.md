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
> **Estándar Normativo Sanitario:** ⚕️ **Ministerio de Salud de Colombia (Resolución 000948 de 2026, RIPS, CIE-10/11, CUPS, ReTHUS)**  
> **Fecha de Actualización:** 15 de Septiembre 2026 (v3.5.0)  

---

## 🧭 Índice de Documentación Oficial de HubMed Platform

1. 📘 [BITACORA_MAESTRA.md](file:///Users/germanmorales/.gemini/antigravity/scratch/portal_medico/BITACORA_MAESTRA.md) — Bitácora Maestra, Arquitectura Global, Espacios del Sistema y Eficiencia de DB.
2. 🛡️ [RULES_AND_SECURITY.md](file:///Users/germanmorales/.gemini/antigravity/scratch/portal_medico/RULES_AND_SECURITY.md) — Código Rector de Reglas, Ciberseguridad, Aislamiento Multi-Tenant y QA.
3. 🤖 [SPECIALIZED_AGENTS.md](file:///Users/germanmorales/.gemini/antigravity/scratch/portal_medico/SPECIALIZED_AGENTS.md) — Ecosistema de Agentes Especializados, Jerarquía y Skills Técnicos/Clínicos.
4. ⚕️ [PROTOCOLO_MINSALUD_HISTORIAS_MEDICAS.md](file:///Users/germanmorales/.gemini/antigravity/scratch/portal_medico/PROTOCOLO_MINSALUD_HISTORIAS_MEDICAS.md) — Protocolo MinSalud de Inalterabilidad, Custodia, Cifrado y Archivo de Historias Clínicas (HCE / RIPS 2026).
5. 🛡️ [SECURITY.md](file:///Users/germanmorales/.gemini/antigravity/scratch/portal_medico/SECURITY.md) — Política oficial de ciberseguridad, reporte coordinado de vulnerabilidades y cumplimiento sanitario.
6. 📋 [CHANGELOG.md](file:///Users/germanmorales/.gemini/antigravity/scratch/portal_medico/CHANGELOG.md) — Registro histórico formal de versiones (Keep a Changelog / SemVer).
7. 🔍 [AUDITORIA_PLATAFORMA.md](file:///Users/germanmorales/.gemini/antigravity/scratch/portal_medico/AUDITORIA_PLATAFORMA.md) — Inventario técnico integral de rutas, tablas, server actions y scorecard.
8. 🏛️ [ADR/](file:///Users/germanmorales/.gemini/antigravity/scratch/portal_medico/ADR) — Registros de Decisiones de Arquitectura (Supabase, AES-256-GCM, Routing Híbrido, App Router).

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
2. **`pacientes`:** `id`, `tenant_id`, `documento`, `tipo_documento`, `nombres`, `apellidos`, `fecha_nacimiento`, `eps`, `token_acceso (UUID v4 único para acceso seguro a Carné Digital sin credenciales)`.
3. **`historias_clinicas`:** `id`, `tenant_id`, `paciente_id`, `medico_id`, `estado ('borrador'|'cerrado'|'aclaratoria')`, `enfermedad_actual (AES-256)`, `motivo_consulta (AES-256)`, `anamnesis (AES-256)`, `plan_manejo (AES-256)`, `impresion_diagnostica (JSONB RIPS)`, `procedimientos (JSONB CUPS)`, `snapshot_demografico (JSONB)`, `parent_id (UUID reflexivo para notas aclaratorias)`, `motivo_aclaratoria`, `closed_at`.
4. **`citas_medicas`:** `id`, `tenant_id`, `paciente_id`, `medico_id`, `estado ('programada'|'confirmada'|'cancelada'|'completada')`, `fecha_hora`, `duracion_minutos`, `motivo`, `notas`.
5. **`miembros_equipo`:** `id`, `tenant_id`, `user_id`, `rol ('admin'|'medico'|'recepcion')`.
6. **`inventario_medico` & `lotes_inventario`:** Control de existencias, vacunas, insumos, lotes, vencimiento, dosis aplicadas y valores comerciales.
7. **`oms_tablas` & `oms_zscores`:** Tablas mundiales de referencia antropométrica de la OMS.
8. **`logs_auditoria`:** Registro pericial inmutable de cada consulta o acceso clínico.

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
| **v3.3 (Actual)** | **Fases 1, 2 y 3: Gobernanza Clínica, RIPS 2026 y Módulos de Negocio** | **Fase 1:** Trigger duro de inalterabilidad de historias clínicas cerradas y notas aclaratorias (`check_inalterabilidad()`), índices compuestos B-Tree y GIN para RLS, esquemas de validación Type-Safe con Zod (`lib/validations/clinical.ts`) acoplados a Server Actions. **Fase 2:** Motor de generación RIPS JSON bajo Resolución 000948/2026 de MinSalud (`lib/rips/generator.ts`), corrección de estanqueidad de marca 'HubMed' en noticias. **Fase 3:** Módulo de Citas y Agenda (`/[slug]/admin/citas`), Carné Vacunal Digital público sin costo de MAU mediante Magic Token (`/[slug]/carne/[token]`), Panel de exportación RIPS (`/[slug]/admin/reportes`), Gestión de Equipo y permisos recepcionista (`/[slug]/admin/equipo`) y Facturación SaaS SuperAdmin (`/superadmin/facturacion`). Verificación completa de tipado (`tsc --noEmit`) con 0 errores y build de producción Next.js exitoso. |
