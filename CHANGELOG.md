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

# 📋 REGISTRO DE CAMBIOS Y VERSIONES (CHANGELOG.md)

Todos los cambios notables en este proyecto se documentan en este archivo.
El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [3.5.0] - 2026-09-15
### Añadido
- **Sincronización Universal de Calendarios a Costo $0**:
  - **Google Calendar**: Enlace directo enriquecido con plantilla personalizable de la cita.
  - **Apple / Outlook Calendar (`.ics`)**: Generación y descarga directa en el navegador de archivo estándar iCalendar con dos alarmas nativas incorporadas (`TRIGGER:-P1D` para 1 día antes y `TRIGGER:-PT2H` para 2 horas antes), garantizando recordatorios automáticos sin costo de SMS ni API de mensajería.
- **Editor de Plantilla Completa de Calendario para el Doctor (`app/[slug]/admin/citas/AdminCitasManager.tsx`)**:
  - Nuevo control en el modal de configuración de agenda que permite al médico redactar o personalizar el texto completo del recordatorio de cita.
  - Soporte de etiquetas dinámicas autocompletables: `{DOCTOR_NOMBRE}`, `{ESPECIALIDAD}`, `{CLINICA_NOMBRE}`, `{PACIENTE_NOMBRE}`, `{DOCUMENTO}`, `{SERVICIO}`, `{TELEFONO}`, `{INDICACIONES}`.
  - Botón de "Restablecer formato estándar" para volver a la redacción institucional recomendada en 1 clic.
- **Rediseño Sobrio y Profesional de la Iconografía Médica**:
  - Eliminación total de emojis informales/infantiles en los recordatorios de calendario y componentes visuales del portal.
  - Estandarización 100% sobre iconos SVG de trazo fino de la librería Lucide (`Calendar`, `Clock`, `UserCheck`, `Activity`, etc.).
- **Optimización de Rendimiento y Memoria en Servidor**:
  - Migración a `createAdminClient()` en consultas públicas clave de SSR (`app/[slug]/(public)/page.tsx`) para garantizar resiliencia frente a bloqueos de RLS o desincronización de credenciales.
  - Depuración de caché de compilación (`.next`) para evitar errores de saturación de memoria (*heap out of memory*).

## [3.4.0] - 2026-09-15
### Añadido
- **Motor de Disponibilidad en Tiempo Real (`lib/citas/slot-engine.ts`)**:
  - Algoritmo de cálculo de slots dinámicos con cruce de jornada laboral, citas agendadas y bloqueos.
  - Validación matemática contra fechas y horas pasadas (`getNowColombia()`, zona horaria America/Bogota UTC-5).
  - Soporte de duración configurable por cita (15, 20, 30, 45, 60 minutos) y tiempos de descanso / buffer.
- **Privacidad Estricta de Bloqueos Médicos**:
  - Enmascaramiento a nivel de API: los motivos y notas internas del doctor (ej. Cirugía, Almuerzo, Congreso) se sanitizan automáticamente para los pacientes (`isPublic = true`), mostrando únicamente `"No disponible"`.
  - El médico mantiene visibilidad integral en su consola administrativa de agenda.
- **Portal de Pacientes con Auto-Agendamiento Directo (`app/[slug]/(public)/citas/BookingForm.tsx`)**:
  - Carrusel horizontal interactivo de 14 días y chips de horarios divididos en Mañana y Tarde.
  - Auto-confirmación instantánea sin requerir aprobación manual (estándar Zocdoc).
  - Generación de enlace directo para Google Calendar con 1-click.
- **Consola de Agenda Médica Multi-Vista (`app/[slug]/admin/citas/AdminCitasManager.tsx`)**:
  - **Vista Día**: Cuadrícula horaria de alta densidad con fichas de pacientes, WhatsApp directo y bloqueos privados.
  - **Vista Semana**: Matriz de 7 días con resumen visual de citas y bloqueos.
  - **Vista Mes**: Calendario mensual con contadores numéricos y navegación fluida.
  - **Modal de Ajustes de Agenda**: Configuración de duración por cita (15 a 60 min) y días/horarios laborables.
  - **Modal de Bloqueo Rápido**: Bloqueo confidencial de espacios en agenda.
