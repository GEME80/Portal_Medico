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

# 🛡️ POLÍTICA DE SEGURIDAD Y DIVULGACIÓN COORDINADA DE VULNERABILIDADES (SECURITY.md)

**Versión:** 3.2.0  
**Última Actualización:** Septiembre 2026  
**Autoridad Emisora:** ⚕️ Clinical Compliance Officer & 🔐 QA, Seguridad & Cryptography Auditor  
**Aprobado por:** 🏛️ Principal Platform Architect & SuperAdmin (`gerkof@gmail.com`)  

---

## 1. Compromiso con la Seguridad de la Información en Salud

**HubMed Platform** (`Portal_Medico`) procesa y custodia expedientes clínicos electrónicos (HCE) y datos de salud de carácter reservado y protegido. La confidencialidad, inalterabilidad y disponibilidad de la información médica son imperativos éticos y legales no negociables bajo el marco regulatorio colombiano:
* **Ley Estatutaria 1581 de 2012** (Régimen General de Protección de Datos Personales / Habeas Data).
* **Decreto 1377 de 2013** (Tratamiento de Datos Sensibles de Salud).
* **Resolución 1995 de 1999 y Resolución 000948 de 2026** (Custodia, reserva e inalterabilidad de historias clínicas electrónicas).
* **Resolución 839 de 2017** (Tiempos de retención de archivos clínicos: 5 años gestión + 10-15 años central/frío).

---

## 2. Reporte Coordinado de Vulnerabilidades (Vulnerability Disclosure Policy)

Si eres un investigador de seguridad, profesional técnico o usuario que ha descubierto una potencial falla de seguridad o vulnerabilidad en **HubMed Platform**, te agradecemos reportarla de manera responsable conforme a las siguientes pautas.

### A. Canal de Contacto Oficial
* **Correo Electrónico de Seguridad:** `gerkof@gmail.com`
* **Asunto sugerido:** `[SECURITY DISCLOSURE] - HubMed - [Breve descripción]`
* **Cifrado PGP / Intercambio Seguro:** Se recomienda solicitar canal seguro antes de transmitir información técnica que contenga datos clínicos reales o pruebas de concepto críticas.

### B. Información Requerida en el Reporte
1. Descripción detallada del hallazgo y vector de ataque.
2. Pasos secuenciales para reproducir la vulnerabilidad (PoC).
3. Componente o endpoint afectado (`/[slug]/admin/...`, Server Actions, API routes, middleware o Supabase RLS).
4. Estimación del impacto potencial (ej. fuga de datos de pacientes, elusión de tenant, manipulación de stock).

### C. Lo que Solicitamos (Reglas de Compromiso)
* **No Acceder a Datos de Pacientes Reales:** En caso de detectar una brecha de control de acceso, detén inmediatamente la prueba y no descargues, modifiques ni divulgues información clínica confidencial.
* **No Realizar Ataques de Denegación de Servicio (DoS/DDoS)** sobre la infraestructura de Vercel o Supabase.
* **No Efectuar Ingeniería Social** contra personal médico, administradores o pacientes.
* **Plazo de Divulgación Responsable (Embargo de 90 días):** Te solicitamos mantener la confidencialidad del hallazgo hasta que el equipo de ingeniería de HubMed haya implementado, validado y desplegado el parche correspondiente en producción.

---

## 3. Matriz de Severidad y Acuerdos de Nivel de Servicio (SLA)

| Severidad | Ejemplos de Vectores | Tiempo Inicial de Respuesta | Tiempo Objetivo de Mitigación |
| :--- | :--- | :--- | :--- |
| 🔴 **Crítica** | Fuga cross-tenant en RLS, bypass de autenticación, ejecución remota, revelación de `CLINICAL_ENCRYPTION_KEY`. | < 4 horas | < 24 horas |
| 🟠 **Alta** | Inyección SQL/NoSQL, manipulación de folios cerrados saltando el trigger, XSS almacenado en notas médicas. | < 12 horas | < 72 horas |
| 🟡 **Media** | Fallas de CSRF en acciones secundarias, omisión de headers HTTP de seguridad, redirecciones abiertas. | < 24 horas | < 7 días hábiles |
| 🟢 **Baja** | Enumeración de usuarios o médicos sin datos sensibles, divulgación de versiones en encabezados informativos. | < 48 horas | < 15 días hábiles |

---

## 4. Controles Técnicos de Seguridad Implementados

1. **Aislamiento Multi-Tenant Deny-by-Default:**
   - Cada consulta a la base de datos se ejecuta bajo el contexto de políticas Row Level Security (RLS) en PostgreSQL 15, vinculadas a la función `get_tenant_id()`.
2. **Criptografía de Grado Médico (AES-256-GCM):**
   - Los campos de evolución médica confidenciales (`enfermedad_actual`, `anamnesis`, `motivo_consulta`, `plan_manejo`) se cifran en la capa de aplicación (`lib/crypto.ts`) mediante AES-256-GCM antes de persistir en base de datos, con validación de etiqueta `authTag` de 16 bytes que previene y detecta manipulación en base de datos.
3. **Inalterabilidad Jurídica (Append-Only):**
   - Una vez una historia clínica alcanza el estado `'cerrado'`, el trigger PL/pgSQL `check_inalterabilidad()` aborta cualquier intento de `UPDATE` o `DELETE`. Toda rectificación debe realizarse mediante folios aclaratorios vinculados por `parent_id`.
4. **Transporte Seguro y Red Perimetral:**
   - Terminación TLS 1.3 con certificados HSTS forzados en Vercel Edge Network.
   - Conexiones a PostgreSQL enrutadas exclusivamente a través de PgBouncer (puerto 6543 en modo transacción).
5. **Gobernanza Human-in-the-Loop:**
   - Ningún agente autónomo o automatización tiene permitido ejecutar sentencias DDL destructivas (`DROP TABLE`, `TRUNCATE`) en producción sin autorización explícita del SuperAdmin.
