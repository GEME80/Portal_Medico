import { notFound } from "next/navigation";
import { getCarneDigitalPublico } from "@/lib/actions/vacunas-actions";
import CarnePrintButton from "@/components/CarnePrintButton";
import { 
  ESQUEMA_MATRIZ_CANONICO, 
  matchAplicacionFila, 
  getVacunasOtras 
} from "@/lib/vacunas/constants";
import { 
  ShieldCheck, 
  Syringe, 
  User, 
  CheckCircle2, 
  Check, 
  Sparkles, 
  AlertCircle 
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string; token: string }> | { slug: string; token: string };
}

function calcularEdadDetallada(fechaNacimiento: string) {
  if (!fechaNacimiento) return "Edad no especificada";
  const hoy = new Date();
  const nace = new Date(fechaNacimiento);
  let anos = hoy.getFullYear() - nace.getFullYear();
  let meses = hoy.getMonth() - nace.getMonth();
  if (meses < 0 || (meses === 0 && hoy.getDate() < nace.getDate())) {
    anos--;
    meses += 12;
  }
  if (hoy.getDate() < nace.getDate()) {
    meses--;
  }
  if (anos === 0) {
    return `${meses} meses`;
  }
  if (meses === 0) {
    return `${anos} años`;
  }
  return `${anos} años, ${meses} meses`;
}

