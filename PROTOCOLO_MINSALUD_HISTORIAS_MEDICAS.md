# ⚕️ PROTOCOLO OFICIAL DE SEGURIDAD, CUSTODIA E INALTERABILIDAD DE HISTORIAS CLÍNICAS ELECTRÓNICAS (HCE)
## ESTÁNDARES DEL MINISTERIO DE SALUD Y PROTECCIÓN SOCIAL DE COLOMBIA
### PLATAFORMA SAAS: PORTAL_MEDICO (HUBMED) | MULTI-CLIENTE

> **Proyecto Técnico:** `Portal_Medico` ([GEME80/Portal_Medico](https://github.com/GEME80/Portal_Medico.git))  
> **Nombre Comercial:** 🏥 **HubMed** (`HubMed Platform` / `hubmed.app`)  
> **URL de Producción:** 🌐 [`https://portal-medico-five.vercel.app`](https://portal-medico-five.vercel.app) — Vercel Edge Network  
> **Base de Datos:** 🗄️ **Supabase** (`nstlomejmhmcasxqxnbf` / PostgreSQL 15 `us-west-2` — Auth + RLS + PgBouncer 6543)  
> **Ámbito de Aplicación:** 100% de los médicos, especialistas y clínicas suscriptoras de HubMed (Dr. Carlos Torres = Tenant Piloto #1 y futuros clientes SaaS)  
> **Consola de Supervisión:** 👑 **SuperAdmin** (`gerkof@gmail.com` — `/superadmin` — Métricas globales de cumplimiento sin acceso a datos clínicos privados)  
> **Autoridad Emisora:** 🏛️ **Agente Principal & Oficial de Cumplimiento Normativo Clínico**  
> **Marco Jurídico Vigente:**
> * **Resolución 000948 de Mayo de 2026:** Estándares técnicos de interoperabilidad de HCE y generación del Registro Individual de Prestación de Servicios de Salud (RIPS).
> * **Resolución 1995 de 1999:** Normas integrales para el diligenciamiento, administración, custodia y archivo de la Historia Clínica.
> * **Resolución 839 de 2017:** Modificación y estandarización de los tiempos de retención y custodia documental de historias clínicas.
> * **Ley 1751 de 2015:** Ley Estatutaria de Salud (derecho fundamental a la salud, reserva del acto médico e intimidad).
> * **Ley 1581 de 2012 y Decreto 1377 de 2013:** Régimen General de Protección de Datos Personales (Tratamiento de Datos Sensibles de Salud).  

---

## 🏛️ 1. Principios Jurídicos y Técnicos Obligatorios

En HubMed Platform, la Historia Clínica Electrónica es tratada como un documento legal público-privado de reserva absoluta, estructurado bajo seis pilares normativos de MinSalud:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 6 PILARES SANITARIOS EN PORTAL_MEDICO (HUBMED)              │
├───────────────────┬───────────────────┬─────────────────────────────────────┤
│ 1. INALTERABILIDAD│ 2. INTEGRIDAD     │ 3. CONFIDENCIALIDAD                 │
│ Prohibición de    │ Cifrado simétrico │ Acceso restringido por rol clínico  │
│ UPDATE y DELETE   │ AES-256-GCM       │ y aislamiento multi-tenant por RLS  │
├───────────────────┼───────────────────┼─────────────────────────────────────┤
│ 4. TRAZABILIDAD   │ 5. DISPONIBILIDAD │ 6. CUSTODIA A LARGO PLAZO           │
│ Audit Trail total │ Uptime 99.9% en   │ Retención obligatoria por 15 a 20   │
│ IP, usuario, hora │ Vercel y Supabase │ años en almacenamiento inmutable    │
└───────────────────┴───────────────────┴─────────────────────────────────────┘
```

1. **Inalterabilidad y No Repudio:** Todo folio clínico en estado `'cerrado'` adquiere firmeza jurídica; queda prohibida su modificación o eliminación.
2. **Integridad Criptográfica:** El motor criptográfico valida matemáticamente que la información médica no ha sufrido alteraciones en la base de datos tras su firma.
3. **Confidencialidad:** La información diagnóstica solo es accesible por el médico tratante de cada tenant y el paciente legitimado. La consola de SuperAdmin y el personal de apoyo tienen denegado el acceso a campos clínicos confidenciales.
4. **Trazabilidad Inmutable (Audit Trail):** Registro pericial de cada lectura, apertura, cierre o descarga efectuada sobre el expediente.
5. **Disponibilidad:** Acceso oportuno y continuo para la atención sanitaria con infraestructura de alta resiliencia.
6. **Conservación Legal Prolongada:** Retención obligatoria durante un término mínimo de **15 a 20 años** desde la última atención médica.

---

## 🔒 2. Implementación de Inalterabilidad en Base de Datos

### A. Bloqueo a Nivel de Motor (PostgreSQL Trigger)
Para dar estricto cumplimiento a la Resolución 1995/1999 y Resolución 000948/2026, la inalterabilidad se ejecuta en el propio motor de base de datos PostgreSQL:

```sql
CREATE OR REPLACE FUNCTION check_inalterabilidad()
RETURNS TRIGGER AS $$
BEGIN
  -- Impedir UPDATE si la historia clínica ya fue cerrada
  IF (TG_OP = 'UPDATE') THEN
    IF OLD.estado = 'cerrado' THEN
      RAISE EXCEPTION 'VIOLACIÓN NORMATIVA MINSALUD: Un folio clínico cerrado es inalterable por ley.';
    END IF;
  END IF;

  -- Impedir DELETE bajo cualquier circunstancia sobre folios cerrados
  IF (TG_OP = 'DELETE') THEN
    IF OLD.estado = 'cerrado' THEN
      RAISE EXCEPTION 'VIOLACIÓN NORMATIVA MINSALUD: Un folio clínico cerrado no puede ser eliminado por mandato legal.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_inalterabilidad
  BEFORE UPDATE OR DELETE ON historias_clinicas
  FOR EACH ROW EXECUTE FUNCTION check_inalterabilidad();
```

### B. Procedimiento Legal de Corrección: Notas Aclaratorias (Append-Only)
Cuando el médico tratante de cualquier clínica requiera corregir, adicionar o precisar información sobre un folio cerrado:
1. **Intangibilidad del Original:** El folio original permanece 100% inalterado en la base de datos.
2. **Creación de Nota Aclaratoria:** Se inserta un nuevo registro en `historias_clinicas` con:
   * `parent_id`: UUID que apunta al folio clínico original.
   * `estado`: `'cerrado'`.
   * `motivo_consulta`: Razón formal y justificación legal de la nota aclaratoria.
   * `created_at`: Fecha y hora exacta de la aclaración registrada por el servidor.
   * `medico_id`: Identificador del profesional que emite la aclaración (con verificación de ReTHUS).

---

## 🧬 3. Snapshot Demográfico Inmutable

Para evitar que actualizaciones futuras del paciente (cambio de teléfono, dirección, asegurador/EPS) alteren retrospectivamente el contexto del acto médico:
* Al cerrar el folio, HubMed genera un objeto atómico **`snapshot_demografico`** en `JSONB`:
```json
{
  "documento": "1098765432",
  "tipo_documento": "RC",
  "nombres": "Mateo",
  "apellidos": "Torres Rodríguez",
  "fecha_nacimiento": "2024-02-10",
  "edad_al_momento_consulta": {
    "anos": 2,
    "meses": 7,
    "dias": 0
  },
  "genero": "M",
  "eps": "Sanitas",
  "regimen": "Contributivo",
  "acudiente": "Laura Rodríguez (Madre)",
  "telefono_contacto": "3001234567"
}
```

---

## 🔐 4. Criptografía de Grado Médico (AES-256-GCM)

En cumplimiento de la Ley 1581 de 2012 (Tratamiento de Datos Sensibles), HubMed procesa las columnas clínicas más confidenciales mediante `lib/crypto.ts`:
* `enfermedad_actual`
* `motivo_consulta`
* `anamnesis`
* `plan_manejo`

### Especificación Criptográfica:
* **Algoritmo:** `aes-256-gcm` (Galois/Counter Mode con autenticación integrada).
* **Clave Maestra:** `CLINICAL_ENCRYPTION_KEY` de 256 bits protegida en variables de entorno del servidor.
* **Formato de Almacenamiento:** `iv:authTag:encryptedData` (hexadecimal).
* **Alerta de Manipulación:** Si el descifrado falla porque el `authTag` no coincide, el sistema lanza una alerta inmediata:
  ```text
  CRITICAL AUDIT ALERT: Falló la validación del authTag en GCM. Los datos clínicos fueron manipulados directamente en la base de datos.
  ```

---

## ⚡ 5. Eficiencia en Base de Datos para Extracción RIPS 2026

La generación periódica de archivos RIPS para el Ministerio de Salud exige consultar cientos o miles de folios por consultorio sin degradar el rendimiento general:
1. **Índices GIN sobre `impresion_diagnostica` y `procedimientos`:** Permiten filtrar folios clínicos por códigos CIE-10 (`@> '[{"codigo": "J06.9"}]'`) de forma instantánea.
2. **Consultas Proyectadas para RIPS:** El generador de RIPS consulta únicamente los campos requeridos por la Resolución 000948 de 2026, evitando cargar texto clínico largo en memoria.
3. **Pistas de Auditoría Indexadas:** La tabla `logs_auditoria` cuenta con índices B-Tree sobre `(tenant_id, created_at DESC)` para generar informes de trazabilidad pericial en milisegundos.

---

## 📦 6. Protocolo de Custodia, Archivo y Retención a Largo Plazo

Conforme a la **Resolución 839 de 2017** de MinSalud:

### A. Plazos de Conservación Legal
* **Archivo de Gestión (Nivel Caliente):** Mínimo **5 años** en la base de datos activa desde la fecha de la última atención del paciente.
* **Archivo Central / Frío:** Mínimo **10 años adicionales**, totalizando **15 años** como regla general de retención obligatoria.
* **Casos Pediátricos (Dr. Carlos Torres y pediatras de HubMed):** La retención obligatoria de 15 años se cuenta a partir de la fecha en que el menor alcanza la mayoría de edad (18 años), requiriendo custodia obligatoria hasta que cumpla 33 años.

### B. Respaldos Cifrados y Almacenamiento Inmutable (WORM)
* **Backups Automáticos Diarios:** Copias de seguridad periódicas de la base de datos cifradas con llaves RSA-4096 / AES-256.
* **Almacenamiento WORM (*Write Once, Read Many*):** Los respaldos históricos se archivan en almacenamiento frío en la nube con bloqueo de inmutabilidad para impedir cualquier borrado o modificación durante los 15-20 años exigidos.

---

## 🌐 7. Interoperabilidad y Validación de Talento Humano (ReTHUS)

* **CIE-10 / CIE-11 & CUPS:** Validación contra tablas maestras compartidas por todos los clientes.
* **Validación ReTHUS:** Solo profesionales de la salud debidamente acreditados en el Registro Único Nacional del Talento Humano en Salud pueden firmar folios médicos en cualquier consultorio de HubMed Platform.
