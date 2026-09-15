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

# ADR-001: Supabase (PostgreSQL 15) vs Firebase (Firestore) como BaaS Multi-Tenant

**Fecha:** 2026-06-20  
**Estado:** Aprobado  
**Agentes Involucrados:** 🗄️ DBA Custodian & 🏛️ Principal Platform Architect  
**Actualización Bitácora:** v1.0 — Core Multi-Tenant Architecture  

---

## 1. Contexto y Problema

HubMed Platform (`Portal_Medico`) requiere un Backend-as-a-Service (BaaS) capaz de gestionar simultáneamente datos clínicos de alta sensibilidad (Historias Clínicas Electrónicas conforme a MinSalud Colombia), control de inventario de medicamentos/vacunas con trazabilidad de lotes y fechas de vencimiento (Kardex), y un modelo SaaS multi-tenant elástico con aislamiento estricto entre consultorios y clínicas.

Se evaluaron dos alternativas principales en la nube:
1. **Google Firebase (Firestore NoSQL + Firebase Auth)**
2. **Supabase (Managed PostgreSQL 15 + Supabase Auth + PgBouncer)**

---

## 2. Decisión

Se seleccionó **Supabase (PostgreSQL 15 administrado en AWS `us-west-2`)** como el motor de persistencia y autenticación unificado de HubMed Platform por las siguientes razones de peso técnico y regulatorio:

1. **Integridad Relacional y Cumplimiento ACID:**
   - El control de inventario médico (FEFO - *First Expired, First Out*) y el cierre de historias clínicas exigen transacciones atómicas estrictas. Una consulta médica con aplicación de vacuna debe actualizar el folio clínico y descontar el lote en una sola transacción indivisible. Firestore no ofrece relaciones relacionales nativas con llaves foráneas (`FOREIGN KEY`) en cascada ni integridad referencial declarativa.
2. **Row Level Security (RLS) Nativo en el Motor:**
   - PostgreSQL RLS permite imponer aislamiento multi-tenant a nivel de base de datos (`tenant_id = get_tenant_id()`). En Firestore, las reglas de seguridad son externas al motor relacional y dificultan consultas complejas con agregaciones multi-colección y joins.
3. **Inalterabilidad Forense y Triggers en Servidor:**
   - La normativa colombiana (Resolución 1995 de 1999 y Resolución 000948 de 2026) exige inalterabilidad jurídica de folios cerrados. Supabase permite implementar triggers en PL/pgSQL (`check_inalterabilidad()`) que rechazan mutaciones a nivel de base de datos antes de que se consoliden en disco.
4. **Indexación Avanzada B-Tree y GIN:**
   - Las historias clínicas almacenan diagnósticos CIE-10/11 y procedimientos CUPS en columnas semi-estructuradas JSONB. PostgreSQL proporciona índices GIN (*Generalized Inverted Index*) nativos, permitiendo búsquedas de códigos médicos en milisegundos mediante el operador `@>`.
5. **Connection Pooling Eficiente para Serverless (PgBouncer):**
   - El puerto 6543 con PgBouncer en modo transacción previene el agotamiento de sockets desde funciones serverless en Vercel Edge.

---

## 3. Consecuencias y Trade-offs

### Positivas
- Estanqueidad multi-tenant garantizada por diseño en base de datos.
- Disponibilidad de tipos de datos ricos: `UUID`, `JSONB`, `TIMESTAMPTZ` e índices especializados.
- Compatibilidad directa con clientes SQL estándar y migraciones declarativas versionadas.
- Soporte nativo para extensiones como `pgcrypto` si se requiere interoperabilidad en BD.

### Negativas / Mitigaciones
- *Complejidad de Conexiones Serverless:* Resuelto dirigiendo todo el tráfico transaccional a través de PgBouncer (puerto 6543) y usando `@supabase/ssr` en Next.js.
- *Mantenimiento de Migraciones SQL:* Requiere un flujo formal de migraciones versionadas documentado en `supabase/migrations/` con bloques `UP`, `DOWN` e `IMPACT_ESTIMATE`.
