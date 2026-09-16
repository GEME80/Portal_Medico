/**
 * Motor Generador y Pre-Validador RIPS Oficial MinSalud Colombia
 * Estándar: Resolución 2275 de 2023 & Resolución 000948 de 2026
 * Soporte de Interoperabilidad para MUV (SISPRO) y Facturación Electrónica en Salud (FEV / DIAN)
 */

export interface RipsPrestadorConfig {
  numDocumentoIdObligado?: string; // NIT o CC del prestador/médico obligado a facturar
  codigoPrestador?: string; // Código REPS de 12 dígitos (Habilitación MinSalud)
  codigoServicio?: number | string; // Código de servicio habilitado en REPS (ej. 302 Pediatría, 301 Medicina General)
  codigoMunicipio?: string; // Código DANE de 5 dígitos (ej. 11001 Bogotá, 05001 Medellín)
  modalidadAtencion?: string; // "01" Intramural, "02" Extramural, "03" Telemedicina interactiva
  prefijoFactura?: string; // Prefijo Facturación Electrónica (ej. "FEV", "SETT")
  numFactura?: string; // Número o consecutivo de factura
  valorHonorariosDefecto?: number; // Honorarios habituales de consulta (ej. 150000)
}

export interface RipsUsuarioConsulta {
  codPrestador: string; // 12 dígitos REPS
  fechaInicioAtencion: string; // YYYY-MM-DD HH:mm
  numAutorizacion: string | null;
  codConsulta: string; // Código CUPS de 6 dígitos (ej. 890201 Consulta Primera Vez, 890202 Control)
  modalidadGrupoServicioTecSal: string; // "01" Intramural, "02" Extramural, "03" Telemedicina interactiva
  grupoServicios: string; // "01" Consulta Externa
  codServicio: number; // REPS 302, 301, 334, etc.
  finalidadTecnologiaSalud: string; // "10" Diagnóstico
  causaMotivoAtencion: string; // "38" Enfermedad general
  codDiagnosticoPrincipal: string; // Código CIE-10 (ej. "J00", "Z000")
  codDiagnosticoRelacionado1: string | null;
  codDiagnosticoRelacionado2: string | null;
  codDiagnosticoRelacionado3: string | null;
  tipoDiagnosticoPrincipal: string; // "01" Impresión diagnóstica, "02" Confirmado nuevo, "03" Confirmado repetido
  tipoDocumentoIdentificacion: string; // CC, TI, RC, etc.
  numDocumentoIdentificacion: string;
  vrServicio: number; // Valor honorarios
  conceptoRecaudo: string; // "05" No aplica / Particular, "01" Copago, "02" Cuota moderadora
  valorPagoModerador: number; // 0 para particular
  numFEVPagoModerador: string | null;
  consecutivo: number; // Consecutivo de consulta dentro del usuario
}

export interface RipsUsuario {
  tipoDocumentoIdentificacion: string; // CC, TI, RC, CE, PA, etc.
  numDocumentoIdentificacion: string;
  tipoUsuario: string; // "04" Particular, "01" Cotizante, "02" Beneficiario
  fechaNacimiento: string; // YYYY-MM-DD
  codSexo: string; // "M" | "F"
  codPaisResidencia: string; // "170" (Colombia)
  codMunicipioResidencia: string; // DANE 5 dígitos (ej. "11001")
  codZonaTerritorialResidencia: string; // "01" Urbana, "02" Rural
  incapacidad: string; // "NO" | "SI"
  consecutivo: number; // Consecutivo del usuario en el lote
  servicios: {
    consultas: RipsUsuarioConsulta[];
    procedimientos?: any[];
  };
}

export interface RipsOficialJSON {
  numDocumentoIdObligado: string;
  numFactura: string;
  tipoNota: string | null;
  numNota: string | null;
  usuarios: RipsUsuario[];
}

