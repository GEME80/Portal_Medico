# 🛡️ GUARDRAILES DE SEGURIDAD Y CUMPLIMIENTO LEGAL
## PROYECTO: PORTAL_MEDICO | MARCA COMERCIAL: HUBMED | CLIENTE PILOTO: DR. CARLOS TORRES

> **Proyecto Técnico:** `Portal_Medico` (GitHub: [GEME80/Portal_Medico](https://github.com/GEME80/Portal_Medico.git))  
> **URL de Producción:** 🌐 [`https://portal-medico-five.vercel.app`](https://portal-medico-five.vercel.app)  
> **Base de Datos:** 🗄️ `Supabase` (`nstlomejmhmcasxqxnbf` / PostgreSQL 15 `us-west-2` — PgBouncer 6543)  
> **Nivel de Severidad:** CRÍTICO / TOLERANCIA CERO  
> **Ámbito:** Todo cambio de código, migración SQL, endpoint API o componente de interfaz.

---

## 🗄️ 1. Restricciones Críticas de Base de Datos y Multi-Tenancy

1. **Deny-by-Default RLS:**  
   Ninguna tabla nueva puede crearse en Supabase sin activar explícitamente:
   ```sql
   ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;
   ```
2. **Aislamiento Multi-Tenant Estricto:**  
   Toda política RLS sobre tablas de datos clínicos, inventarios o pacientes debe restringir el acceso al inquilino correspondiente:
   ```sql
   USING (tenant_id = get_tenant_id() OR is_superadmin())
   WITH CHECK (tenant_id = get_tenant_id());
   ```
3. **Inalterabilidad de Historias Clínicas (Mandato MinSalud):**  
   Está terminantemente prohibido escribir queries, endpoints o funciones que ejecuten sentencias `UPDATE` o `DELETE` sobre folios clínicos con `estado = 'cerrado'`.
   * El trigger `check_inalterabilidad()` abortará cualquier intento directamente en PostgreSQL.
4. **Mecanismo Exclusivo de Enmienda (Notas Aclaratorias):**  
   Toda corrección debe implementarse como un nuevo registro subordinado (`parent_id`) con su propia autoría y fecha/hora certificada.

---

## 🔐 2. Restricciones Criptográficas y de Privacidad

1. **Cifrado Mandatorio en Reposo (AES-256-GCM):**  
   Los campos `enfermedad_actual`, `motivo_consulta`, `anamnesis` y `plan_manejo` deben pasar obligatoriamente por la función `encryptClinicalData()` de `lib/crypto.ts` antes de ser persistidos.
2. **Validación Inviolable de AuthTag:**  
   Si durante el descifrado (`decryptClinicalData`) la etiqueta de autenticación (authTag) no coincide, el sistema debe alertar inmediatamente a `logs_auditoria` por presunta manipulación pericial de base de datos y denegar el acceso.
3. **Protección de Claves Criptográficas:**  
   Queda prohibido hardcodear `CLINICAL_ENCRYPTION_KEY`, `SUPABASE_SERVICE_ROLE_KEY` o credenciales maestras. Deben invocarse exclusivamente a través de `process.env`.

---

## 🌐 3. Restricciones de Enrutamiento y Edge Middleware

1. **Protección de Rutas SuperAdmin (`/superadmin`):**  
   Solo el usuario autenticado con correo autorizado (`gerkof@gmail.com` / `SUPERADMIN_EMAIL`) puede acceder a la consola global de tenants. Toda solicitud no autorizada debe redirigirse a `/superadmin/login`.
2. **Aislamiento de Rutas Administrativas de Tenant (`/[slug]/admin`):**  
   El médico o personal de un tenant solo puede autenticarse y administrar el espacio asignado a su `tenant_id`.

---

## 🧪 4. Restricciones de Calidad de Código y TypeScript

1. **Cero Errores de Compilación:**  
   Antes de cada commit, es obligatorio ejecutar `./node_modules/.bin/tsc --noEmit`. Si existe un solo error, el cambio queda bloqueado.
2. **Sanitización de Contenido Enriquecido:**  
   El editor TipTap debe sanitizar todo HTML entrante para prevenir vectores de inyección XSS en notas clínicas o perfiles.