function formatearFechaCorta(fechaStr: string) {
  if (!fechaStr) return "--";
  try {
    const parts = fechaStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]} / ${parts[1]} / ${parts[0]}`;
    }
    return fechaStr;
  } catch (e) {
    return fechaStr;
  }
}

export default async function CarneVacunalPublicPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { slug, token } = resolvedParams;

  const data = await getCarneDigitalPublico(slug, token);
  if (!data) notFound();

  const { tenant, config, paciente, vacunas } = data;
  const primaryColor = config?.color_primario || "#0A4D5C";

  // Emparejamiento de vacunas con la matriz canónica
  const claimedIds = new Set<string>();
  const totalDosis = vacunas.length;
  const vacunasOtras = getVacunasOtras(vacunas, claimedIds);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: portrait;
            margin: 8mm 10mm;
          }
          body {
            background: white !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hidden {
            display: none !important;
          }
          .carne-container {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .carne-header {
            background: #0A4D5C !important;
            color: white !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}} />

      <div className="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-3 sm:px-6" style={{ fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        
        {/* TOP BAR CON ACCIONES */}
        <div className="w-full max-w-5xl mb-4 flex justify-between items-center print-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
              <Syringe size={22} className="text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base leading-tight">
                {config?.nombre_doctor || tenant.nombre}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {config?.especialidad || "Pediatría y Puericultura • Esquema Oficial de Inmunización"}
              </p>
            </div>
          </div>

          <CarnePrintButton />
        </div>

        {/* CONTENEDOR PRINCIPAL TIPO TARJETA CLÍNICA */}
        <div className="w-full max-w-5xl bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200 carne-container">
          
          {/* ENCABEZADO INSTITUCIONAL */}
          <div
            className="carne-header p-6 sm:p-8 text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, #062b33 100%)`
            }}
          >
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold mb-2.5 border border-emerald-400/30">
                  <ShieldCheck size={14} /> Documento Clínico Oficial de Inmunización
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
                  Carné de Vacunación Pediátrica
                </h1>
                <p className="text-teal-100 text-sm font-medium">
                  {config?.nombre_doctor || "Dr. Carlos Torres"} • {config?.especialidad || "Pediatra • Infectólogo Pediatra"}
                </p>
                {config?.titulo_doctor && (
                  <p className="text-xs text-teal-200/80 mt-0.5 font-mono">
                    {config.titulo_doctor}
                  </p>
                )}
              </div>

              {/* CÓDIGO Y VALIDACIÓN */}
              <div className="text-left sm:text-right bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
                <p className="text-[11px] uppercase tracking-wider text-teal-200 font-bold mb-0.5">
                  Certificado Único Digital
                </p>
                <p className="font-mono text-xs text-white break-all max-w-[210px] font-semibold">
                  {paciente.token_acceso}
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-emerald-300 font-semibold">
                  <CheckCircle2 size={13} /> Verificado en Línea
                </div>
              </div>
            </div>
          </div>

          {/* DATOS DEL PACIENTE */}
          <div className="p-6 bg-slate-50/80 border-b border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Nombre del Paciente
                </span>
                <span className="text-base font-extrabold text-slate-900 block leading-tight">
                  {paciente.nombres} {paciente.apellidos}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Identificación
                </span>
                <span className="text-sm font-bold text-slate-800 block">
                  {paciente.tipo_documento} {paciente.documento}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Fecha Nacimiento / Edad
                </span>
                <span className="text-sm font-bold text-slate-800 block">
                  {paciente.fecha_nacimiento || "No registrada"}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({calcularEdadDetallada(paciente.fecha_nacimiento)})
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  EPS / Aseguradora
                </span>
                <span className="text-sm font-bold text-slate-800 block">
                  {paciente.eps || "Particular"}
                </span>
                <span className="text-[11px] font-semibold text-teal-700 block">
                  {totalDosis} {totalDosis === 1 ? "vacuna registrada" : "vacunas registradas"}
                </span>
              </div>
            </div>
          </div>

          {/* TABLA MATRIZ EXACTA DE 7 COLUMNAS */}
          <div className="p-4 sm:p-6 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs min-w-[760px] border border-slate-300">
              <thead>
                <tr className="bg-[#0A4D5C] text-white">
                  <th className="py-2.5 px-3 font-extrabold uppercase tracking-wider text-[11px] border border-slate-400/60 w-[22%]">
                    ME PROTEGE DE
                  </th>
                  <th className="py-2.5 px-2.5 font-extrabold uppercase tracking-wider text-[11px] border border-slate-400/60 w-[15%] text-center">
                    EDAD
                  </th>
                  <th className="py-2.5 px-2 font-extrabold uppercase tracking-wider text-[11px] border border-slate-400/60 w-[10%] text-center">
                    DOSIS
                  </th>
                  <th className="py-2.5 px-2.5 font-extrabold uppercase tracking-wider text-[11px] border border-slate-400/60 w-[14%] text-center">
                    FECHA DE APLICACIÓN
                  </th>
                  <th className="py-2.5 px-3 font-extrabold uppercase tracking-wider text-[11px] border border-slate-400/60 w-[15%]">
                    NOMBRE
                  </th>
                  <th className="py-2.5 px-2 font-extrabold uppercase tracking-wider text-[11px] border border-slate-400/60 w-[12%] text-center">
                    NÚMERO DE LOTE
                  </th>
                  <th className="py-2.5 px-2.5 font-extrabold uppercase tracking-wider text-[11px] border border-slate-400/60 w-[12%] text-center">
                    FIRMA DEL VACUNADOR
                  </th>
                </tr>
              </thead>
              <tbody>
                {ESQUEMA_MATRIZ_CANONICO.map((cat) => {
                  return cat.filas.map((fila, rowIndex) => {
                    const app = matchAplicacionFila(vacunas, fila, claimedIds);
                    const isApplied = !!app;

                    return (
                      <tr 
                        key={fila.id}
                        className={isApplied ? "bg-emerald-50/25 hover:bg-emerald-50/40" : "hover:bg-slate-50/60"}
                      >
                        {/* COLUMNA 1: ME PROTEGE DE (ROWSPAN) */}
                        {rowIndex === 0 && (
                          <td
                            rowSpan={cat.filas.length}
                            className={`p-3 font-black align-middle border border-slate-300 ${cat.badgeBg} ${cat.badgeText} text-xs tracking-tight uppercase leading-snug`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{cat.titulo}</span>
                            </div>
                          </td>
                        )}

                        {/* COLUMNA 2: EDAD */}
                        <td className="p-2 border border-slate-300 text-center font-medium text-slate-700 text-[11.5px]">
                          {fila.edad}
                        </td>

                        {/* COLUMNA 3: DOSIS */}
                        <td className="p-2 border border-slate-300 text-center font-black text-slate-900 text-xs">
                          {fila.dosis}
                        </td>

                        {/* COLUMNA 4: FECHA DE APLICACIÓN */}
                        <td className="p-2 border border-slate-300 text-center font-bold text-[11.5px]">
                          {isApplied ? (
                            <span className="text-slate-900 font-extrabold">
                              {formatearFechaCorta(app.fecha_aplicacion)}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono text-xs">-- / -- / ----</span>
                          )}
                        </td>

                        {/* COLUMNA 5: NOMBRE */}
                        <td className="p-2 border border-slate-300 text-[11.5px]">
                          {isApplied ? (
                            <span className="font-extrabold text-teal-950 block leading-tight">
                              {app.nombre_vacuna}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px] block">
                              ({fila.biologicoSugerido})
                            </span>
                          )}
                        </td>

                        {/* COLUMNA 6: NÚMERO DE LOTE */}
                        <td className="p-2 border border-slate-300 text-center">
                          {isApplied ? (
                            <span className="font-mono bg-slate-100 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded border border-slate-200 inline-block">
                              {app.numero_lote || "S/L"}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono text-xs">--</span>
                          )}
                        </td>

                        {/* COLUMNA 7: FIRMA DEL VACUNADOR */}
                        <td className="p-2 border border-slate-300 text-center text-[11px]">
                          {isApplied ? (
                            <div className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100/60 px-2 py-0.5 rounded-full text-[10.5px]">
                              <Check size={12} className="text-emerald-700" />
                              <span>{app.profesional_nombre || config?.nombre_doctor || "Dr. Carlos Torres"}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">--</span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })}

                {/* FILAS DE "OTRAS VACUNAS" (Dengue, Covid, Meningo B, etc.) */}
                {vacunasOtras.length > 0 ? (
                  vacunasOtras.map((otra, idx) => (
                    <tr key={otra.id || idx} className="bg-emerald-50/25">
                      {idx === 0 && (
                        <td
                          rowSpan={vacunasOtras.length}
                          className="p-3 font-black align-middle border border-slate-300 bg-slate-100 text-slate-900 text-xs tracking-tight uppercase leading-snug"
                        >
                          OTRAS
                        </td>
                      )}
                      <td className="p-2 border border-slate-300 text-center font-medium text-slate-700 text-[11.5px]">
                        {otra.edad_aplicacion || "--"}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-black text-slate-900 text-xs">
                        {otra.dosis || "Única"}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-bold text-[11.5px] text-slate-900">
                        {formatearFechaCorta(otra.fecha_aplicacion)}
                      </td>
                      <td className="p-2 border border-slate-300 text-[11.5px] font-extrabold text-teal-950">
                        {otra.nombre_vacuna}
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        <span className="font-mono bg-slate-100 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded border border-slate-200 inline-block">
                          {otra.numero_lote || "S/L"}
                        </span>
                      </td>
                      <td className="p-2 border border-slate-300 text-center text-[11px]">
                        <div className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100/60 px-2 py-0.5 rounded-full text-[10.5px]">
                          <Check size={12} className="text-emerald-700" />
                          <span>{otra.profesional_nombre || config?.nombre_doctor || "Dr. Carlos Torres"}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 font-black align-middle border border-slate-300 bg-slate-100 text-slate-700 text-xs tracking-tight uppercase">
                      OTRAS
                    </td>
                    <td className="p-2 border border-slate-300 text-center text-slate-400 text-xs">--</td>
                    <td className="p-2 border border-slate-300 text-center text-slate-400 text-xs">--</td>
                    <td className="p-2 border border-slate-300 text-center text-slate-300 font-mono text-xs">-- / -- / ----</td>
                    <td className="p-2 border border-slate-300 text-slate-400 italic text-[11px]">(Dengue / Otras)</td>
                    <td className="p-2 border border-slate-300 text-center text-slate-300 font-mono text-xs">--</td>
                    <td className="p-2 border border-slate-300 text-center text-slate-300 text-xs">--</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* SELLO Y FIRMA MÉDICA DIGITAL */}
          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-bold text-2xl shadow-sm flex-shrink-0">
                  <ShieldCheck size={32} className="text-emerald-300" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 leading-tight">
                    {config?.nombre_doctor || tenant.nombre}
                  </h4>
                  <p className="text-xs text-slate-600 font-medium">
                    {config?.especialidad || "Pediatra • Infectólogo Pediatra"}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {config?.titulo_doctor || "Médico Certificado • Carné de Inmunización"}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-bold mt-1 inline-flex items-center gap-1">
                    <CheckCircle2 size={13} /> Firma y Registro Sanitario Válido
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-500 space-y-1">
                <p>Emitido electrónicamente conforme a los estándares de <strong>HubMed Health Cloud</strong>.</p>
                <p>Válido como constancia legal de esquema de vacunación ante instituciones educativas y de salud.</p>
                <p className="font-mono text-[10.5px] text-slate-400">
                  Hash de Verificación: {paciente.token_acceso}
                </p>
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="bg-slate-100 p-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-slate-200 print-hidden">
            <span className="text-xs text-slate-500 text-center sm:text-left">
              Para validar o verificar la autenticidad de este carné, escanee el código QR o consulte el enlace oficial del consultorio.
            </span>
            <CarnePrintButton />
          </div>

        </div>

        {/* DISCLAIMER */}
        <p className="mt-6 text-xs text-slate-400 text-center max-w-xl print-hidden">
          Este carné digital es un documento clínico oficial con trazabilidad de lotes biológicos y profesionales autorizados.
        </p>

      </div>
    </>
  );
}