// Flat legacy interface for backwards compatibility
export interface RipsJSON {
  numDocumentoPaciente: string;
  tipoDocumentoPaciente: string;
  codigoDiagnosticoPrincipal: string;
  tipoDiagnosticoPrincipal: string;
  codigoProcedimiento?: string;
  fechaInicioAtencion: string;
  horaInicioAtencion: string;
  numAutorizacion: string | null;
}

// Catálogo básico DANE de municipios colombianos
export const MUNICIPIOS_DANE_COMUNES: { codigo: string; nombre: string; departamento: string }[] = [
  { codigo: "11001", nombre: "Bogotá, D.C.", departamento: "Bogotá" },
  { codigo: "05001", nombre: "Medellín", departamento: "Antioquia" },
  { codigo: "76001", nombre: "Cali", departamento: "Valle del Cauca" },
  { codigo: "08001", nombre: "Barranquilla", departamento: "Atlántico" },
  { codigo: "68001", nombre: "Bucaramanga", departamento: "Santander" },
  { codigo: "13001", nombre: "Cartagena de Indias", departamento: "Bolívar" },
  { codigo: "66001", nombre: "Pereira", departamento: "Risaralda" },
  { codigo: "17001", nombre: "Manizales", departamento: "Caldas" },
  { codigo: "73001", nombre: "Ibagué", departamento: "Tolima" },
  { codigo: "54001", nombre: "Cúcuta", departamento: "Norte de Santander" },
  { codigo: "63001", nombre: "Armenia", departamento: "Quindío" },
  { codigo: "41001", nombre: "Neiva", departamento: "Huila" },
  { codigo: "52001", nombre: "Pasto", departamento: "Nariño" },
  { codigo: "50001", nombre: "Villavicencio", departamento: "Meta" },
  { codigo: "47001", nombre: "Santa Marta", departamento: "Magdalena" },
  { codigo: "19001", nombre: "Popayán", departamento: "Cauca" },
  { codigo: "23001", nombre: "Montería", departamento: "Córdoba" },
  { codigo: "20001", nombre: "Valledupar", departamento: "Cesar" },
  { codigo: "15001", nombre: "Tunja", departamento: "Boyacá" },
  { codigo: "27001", nombre: "Quibdó", departamento: "Chocó" },
  { codigo: "85001", nombre: "Yopal", departamento: "Casanare" }
];

// Servicios REPS más frecuentes en consulta médica ambulatoria
export const SERVICIOS_REPS_COMUNES: { codigo: number; nombre: string }[] = [
  { codigo: 301, nombre: "301 - Medicina General" },
  { codigo: 302, nombre: "302 - Pediatría" },
  { codigo: 334, nombre: "334 - Infectología" },
  { codigo: 329, nombre: "329 - Medicina Interna" },
  { codigo: 356, nombre: "356 - Neumología" },
  { codigo: 312, nombre: "312 - Dermatología" },
  { codigo: 319, nombre: "319 - Ginecobstetricia" },
  { codigo: 307, nombre: "307 - Cirugía General" },
  { codigo: 342, nombre: "342 - Neurología" },
  { codigo: 366, nombre: "366 - Psiquiatría" },
  { codigo: 369, nombre: "369 - Urología" },
  { codigo: 349, nombre: "349 - Ortopedia y Traumatología" },
  { codigo: 344, nombre: "344 - Nutrición y Dietética" },
  { codigo: 374, nombre: "374 - Odontología General" }
];

// Modalidades de atención vigentes
export const MODALIDADES_ATENCION: { codigo: string; nombre: string }[] = [
  { codigo: "01", nombre: "01 - Intramural (En Consultorio)" },
  { codigo: "02", nombre: "02 - Extramural domiciliaria" },
  { codigo: "03", nombre: "03 - Telemedicina interactiva (Videollamada)" },
  { codigo: "04", nombre: "04 - Telemedicina no interactiva" }
];

