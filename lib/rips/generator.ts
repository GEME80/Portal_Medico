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

export function generarJSONRips(historias: any[], paciente: any, tenant: any): RipsJSON[] {
  if (!Array.isArray(historias)) return [];

  return historias.map(historia => {
    // Buscar diagnóstico principal
    const diagnosticos = historia.impresion_diagnostica || [];
    const diagPrincipal = diagnosticos.length > 0 ? diagnosticos[0] : null;

    // Buscar procedimiento (si aplica)
    const procedimientos = historia.procedimientos || [];
    const procPrincipal = procedimientos.length > 0 ? procedimientos[0] : null;

    // Snapshot demográfico o fallback al paciente actual
    const demo = historia.snapshot_demografico || paciente;

    const fecha = new Date(historia.created_at);
    // Formato YYYY-MM-DD
    const fechaISO = fecha.toISOString().split('T')[0];
    // Formato HH:MM
    const horaISO = fecha.toISOString().split('T')[1].substring(0, 5);

    // Tipo de diagnóstico: por defecto '1' (Impresión diagnóstica)
    const tipoDiag = diagPrincipal?.tipoDiagnosticoPrincipal || '1';

    return {
      numDocumentoPaciente: demo.documento || paciente.documento,
      tipoDocumentoPaciente: demo.tipo_documento || paciente.tipo_documento || 'CC',
      codigoDiagnosticoPrincipal: diagPrincipal?.codigo || 'Z000', // Fallback a examen general si no hay
      tipoDiagnosticoPrincipal: tipoDiag,
      codigoProcedimiento: procPrincipal?.codigo,
      fechaInicioAtencion: fechaISO,
      horaInicioAtencion: horaISO,
      numAutorizacion: historia.facturacion?.numAutorizacion || null
    };
  });
}
