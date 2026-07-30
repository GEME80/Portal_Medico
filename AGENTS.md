# Arquitectura de Agentes en Paralelo

## 1. Agente Core Base de Datos (DB-Agent)
- **Ámbito de Trabajo:** Carpeta `/supabase` (migraciones, schemas, triggers, RLS).
- **Misión:** 
  - Diseñar el trigger de Postgres que bloquee modificaciones (`check_inalterabilidad`) en folios cerrados.
  - Configurar las tablas de `pacientes` (editable) e `historias_clinicas` (inmutable) aplicando la estrategia de *Snapshot Demográfico*.
  - Configurar `historias_clinicas` con soporte nativo de campos indexados para JSON (`JSONB`) para los campos de diagnósticos, procedimientos y datos de facturación (alineados con la Resolución 000948 de mayo de 2026 de MinSalud).
  - Implementar la tabla de `logs_auditoria` para capturar el *Audit Trail* (IP, usuario, timestamp del servidor, acción y errores de desencriptación).

## 2. Agente Backend & Seguridad (Security-Agent)
- **Ámbito de Trabajo:** `/src/app/api` (Serverless Functions de Vercel), `/src/lib/crypto`.
- **Misión:**
  - Desarrollar las funciones de encriptación y desencriptación de columnas usando Node.js `crypto` modo `aes-256-gcm`. Este modo incluye una etiqueta de autenticación (authTag). Si falla el desencriptado por manipulación directa, debe alertar al log de auditoría.
  - Diseñar el Cron Job de respaldo automatizado (Vercel Cron) que ejecute un `pg_dump` seguro, lo encripte a nivel de archivo y lo envíe a almacenamiento frío en la nube con retención a largo plazo (15 años obligatorios).
  - Crear el middleware de validación del Registro Único Nacional del Talento Humano en Salud (ReTHUS) en las rutas protegidas.

## 3. Agente Frontend e Interoperabilidad (UI-Agent)
- **Ámbito de Trabajo:** `/src/components`, `/src/app/(dashboard)`.
- **Misión:**
  - Construir los formularios estructurados de captura (Bloques Demográficos, Anamnesis, Impresión Diagnóstica y Cierre).
  - Desarrollar la lógica de creación de "Notas Aclaratorias" tipo *Append-Only* vinculadas mediante `parent_id` para folios corregidos.
  - Implementar los validadores dinámicos que consuman los catálogos CIE-10/11 y CUPS en las interfaces de consulta.