export interface RipsValidacionError {
  tipo: "error" | "warning";
  campo: string;
  mensaje: string;
  historiaId?: string;
  paciente?: string;
}

/**
 * Pre-Validador de Reglas de Negocio MUV / MinSalud (Resolución 2275 de 2023)
 * Examina los folios cerrados y la configuración para alertar al médico antes de generar el JSON.
 */
export function validarReglasRips(historias: any[], config: RipsPrestadorConfig): { valido: boolean; errores: RipsValidacionError[] } {
  const errores: RipsValidacionError[] = [];

  // Validar datos de Habilitación del Prestador
  if (!config.codigoPrestador || config.codigoPrestador.trim().length !== 12) {
    errores.push({
      tipo: "error",
      campo: "codigoPrestador",
      mensaje: "El Código de Habilitación REPS debe tener exactamente 12 dígitos numéricos (ej. 110010999901). Configúralo en Habilitación RIPS."
    });
  }

  if (!config.numDocumentoIdObligado || config.numDocumentoIdObligado.trim().length < 5) {
    errores.push({
      tipo: "error",
      campo: "numDocumentoIdObligado",
      mensaje: "Falta el NIT o Cédula del profesional/consultorio obligado a facturar."
    });
  }

  if (!config.codigoMunicipio || config.codigoMunicipio.trim().length !== 5) {
    errores.push({
      tipo: "warning",
      campo: "codigoMunicipio",
      mensaje: "El Código DANE del municipio no está configurado. Se usará 11001 (Bogotá) como valor por defecto."
    });
  }

  // Validar historias clínicas
  const cerradas = historias.filter(h => h.estado === "cerrado");
  if (cerradas.length === 0) {
    errores.push({
      tipo: "warning",
      campo: "historias",
      mensaje: "No hay historias clínicas con estado 'cerrado' en este rango. Los borradores no pueden reportarse al MUV."
    });
  }

  cerradas.forEach((h, idx) => {
    const demo = h.snapshot_demografico || h.pacientes || {};
    const nombrePac = demo.nombres ? `${demo.nombres} ${demo.apellidos || ""}` : `Historia #${idx + 1}`;

    // Validar documento paciente
    const doc = demo.documento || h.pacientes?.documento;
    if (!doc || doc === "SIN_DOC") {
      errores.push({
        tipo: "error",
        campo: "documento",
        mensaje: `El paciente ${nombrePac} no tiene un número de documento de identificación válido.`,
        historiaId: h.id,
        paciente: nombrePac
      });
    }

    // Validar diagnóstico principal CIE-10
    const diag = Array.isArray(h.impresion_diagnostica) && h.impresion_diagnostica.length > 0 ? h.impresion_diagnostica[0] : null;
    if (!diag || !diag.codigo) {
      errores.push({
        tipo: "warning",
        campo: "diagnostico",
        mensaje: `La atención de ${nombrePac} no tiene diagnóstico CIE-10 registrado. Se asignará Z000 (Examen médico general).`,
        historiaId: h.id,
        paciente: nombrePac
      });
    }

    // Validar fecha de nacimiento
    const fNac = demo.fecha_nacimiento || h.pacientes?.fecha_nacimiento;
    if (!fNac) {
      errores.push({
        tipo: "warning",
        campo: "fecha_nacimiento",
        mensaje: `El paciente ${nombrePac} no tiene fecha de nacimiento registrada. Se asignará fecha por defecto para evitar rechazo.`,
        historiaId: h.id,
        paciente: nombrePac
      });
    }
  });

  const hayErroresCriticos = errores.some(e => e.tipo === "error");
  return {
    valido: !hayErroresCriticos,
    errores
  };
}

/**
 * Generador Oficial RIPS JSON MinSalud (Resolución 2275 de 2023 & Res. 000948 de 2026)
 * Agrupa atenciones por usuario único según exige el esquema oficial del validador MUV.
 */
