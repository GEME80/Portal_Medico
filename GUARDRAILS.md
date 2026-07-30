# Guardrailes de Seguridad y Cumplimiento Legal

## Restricciones Críticas de Base de Datos
- **Deny-by-Default RLS:** Ninguna tabla nueva puede crearse en Supabase sin activar explícitamente `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
- **RBAC Estricto:** Las políticas RLS deben restringir el acceso a tablas clínicas (`historias_clinicas`, `logs_auditoria`) únicamente a usuarios autenticados cuyo JWT contenga el rol `medico`. El rol `recepcion` o administrativo tiene denegada la lectura de campos diagnósticos.
- **Prohibición de Eliminación:** Está terminantemente prohibido escribir queries, funciones o endpoints que ejecuten sentencias `DELETE` o `UPDATE` sobre folios clínicos cerrados.

## Restricciones de Criptografía
- **Datos Sensibles:** Campos como `enfermedad_actual`, `motivo_consulta`, `anamnesis` y `plan_manejo` deben pasar obligatoriamente por una función de cifrado simétrico (AES-256) antes de ser persistidos.
- **Variables de Entorno:** Queda prohibido "quemar" (hardcodear) llaves criptográficas o tokens de Supabase en el código fuente. Deben invocarse mediante `process.env`.
