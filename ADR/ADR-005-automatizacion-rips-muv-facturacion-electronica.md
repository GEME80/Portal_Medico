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

# ADR-005: Automatización Asíncrona de RIPS (Res. 2275), Validación MUV y Facturación Electrónica en Salud (FEV / DIAN)

**Fecha:** 2026-09-16  
**Estado:** Propuesto / En Roadmap Arquitectónico  
**Agentes Involucrados:** 🏛️ Principal Platform Architect, 🩺 Clinical Governance & MinSalud Compliance Lead, 🔒 DevSecOps Lead  
**Actualización Bitácora:** v3.9.0 — Diseño del Pipeline de Automatización Integral de Facturación en Salud  

---

## 1. Contexto y Problema

Bajo la **Resolución 2275 de 2023** y la **Resolución 000948 de 2026** del Ministerio de Salud y Protección Social de Colombia, los RIPS (Registros Individuales de Prestación de Servicios de Salud) dejaron de ser un reporte estadístico mensual en archivos planos `.txt` y pasaron a ser el **soporte electrónico obligatorio e inalterable en formato JSON de la Factura Electrónica de Venta en Salud (FEV / DIAN)**.

Actualmente en HubMed (v3.9.0):
1. El médico registra la atención clínica y cierra formalmente la historia clínica.
2. Desde la consola `/reportes`, el médico o su secretaria filtra el periodo y descarga el archivo oficial `RIPS_[NIT]_[FECHA].json`.
3. El usuario carga dicho archivo manualmente en el portal web del **MUV (Mecanismo Único de Validación en SISPRO)** para obtener el **CUV (Código Único de Validación)**.
4. Con el CUV, ingresa a su software contable (Siigo, Facturatech, Alegra, World Office, etc.) para expedir la factura electrónica ante la DIAN.

**El Desafío:**
El usuario solicita evaluar y diseñar la automatización end-to-end: **que al cerrar la historia clínica se genere el JSON en memoria, se consulte el MUV para obtener el CUV y se dispare la emisión de la Factura Electrónica vía API con el sistema contable**, eliminando cualquier intervención manual.

---

## 2. Decisión Arquitectónica

Se aprueba el diseño arquitectónico de un **Pipeline Asíncrono de Cero Fricción (Non-Blocking Event-Driven Pipeline)** compuesto por 4 capas:

```
[Médico: Clic en "Cerrar Historia"]
                │
                ▼ (< 200 ms - Sellado Criptográfico e Inalterabilidad)
[Historia Clínica en DB: estado = 'cerrado']
                │
                ▼ (Trigger Asíncrono / Edge Function / Webhook Interno)
[Worker de Procesamiento RIPS & FEV (Background Job)]
                │
                ├───────────────────────────────────────────────────┐
                ▼                                                   ▼
     [Vía Directa MinSalud MUV]                         [Vía API Facturador Contable]
  (api.sispro.gov.co / WS_RIPS)                       (Siigo / Facturatech / Alegra)
  • Carga JSON Res. 2275                             • Muchos facturadores ya tienen
  • Obtiene CUV MinSalud                              el validador MUV integrado.
                │                                    • Emite Factura DIAN (CUFE).
                └─────────────────┬─────────────────────────────────┘
                                  ▼
                [Actualización de Metadatos en HubMed]:
                historias_clinicas.facturacion = {
                  "estado_rips": "validado_y_facturado",
                  "codigo_cuv": "CUV-MINSALUD-...",
                  "cufe_dian": "CUFE-DIAN-...",
                  "num_factura": "FEV-1025",
                  "pdf_factura_url": "https://..."
                }
```

### Principios Rectores de la Solución:

1. **Principio de Inalterabilidad y No Bloqueo Clínico (Zero Clinical Latency):**
   - El doctor **nunca** debe esperar una pantalla de carga mientras dialogan los servidores de MinSalud o la DIAN (cuyos tiempos de respuesta oscilan entre 2 y 45 segundos o presentan caídas frecuentes).
   - El cierre del folio médico es atómico, local y criptográficamente sellado en menos de 200 ms. El proceso fiscal/sanitario corre en segundo plano con reintentos exponenciales automáticos (*exponential backoff*).

2. **Aprovechamiento de Operadores Tecnológicos con Pasarela MUV Integrada:**
   - La mayoría de los proveedores contables líderes en Colombia (como Siigo API o Facturatech WebServices) cuentan con endpoints que reciben el payload de RIPS JSON directamente, validan por debajo contra MinSalud (MUV), obtienen el CUV y emiten la Factura Electrónica DIAN en una sola transacción HTTP. Se priorizará esta vía para minimizar puntos de falla externos.

3. **Trazabilidad en el Expediente Clínico:**
   - El estado de la facturación se refleja en la historia clínica del paciente con tres estados visibles:
     - `🟡 RIPS Generado - Pendiente de Validación MUV`
     - `🔵 CUV Obtenido - Transmitiendo a DIAN`
     - `🟢 Facturado y Validado (CUV: [código] · FEV-[num]) [Descargar Factura]`

---

## 3. Consecuencias y Trade-offs

### Positivas
- **Cero carga administrativa para el especialista:** Reducción del tiempo de gestión de 15 minutos por lote a 0 segundos por consulta.
- **Cero inconsistencias fiscales:** Se garantiza que toda consulta cerrada tenga un CUV y una factura electrónica asociada en tiempo real.
- **Resiliencia ante fallas de SISPRO/DIAN:** El uso de colas en segundo plano permite reintentar transmisiones fallidas sin alterar el acto médico.

### Negativas / Consideraciones Técnicas
- **Dependencia de Credenciales del Prestador:** Cada médico o clínica debe suministrar sus credenciales de API (Token Siigo, credenciales Facturatech o usuario SISPRO) en la sección de Habilitación.
- **Gestión de Errores de Negocio:** Si el MUV rechaza un dato (ej. paciente sin fecha de nacimiento o documento errado), el sistema debe notificar a la recepcionista o al médico mediante una alerta en el Dashboard para su corrección rápida.

---

## 4. Estado de Implementación

- **Fase 1 (Completada en v3.9.0):**
  - Motor de generación RIPS JSON bajo Res. 2275/2023 (`lib/rips/generator.ts`).
  - Espacio de Habilitación de datos del consultorio (REPS, NIT, DANE, FEV) en `personalizar/page.tsx`.
  - Manual interactivo y pre-validador en `RipsManager.tsx`.
- **Fase 2 (En Roadmap):**
  - Desarrollo de conectores API específicos una vez definido el proveedor contable del cliente (Siigo / Facturatech / Alegra).
  - Creación del endpoint `/api/rips/auto-process` y worker de reintentos.
