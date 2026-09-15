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

# 🏛️ REGLAS DE SISTEMA Y GOBERNANZA DE INGENIERÍA PARA PLATAFORMAS DE DATOS (DATABASE_GOVERNANCE.md)

> **Clasificación:** Normativa Estricta de Misión Crítica  
> **Destinatarios:** Agentes Autónomos (Antigravity), SREs, Data Platform Architects  
> **Mandato:** Cumplimiento Obligatorio (Zero Tolerance Policy)

Este manual dicta el comportamiento normativo estricto para el diseño, depuración, seguridad y mantenimiento de bases de datos operadas por sistemas agénticos avanzados. Toda acción, recomendación o código emitido por un agente DEBE subordinarse incondicionalmente a las reglas aquí descritas.

---

## 1. Arquitectura y Diseño de Datos de Alta Escalabilidad

*   **OBLIGATORIO - Desacoplamiento de Cargas:** El agente DEBE separar estrictamente las cargas de trabajo OLTP (Transaccionales) de las OLAP (Analíticas). Las tablas OLTP DEBEN cumplir con principios ACID y alta normalización estructural. Las cargas OLAP DEBEN derivarse hacia almacenes orientados a columnas (ej. Snowflake, ClickHouse) o réplicas de solo lectura mediante CDC (Change Data Capture).
*   **OBLIGATORIO - Gestión de Escala y Sharding:** Para entidades de hipercrecimiento, el agente DEBE diseñar estrategias de particionamiento lógico (ej. particionamiento nativo de PostgreSQL por rango/hash) o sharding basado en `tenant_id`. Se DEBE monitorear y gestionar el *Lag de Replicación* al dirigir consultas a Read Replicas.
*   **OBLIGATORIO - Connection Pooling:** PROHIBIDO realizar conexiones directas a la base de datos en arquitecturas serverless. El agente DEBE implementar/prescribir pools de conexiones (ej. **PgBouncer en modo Transacción**) controlando estrictamente los límites de saturación, el `pool_size` y matando activamente conexiones *idle*.
*   **OBLIGATORIO - Estrategias de Caché:** El agente DEBE prescribir patrones de caché distribuida (Redis/KeyDB) para catálogos inmutables o datos de baja volatilidad. Se exige el uso de invalidación determinista (event-driven).

---

## 2. Protocolo de Debugging, Troubleshooting y Root Cause Analysis (RCA)

*   **PROHIBIDO - Debugging Destructivo:** Bajo ninguna circunstancia el agente ejecutará queries ad-hoc pesadas, mutaciones DML masivas sin `WHERE` exhaustivo, o análisis de tablas completas en entornos de Producción para fines de depuración.
*   **OBLIGATORIO - Análisis Científico del Plan de Ejecución:** Toda sospecha de lentitud DEBE diagnosticarse mediante comandos perfiladores en réplicas.
    *   *Correcto (Good Pattern):* `EXPLAIN (ANALYZE, BUFFERS, COSTS) SELECT ...`
    *   *Incorrecto (Anti-Pattern):* Inferir rendimiento basándose solo en conteos de filas o ejecutando la query desnuda en producción para cronometrarla.
*   **OBLIGATORIO - Diagnóstico de Contención y OOM:** El agente DEBE inspeccionar sistemáticamente vistas del sistema para identificar bloqueos y fugas. Buscará anomalías en `pg_stat_activity`, priorizando transacciones en estado `idle in transaction`, bloqueos exclusivos de tabla (Locks) y uso excesivo de archivos temporales (Spills to disk).
*   **OBLIGATORIO - Formato RCA Estructurado:** Todo post-mortem agéntico DEBE presentarse así:
    1.  **Síntoma:** Qué ocurrió y su impacto.
    2.  **Hipótesis:** Causa probable.
    3.  **Validación Telemetría:** Métrica que confirma la hipótesis.
    4.  **Causa Raíz (RCA):** Falla estructural identificada.
    5.  **Mitigación Inmediata:** Acción de contención temporal.
    6.  **Acción Preventiva:** Parche arquitectónico definitivo.

---

## 3. Seguridad Zero-Trust y Manejo de Datos Críticos

*   **OBLIGATORIO - PoLP (Principio de Mínimo Privilegio):** El agente operará bajo contextos de solo lectura (`Read-Only`) por defecto. Cualquier acción destructiva requiere delegación JIT (Just-In-Time) con roles efímeros.
*   **PROHIBIDO - SQL Dinámico no Sanitizado:** Tolerancia cero a la inyección.
    *   *Incorrecto (Anti-Pattern):* `const query = "SELECT * FROM users WHERE id = " + userId;`
    *   *Correcto (Good Pattern):* `const query = "SELECT * FROM users WHERE id = $1"; db.query(query, [userId]);`
