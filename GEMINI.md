# Contexto del Proyecto: Plataforma de Historias Clínicas (Colombia)

## Stack Tecnológico
- **Frontend / Backend:** Next.js (App Router) desplegado en Vercel.
- **Base de Datos / BaaS:** Supabase (PostgreSQL) con Row Level Security (RLS).
- **Criptografía:** Extensión `pgcrypto`, Supabase Vault y módulo nativo `crypto` de Node.js.

## Estándares Técnicos Obligatorios (Regulación Colombiana)
- **CIE-10 / CIE-11:** Todas las tablas e inputs de diagnósticos deben usar exclusivamente la codificación internacional estándar.
- **CUPS:** Las órdenes médicas de procedimientos deben formatearse estrictamente bajo la Clasificación Única de Procedimientos en Salud de Colombia.
- **Formato de Fecha:** El backend de la aplicación debe forzar el huso horario de Colombia (`America/Bogota`) y usar exclusivamente el timestamp generado por el servidor de base de datos (`NOW()`).
- **Esquema de Base de Datos:** Mantener estricta separación relacional entre la tabla `pacientes` (datos operativos mutables) e `historias_clinicas` (folios clínicos inmutables).
- **TypeScript:** Uso obligatorio de modo estricto (`strict: true`). Todos los payloads clínicos (`JSONB`) deben tener interfaces fuertemente tipadas basadas en el estándar HL7 FHIR.
