# 🛡️ CÓDIGO MAESTRO DE REGLAS, CIBERSEGURIDAD Y CONTROL DE CALIDAD (QA)
## PROYECTO: PORTAL_MEDICO | MARCA COMERCIAL: HUBMED | ARQUITECTURA MULTI-CLIENTE

> **Nivel de Clasificación:** Documento Rector Inviolable de Ingeniería y Gobernanza  
> **Proyecto Técnico:** `Portal_Medico` ([GEME80/Portal_Medico](https://github.com/GEME80/Portal_Medico.git))  
> **Marca Comercial:** 🏥 **HubMed** (`HubMed Platform` / `hubmed.app`)  
> **URL de Producción:** 🌐 [`https://portal-medico-five.vercel.app`](https://portal-medico-five.vercel.app) — Vercel Edge Network  
> **Base de Datos:** 🗄️ **Supabase** (`nstlomejmhmcasxqxnbf` / PostgreSQL 15 `us-west-2` — Auth + RLS + PgBouncer 6543)  
> **Modelo de Negocio:** SaaS Multi-Tenant Elástico ($N$ Clientes Médicos / Dr. Carlos Torres = Tenant Piloto #1)  
> **Espacio Central de Gobernanza:** 👑 **SuperAdmin Console** (`/superadmin` — `gerkof@gmail.com`)  
> **Autoridad Emisora:** 🏛️ **Agente Principal (Principal Platform Architect & DevSecOps Lead)**  
> **Estado de Cumplimiento:** Obligatorio / Zero Tolerance Policy  

---

## 🧭 1. Principios Rectores Inviolables

1. **Aislamiento Multi-Tenant Estricto (Zero Cross-Tenant Leaks):**  
   Ningún cliente (médico o clínica) podrá jamás acceder, consultar o modificar datos de otro cliente. Toda consulta a la base de datos debe filtrar obligatoriamente por `tenant_id = get_tenant_id()`, blindado por Row Level Security (RLS) en el motor PostgreSQL.
2. **Segregación de Espacios (SuperAdmin vs Cliente):**  
   El **SuperAdmin** opera la plataforma, aprueba suscripciones y monitorea infraestructura, pero **no accede a datos clínicos privados ni diagnósticos de pacientes**. El **Cliente** (médico) gobierna su consultorio y sus historias clínicas, pero no tiene acceso a la consola global ni a otros tenants.
3. **Inalterabilidad Jurídica del Acto Médico (Append-Only):**  
   Los folios clínicos cerrados son inmutables por mandato de MinSalud. Queda estrictamente prohibida la ejecución de sentencias `UPDATE` o `DELETE` sobre registros con `estado = 'cerrado'`. Las rectificaciones deben realizarse como Notas Aclaratorias vinculadas mediante `parent_id`.
4. **Criptografía de Grado Médico para Datos Sensibles:**  
   La información diagnóstica confidencial (`enfermedad_actual`, `motivo_consulta`, `anamnesis`, `plan_manejo`) debe cifrarse obligatoriamente en reposo con **AES-256-GCM** mediante el módulo `lib/crypto.ts` antes de persistir en base de datos.
5. **Eficiencia en Recursos y Manejo de Bases de Datos:**  
   Toda consulta debe estar indexada adecuadamente y proyectar únicamente las columnas necesarias. Queda prohibido `.select('*')` en vistas de listados de pacientes o inventarios.

---

## ⚡ 2. Directivas de Rendimiento y Eficiencia en Base de Datos

### A. Directivas de Lectura (Optimized Reads)
* **Indexación Compuesta Obligatoria:** Toda tabla que contenga `tenant_id` debe poseer índices compuestos sobre los campos de búsqueda habituales (ej: `(tenant_id, documento)`, `(tenant_id, created_at DESC)`).
* **Consultas sobre JSONB con Índices GIN:** Las consultas de analítica médica, diagnósticos CIE-10 o procedimientos CUPS deben apoyarse en índices GIN creados sobre las columnas JSONB correspondientes (`impresion_diagnostica`, `procedimientos`).
* **Data Minimization (Reducción de Egress):** Es mandatorio especificar las columnas en cada consulta:
  ```typescript
  // CORRECTO:
  const { data } = await supabase.from('pacientes').select('id, nombres, apellidos, documento').eq('tenant_id', tenantId);
  // PROHIBIDO:
  const { data } = await supabase.from('pacientes').select('*');
  ```
* **Caché Perimetral de Catálogos Estáticos:** Los catálogos globales (`catalogo_cie10`, `catalogo_cups`, `oms_tablas`) deben servirse con cabeceras de caché prolongada en Vercel Edge (`max-age=86400, stale-while-revalidate=604800`) para evitar consultas repetitivas al clúster de base de datos.

### B. Directivas de Escritura (High-Integrity & Low-Contention Writes)
* **Atomicidad en Cierre de Consultas y Kardex:** Si un acto médico implica la deducción de medicamentos o vacunas, ambas operaciones deben procesarse atómicamente para prevenir discordancias entre la historia clínica y el stock real.
* **Patrón Append-Only para Históricos y Auditoría:** Queda prohibido actualizar registros en `logs_auditoria` o folios médicos cerrados. Esto garantiza inserciones de alta velocidad sin bloqueos de fila (`row-level locks`) ni cuellos de botella de contención.
* **Validaciones O(1) en Triggers:** Triggers como `check_inalterabilidad()` deben realizar chequeos puramente lógicos en memoria (`NEW` vs `OLD`) sin desencadenar subconsultas complejas de lectura.

### C. Conexiones Serverless y Pooler Transaccional (PgBouncer)
* Toda conexión hacia Supabase debe enrutarse a través del puerto **6543** (PgBouncer en modo transacción).
* Queda prohibido abrir conexiones persistentes directas al puerto 5432 desde funciones serverless efímeras de Next.js.

---

## 🔒 3. Matriz de Control de Acceso (RBAC de los 3 Espacios)

| Rol de Usuario | Espacio Asignado | Historias Clínicas | Inventario / Vacunas | Configuración Tenant | Gestión Global de Tenants |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`superadmin`** | `/superadmin` | ❌ (Privacidad Médica Protegida) | ❌ (Solo métricas agregadas) | ✅ Administración global | ✅ Creación y Facturación |
| **`medico` / `doctor`** | `/[slug]/admin` | ✅ Lectura y Escritura (Su Tenant) | ✅ Control de Stock y POS | ✅ Personalización Marca | ❌ Denegado |
| **`recepcion` / `asistente`**| `/[slug]/admin` | ❌ Denegada información diagnóstica | ✅ Registro de Ventas / Citas | ❌ Denegado | ❌ Denegado |
| **`paciente`** | `/[slug]/(public)` | ✅ Solo sus folios propios | ❌ Denegado | ❌ Denegado | ❌ Denegado |

---

## 🔐 4. Motor Criptográfico AES-256-GCM (`lib/crypto.ts`)

* **Vector de Inicialización (IV):** 16 bytes criptográficamente aleatorios por cada campo cifrado (`crypto.randomBytes(16)`).
* **Etiqueta de Autenticación (AuthTag):** Validación de 16 bytes generada por GCM (`cipher.getAuthTag()`).
* **Detección de Manipulación en Base de Datos:**  
  Si durante el descifrado (`decryptClinicalData`) el `authTag` no coincide, el sistema aborta de inmediato:
  ```text
  CRITICAL AUDIT ALERT: Falló la validación del authTag en GCM. Los datos clínicos fueron manipulados directamente en la base de datos.
  ```

---

## 🧪 5. Control de Calidad (QA), Testing y Estándares de Código

* **Compilación Obligatoria TypeScript:** Todo cambio debe validar `npx tsc --noEmit` (**0 errores mandatorio**).
* **Sanitización XSS:** Todo contenido enriquecido capturado a través de TipTap debe ser sanitizado antes de su persistencia.
* **Pruebas de Integridad Pre-Commit:**
  1. Validar que no existan llamadas a `UPDATE` o `DELETE` sobre folios clínicos con `estado = 'cerrado'`.
  2. Verificar que las variables de entorno contengan `CLINICAL_ENCRYPTION_KEY` de 64 caracteres hexadecimales (256 bits).
  3. Comprobar que las APIs manejen excepciones con respuestas JSON normalizadas (`{ error: string, code: string }`).