export function generarJSONRipsOficial(
  historias: any[],
  config: RipsPrestadorConfig,
  tenantInfo?: { nombre?: string; slug?: string }
): RipsOficialJSON {
  const cerradas = (Array.isArray(historias) ? historias : []).filter(h => h.estado === "cerrado");

  // Configuración prestador con fallbacks seguros
  const codPrestador12 = (config.codigoPrestador || "110010999901").replace(/\D/g, "").padEnd(12, "0").substring(0, 12);
  const numIdObligado = (config.numDocumentoIdObligado || "900000000").trim();
  const codServicioNum = Number(config.codigoServicio) || 302;
  const codMunicipio = (config.codigoMunicipio || "11001").trim();
  const modalidad = config.modalidadAtencion || "01";
  const prefijo = config.prefijoFactura || "FEV";
  const numFactura = config.numFactura || `${prefijo}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const honorariosDefault = Number(config.valorHonorariosDefecto) || 150000;

  // Agrupar atenciones por usuario (llave: tipoDoc + numDoc)
  const usuariosMap = new Map<string, {
    demografico: any;
    consultas: any[];
  }>();

  cerradas.forEach(historia => {
    const demo = historia.snapshot_demografico || historia.pacientes || {};
    const tipoDoc = (demo.tipo_documento || historia.pacientes?.tipo_documento || "CC").toUpperCase();
    const numDoc = String(demo.documento || historia.pacientes?.documento || "0").trim();
    const key = `${tipoDoc}_${numDoc}`;

    if (!usuariosMap.has(key)) {
      usuariosMap.set(key, {
        demografico: {
          tipoDocumentoIdentificacion: tipoDoc,
          numDocumentoIdentificacion: numDoc,
          fechaNacimiento: demo.fecha_nacimiento || historia.pacientes?.fecha_nacimiento || "2000-01-01",
          codSexo: (demo.sexo || historia.pacientes?.sexo || "M").toString().toUpperCase().startsWith("F") ? "F" : "M",
          codMunicipioResidencia: demo.municipio_codigo || codMunicipio,
        },
        consultas: []
      });
    }

    const usuarioEntry = usuariosMap.get(key)!;

    // Diagnósticos
    const diagnosticos = Array.isArray(historia.impresion_diagnostica) ? historia.impresion_diagnostica : [];
    const diagPrincipal = diagnosticos[0] || null;
    const diagRel1 = diagnosticos[1]?.codigo || null;
    const diagRel2 = diagnosticos[2]?.codigo || null;
    const diagRel3 = diagnosticos[3]?.codigo || null;

    // Procedimientos
    const procedimientos = Array.isArray(historia.procedimientos) ? historia.procedimientos : [];
    const procPrincipal = procedimientos[0] || null;

    const fecha = new Date(historia.created_at);
    const fechaStr = fecha.toISOString().split("T")[0];
    const horaStr = fecha.toTimeString().substring(0, 5);
    const fechaHora = `${fechaStr} ${horaStr}`;

    // Normalizar tipo de diagnóstico: "01" (Impresión), "02" (Confirmado nuevo), "03" (Confirmado repetido)
    let tipoDiagNorm = "01";
    if (diagPrincipal?.tipoDiagnosticoPrincipal) {
      const raw = String(diagPrincipal.tipoDiagnosticoPrincipal);
      if (raw === "1" || raw === "01") tipoDiagNorm = "01";
      else if (raw === "2" || raw === "02") tipoDiagNorm = "02";
      else if (raw === "3" || raw === "03") tipoDiagNorm = "03";
    }

    // Código CUPS de la consulta (890201: Primera vez por especialista, 890202: Control)
    const codCups = procPrincipal?.codigo || "890201";

    const consultaItem: RipsUsuarioConsulta = {
      codPrestador: codPrestador12,
      fechaInicioAtencion: fechaHora,
      numAutorizacion: historia.facturacion?.numAutorizacion || null,
      codConsulta: codCups,
      modalidadGrupoServicioTecSal: modalidad,
      grupoServicios: "01", // 01: Consulta Externa
      codServicio: codServicioNum,
      finalidadTecnologiaSalud: "10", // 10: Diagnóstico
      causaMotivoAtencion: "38", // 38: Enfermedad general
      codDiagnosticoPrincipal: (diagPrincipal?.codigo || "Z000").toUpperCase().trim(),
      codDiagnosticoRelacionado1: diagRel1 ? diagRel1.toUpperCase().trim() : null,
      codDiagnosticoRelacionado2: diagRel2 ? diagRel2.toUpperCase().trim() : null,
      codDiagnosticoRelacionado3: diagRel3 ? diagRel3.toUpperCase().trim() : null,
      tipoDiagnosticoPrincipal: tipoDiagNorm,
      tipoDocumentoIdentificacion: tipoDoc,
      numDocumentoIdentificacion: numDoc,
      vrServicio: honorariosDefault,
      conceptoRecaudo: "05", // 05: No aplica / Particular
      valorPagoModerador: 0,
      numFEVPagoModerador: null,
      consecutivo: usuarioEntry.consultas.length + 1
    };

    usuarioEntry.consultas.push(consultaItem);
  });

  // Estructurar lista de usuarios con consecutivo secuencial
  let consecutivoUsuario = 1;
  const usuarios: RipsUsuario[] = [];

  usuariosMap.forEach(({ demografico, consultas }) => {
    usuarios.push({
      tipoDocumentoIdentificacion: demografico.tipoDocumentoIdentificacion,
      numDocumentoIdentificacion: demografico.numDocumentoIdentificacion,
      tipoUsuario: "04", // 04: Particular (Atención privada)
      fechaNacimiento: demografico.fechaNacimiento,
      codSexo: demografico.codSexo,
      codPaisResidencia: "170", // Colombia
      codMunicipioResidencia: demografico.codMunicipioResidencia || codMunicipio,
      codZonaTerritorialResidencia: "01", // 01: Urbana
      incapacidad: "NO",
      consecutivo: consecutivoUsuario++,
      servicios: {
        consultas
      }
    });
  });

  return {
    numDocumentoIdObligado: numIdObligado,
    numFactura: numFactura,
    tipoNota: null,
    numNota: null,
    usuarios
  };
}

/**
 * Función heredada compatible con versiones anteriores
 */
export function generarJSONRips(historias: any[], paciente: any, tenant: any): RipsJSON[] {
  if (!Array.isArray(historias)) return [];

  return historias.map(historia => {
    const diagnosticos = historia.impresion_diagnostica || [];
    const diagPrincipal = diagnosticos.length > 0 ? diagnosticos[0] : null;
    const procedimientos = historia.procedimientos || [];
    const procPrincipal = procedimientos.length > 0 ? procedimientos[0] : null;
    const demo = historia.snapshot_demografico || paciente;

    const fecha = new Date(historia.created_at);
    const fechaISO = fecha.toISOString().split("T")[0];
    const horaISO = fecha.toISOString().split("T")[1].substring(0, 5);
    const tipoDiag = diagPrincipal?.tipoDiagnosticoPrincipal || "1";

    return {
      numDocumentoPaciente: demo?.documento || paciente?.documento || "SIN_DOC",
      tipoDocumentoPaciente: demo?.tipo_documento || paciente?.tipo_documento || "CC",
      codigoDiagnosticoPrincipal: diagPrincipal?.codigo || "Z000",
      tipoDiagnosticoPrincipal: tipoDiag,
      codigoProcedimiento: procPrincipal?.codigo,
      fechaInicioAtencion: fechaISO,
      horaInicioAtencion: horaISO,
      numAutorizacion: historia.facturacion?.numAutorizacion || null
    };
  });
}