- **Migración SQL (`supabase/migrations/20260915103000_configuracion_agenda.sql`)**:
  - Tabla `configuracion_agenda` y política de inserción directa para auto-confirmación de citas.

## [3.3.0] - 2026-09-14
### Añadido
- **Fase 1 (Seguridad y Rendimiento de Datos)**:
  - Migración `20260914095300_trigger_inalterabilidad.sql`: Trigger PL/pgSQL duro que bloquea de forma inmutable `UPDATE` y `DELETE` en historias clínicas con estado `'cerrado'` y `'aclaratoria'`.
  - Migración `20260914095400_performance_indexes.sql`: Índices compuestos B-Tree (`tenant_id, documento`, `tenant_id, paciente_id, created_at DESC`) e índice GIN sobre `impresion_diagnostica` JSONB.
  - Validación de esquemas con Zod (`lib/validations/clinical.ts`): Esquemas para Historias Clínicas, Pacientes y RIPS con `.superRefine()` para impedir el cierre de folios sin diagnósticos CIE-10.
  - Integración Type-Safe en `lib/actions/clinical-actions.ts` con sanitización `safeParse()`.
- **Fase 2 (Cumplimiento Normativo y Gobernanza)**:
  - Motor generador RIPS JSON (`lib/rips/generator.ts`): Mapeo conforme a la Resolución 000948 de 2026 de MinSalud, procesando diagnósticos CIE-10, CUPS y snapshot demográfico.
  - Migración `20260914100000_rename_ecovaccine.sql`: Saneamiento de categoría de noticias actualizando constraint CHECK `'EcoVaccine'` a `'HubMed'`.
- **Fase 3 (Módulos de Negocio y Experiencia de Usuario)**:
  - Migración `20260914104000_citas_y_carne.sql`:
    - Creación de tabla `citas_medicas` con RLS, estados (`programada`, `confirmada`, `cancelada`, `completada`) e índice temporal.
    - Creación de tabla `miembros_equipo` con roles granulares (`admin`, `medico`, `recepcion`).
    - Columna `token_acceso` (UUID v4) en tabla `pacientes` para compartir el Carné Digital sin requerir cuentas Auth de Supabase (costo $0 en MAU).
  - Módulo de Agenda y Citas: Server Actions en `lib/actions/citas-actions.ts` y vista administrativa en `/[slug]/admin/citas`.
  - Portal Público de Carné Vacunal Digital en `/[slug]/carne/[token]` con validación por Magic Token y botón nativo para guardado en PDF en el navegador del paciente.
  - Módulo de Reportes RIPS en `/[slug]/admin/reportes` para exportación masiva de folios clínicos cerrados.
  - Módulo de Gestión de Equipo en `/[slug]/admin/equipo` para asignación y control de roles de recepcionistas y médicos.
  - Módulo de Facturación y Finanzas SuperAdmin en `/superadmin/facturacion` con KPIs de MRR y control de suscripción.

### Modificado
- `middleware.ts`: Optimización del enrutamiento multi-tenant puro y rápido.
- Verificación exhaustiva: TypeScript (`tsc --noEmit`) con 0 errores y producción Next.js compilada limpiamente.

---

## [3.2.0] - 2026-09-10
### Añadido
- Directorio formal de Registros de Decisiones de Arquitectura (`ADR/`):
  - `ADR-001`: Supabase (PostgreSQL 15) vs Firebase (Firestore) como BaaS Multi-Tenant.
  - `ADR-002`: Cifrado AES-256-GCM en Capa de Aplicación vs pgcrypto en Base de Datos.
  - `ADR-003`: Arquitectura Multi-Tenant Híbrida (Path-Based Routing + Hostname Resolution).
  - `ADR-004`: Next.js 16 App Router vs Pages Router para Plataforma Médica Multi-Tenant.