*   **OBLIGATORIO - Prevención de Fugas PII (Data Masking):** El agente NO DEBE emitir en logs, almacenar en su memoria de contexto, ni exponer en trazas ningún Dato de Identificación Personal (PII) real (SSN, correos, nombres de pacientes, historiales).
*   **OBLIGATORIO - Cifrado End-to-End:** Se exige la terminación TLS 1.3 en la capa de red y encriptación en reposo (ej. AWS KMS, AES-256-GCM para columnas confidenciales).

---

## 4. Determinismo, Transaccionalidad y Resiliencia

*   **OBLIGATORIO - Idempotencia Estricta:** Todo script, DDL o DML propuesto por el agente DEBE ser seguro de ejecutar $N$ veces en caso de interrupción.
    *   *Incorrecto (Anti-Pattern):* `INSERT INTO config (key, value) VALUES ('theme', 'dark');` (Falla en el segundo intento).
    *   *Correcto (Good Pattern):* `INSERT INTO config (key, value) VALUES ('theme', 'dark') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`
*   **OBLIGATORIO - Control Transaccional Exhaustivo:** Las transacciones mutables deben estar acotadas. El agente prescribirá `statement_timeout` global o por sesión y lógica de *Exponential Backoff with Jitter* en las capas de red.
*   **PROHIBIDO - Consultas No Acotadas:**
    *   *Incorrecto (Anti-Pattern):* `SELECT * FROM auditoria_logs;`
    *   *Correcto (Good Pattern):* `SELECT id, accion FROM auditoria_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50;`

---

## 5. Gobernanza de Datos, Esquemas y Migraciones (CI/CD)

*   **OBLIGATORIO - Versionamiento Declarativo:** El agente DEBE generar esquemas y mutaciones mediante sistemas de control de versiones (Flyway, Prisma, migraciones numeradas de Supabase). Prohibidos los cambios manuales en caliente.
*   **OBLIGATORIO - Patrón Expand/Contract (Zero-Downtime):** Las migraciones que alteren el modelo de datos sin detener el sistema DEBEN ocurrir en fases: 1) Añadir nueva columna, 2) Escribir en ambas, 3) Migrar datos históricos, 4) Leer de nueva columna, 5) Eliminar vieja columna.
*   **OBLIGATORIO - Reversibilidad Garantizada (Rollback):** El agente DEBE entregar siempre un plan de reversión (`down migration` o compensación) lógicamente probado antes de sugerir el cambio de esquema.
*   **OBLIGATORIO - Auto-Generación de ADRs:** Todo rediseño estructural será documentado inmediatamente por el agente en un Registro de Decisiones de Arquitectura (ADR).

---

## 6. Observabilidad y Auditoría de Operaciones Agénticas

*   **OBLIGATORIO - Trazabilidad Agéntica Distribuida:** Toda ejecución modificadora del agente en la base de datos DEBE persistir un rastro en auditoría que incluya: `Correlation ID`, `Agent Run ID`, Filas Afectadas, Duración y Coste estimado.
*   **OBLIGATORIO - Telemetría Avanzada:** El agente integrará contextos de OpenTelemetry. Se definirán umbrales duros de alerta para picos de conexiones (Connection Starvation), caídas en *Cache Hit Ratio* por debajo del 90%, o bloqueos transaccionales superiores a 1 segundo.

---

## 7. Protocolo de Ejecución en Entorno Agéntico (Reglas de Antigravity)

Para garantizar operaciones seguras, autónomas pero supervisadas, el agente DEBE ejecutar el siguiente pipeline procedimental antes de cualquier alteración:

1.  **Fase de Inspección:** Lectura de catálogos de base de datos (`information_schema`, `pg_indexes`, `pg_stat_activity`) para recabar contexto SIN adquirir bloqueos exclusivos (`Access Exclusive Locks`).
2.  **Fase de Simulación:** El agente calculará y emitirá explícitamente el radio de impacto estimado (filas involucradas, IOPS proyectados, tiempo de downtime estimado si existiere).
3.  **Fase de Red de Seguridad:** El agente ensamblará y compilará la estrategia de *Rollback* en memoria.
4.  **Fase de Aprobación (Human-in-the-Loop):** **PROHIBICIÓN ABSOLUTA** de auto-ejecución si el plan involucra sentencias DDL (Ej: `DROP TABLE`, `ALTER TYPE`, `TRUNCATE`) o sentencias DML masivas sin cláusulas de seguridad unívocas. El agente DEBE pausar y requerir autorización humana explícita antes de liberar el script a la consola o API del motor de base de datos.
