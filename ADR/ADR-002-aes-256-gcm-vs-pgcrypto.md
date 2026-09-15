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

# ADR-002: Cifrado AES-256-GCM en Capa de Aplicación vs pgcrypto en Base de Datos

**Fecha:** 2026-07-02  
**Estado:** Aprobado  
**Agentes Involucrados:** 🔐 QA, Seguridad & Cryptography Auditor & 🏛️ Principal Platform Architect  
**Actualización Bitácora:** v2.2 — Criptografía de Grado Médico  

---

## 1. Contexto y Problema

Los registros médicos contienen datos altamente confidenciales y protegidos legalmente (anamnesis, motivo de consulta, enfermedad actual y plan de manejo). Conforme a la legislación colombiana (Ley 1581 de 2012 de Protección de Datos Personales / Habeas Data y directrices sanitarias), estos datos deben almacenarse cifrados en reposo para prevenir que administradores de bases de datos, dumps no autorizados o atacantes con acceso físico/lógico a PostgreSQL puedan visualizar el contenido clínico.

Se evaluaron dos estrategias de cifrado:
1. **Cifrado en Base de Datos usando la extensión `pgcrypto` de PostgreSQL.**
2. **Cifrado en la Capa de Aplicación (Node.js Server Runtime) con AES-256-GCM (`lib/crypto.ts`).**

---

## 2. Decisión

Se resolvió implementar **Cifrado en la Capa de Aplicación mediante AES-256-GCM en Node.js (`lib/crypto.ts`)** con clave simétrica de 256 bits (`CLINICAL_ENCRYPTION_KEY`), vector de inicialización (IV) único de 16 bytes y etiqueta de autenticación (`authTag`) de 16 bytes.

Razones clave de la decisión:
1. **Zero-Trust sobre la Base de Datos:**
   - Si se utilizara `pgcrypto`, la clave de cifrado o descifrado debería viajar en las sentencias SQL (`pgp_sym_encrypt('...', $key)`), quedando expuesta en los logs de consultas lentas de PostgreSQL (`pg_stat_statements`), trazas de PgBouncer y accesible a cualquier usuario con privilegios de superusuario en el motor de base de datos.
   - Con AES-256-GCM en Node.js, la base de datos almacena exclusivamente strings opacos formateados como `iv_hex:authTag_hex:ciphertext_hex`. Ni Supabase ni el proveedor cloud pueden descifrar los folios médicos.
2. **Detección Criptográfica de Manipulación (Integridad Autenticada):**
   - El modo GCM (*Galois/Counter Mode*) proporciona no solo confidencialidad sino autenticidad e integridad. Si un atacante o script modifica directamente los bytes en PostgreSQL, el método `decipher.final()` falla arrojando una excepción inmediata, lo que desencadena una alerta crítica de auditoría forense (`logs_auditoria`).
3. **Descarga de Cómputo CPU del Servidor de Base de Datos:**
   - Cifrar y descifrar en la base de datos consumiría ciclos de CPU del clúster administrado (`t4g.nano` en Supabase), reduciendo la capacidad transaccional de consultas concurrentes. En su lugar, el cómputo se distribuye horizontalmente en las instancias serverless de Next.js en Vercel.

---

## 3. Consecuencias y Trade-offs

### Positivas
- Máxima estanqueidad: La base de datos no tiene conocimiento de las claves criptográficas.
- Inalterabilidad respaldada criptográficamente por la etiqueta GCM (`authTag`).
- Aislamiento absoluto ante filtraciones accidentales de respaldos o backups de PostgreSQL.

### Negativas / Mitigaciones
- *Pérdida de Búsqueda de Texto Completo en Columnas Cifradas:* No es posible ejecutar consultas SQL `LIKE '%dolor%'` sobre columnas cifradas. **Mitigación:** Los diagnósticos y procedimientos estructurados se almacenan en columnas JSONB separadas (`impresion_diagnostica` con códigos CIE-10 indexados por GIN), reservando el cifrado estricto para la narrativa clínica libre.
- *Gestión Crítica de la Clave:* Si se extravía `CLINICAL_ENCRYPTION_KEY`, los registros médicos son irrecuperables. **Mitigación:** La clave se gestiona mediante variables de entorno en Vercel y Supabase Vault con custodia estricta de 64 caracteres hexadecimales.