- `SECURITY.md`: Política formal de seguridad, reporte responsable de vulnerabilidades y cumplimiento Habeas Data / MinSalud.
- `CHANGELOG.md`: Registro histórico consolidado de versiones desde v1.0.0.
- `AUDITORIA_PLATAFORMA.md`: Inventario exhaustivo de componentes, rutas, Server Actions y scorecard de ciberseguridad.
- Security Headers HTTP en `next.config.ts` (Content-Security-Policy estricto, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy).
- Estandarización de códigos de error estructurados `{ success, error, code }` en `lib/actions/clinical-actions.ts`.
- Guía de ordenamiento y estandarización de migraciones en `supabase/migrations/README.md`.

### Modificado
- `BACKLOG_MEJORAS.md`: Actualización del estado de las tareas de auditoría a completadas.
- Saneamiento y traslado de los 26 scripts `.js` de parcheo ad-hoc de la raíz a `scripts/legacy_patches/`.

### Eliminado
- Eliminación de `PROJECT_BITACORA.md` tras su consolidación total en `BITACORA_MAESTRA.md`.
- Supresión de scripts de prueba obsoletos con credenciales hardcodeadas (`verify_dashboard.js`, `test-insert.js`).

---

## [3.1.0] - 2026-08-20
### Añadido
- Formalización de los 3 Espacios del Sistema: Espacio 1 (SuperAdmin `/superadmin`), Espacio 2 (Consola Médica `/[slug]/admin`) y Espacio 3 (Portal Público `/[slug]`).
- Estrategia de indexación compuesta B-Tree para tablas multi-tenant (`tenant_id, documento`).
- Índices GIN sobre columnas JSONB (`impresion_diagnostica`, `procedimientos`) para consultas CIE-10 a velocidad $O(1)$.
- Canalización de tráfico de base de datos a través de PgBouncer en puerto 6543 (Transaction Mode).

---

## [3.0.0] - 2026-08-01
### Añadido
- Estandarización Canónica de Marca: Nombre técnico `Portal_Medico`, marca comercial `HubMed` (`hubmed.app`).
- Definición formal del primer cliente piloto activo: **Dr. Carlos Torres** (`dr-carlos-torres`, Pediatría y Vacunación).
- Creación de la suite de 6 agentes especializados en `SPECIALIZED_AGENTS.md` y directivas en `AGENTS.md`.
- `RULES_AND_SECURITY.md`: Código rector inviolable de ciberseguridad y calidad.

---

## [2.2.0] - 2026-07-02
### Añadido
- Motor criptográfico de grado médico `lib/crypto.ts` con algoritmo AES-256-GCM.
- Generación de vectores de inicialización (IV) únicos de 16 bytes y etiquetas de autenticación (`authTag`) de 16 bytes.
- Detección inmediata de manipulación de registros en base de datos mediante validación del tag GCM en el descifrado.

---

## [2.0.0] - 2026-06-30
### Añadido
- Módulo de Expediente Médico Electrónico (EMR) alineado con la Resolución 000948 de 2026 (MinSalud Colombia).
- Soporte para catálogos oficiales `catalogo_cie10` y `catalogo_cups`.
- Esquema de notas aclaratorias inmutables mediante relación reflexiva `parent_id`.
- Captura atómica de `snapshot_demografico` al cerrar la historia clínica.

---

## [1.8.0] - 2026-06-25
### Añadido
- Integración de curvas somatométricas y de crecimiento antropométrico infantil basadas en datos oficiales de la Organización Mundial de la Salud (OMS).
- Visualización interactiva con Recharts de peso para la edad, talla para la edad y percentiles / z-scores.

---

## [1.3.0] - 2026-06-23
### Añadido
- Módulo POS de inventario médico y vacunas.
- Trazabilidad de lotes, fechas de caducidad y alertas visuales automáticas de vencimiento próximo (regla FEFO).
- Deducción de existencias y registro histórico de movimientos de inventario (`movimientos_inventario`).

---

## [1.0.0] - 2026-06-20
### Añadido
- Inicialización de la arquitectura SaaS Multi-Tenant en Next.js App Router y Supabase (PostgreSQL 15).
- Enrutamiento dinámico basado en slug `[slug]` y soporte para dominios personalizados mediante Edge Middleware.
- Consola centralizada de aprovisionamiento de tenants para SuperAdmin (`/superadmin`).
