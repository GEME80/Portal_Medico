import { notFound } from "next/navigation";
import { getCarneDigitalPublico } from "@/lib/actions/vacunas-actions";
import CarnePrintButton from "@/components/CarnePrintButton";
import { ShieldCheck, Syringe, Calendar, User, FileText, CheckCircle2 } from "lucide-react";

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

function formatearFecha(fechaStr: string) {
  if (!fechaStr) return "--";
  try {
    const parts = fechaStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
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
  const accentColor = config?.color_acento || "#00D4AA";

  const totalDosis = vacunas.length;
  const ultimaVacuna = vacunas.length > 0 ? vacunas[vacunas.length - 1] : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
          }
          .print-hidden {
            display: none !important;
          }
          .carne-container {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            padding: 0 !important;
          }
          .carne-card {
            break-inside: avoid !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
          }
          .carne-header {
            background: #0A4D5C !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}} />

      <div className="min-h-screen bg-slate-100 flex flex-col items-center py-10 px-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
        
        {/* TOP BAR / LOGO */}
        <div className="w-full max-w-4xl mb-6 flex justify-between items-center print-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
              <Syringe size={22} className="text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base leading-tight">
                {config?.nombre_doctor || tenant.nombre}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {config?.especialidad || "Pediatría y Vacunación"}
              </p>
            </div>
          </div>

          <CarnePrintButton />
        </div>

        {/* MAIN DOCUMENT CARD */}
        <div className="w-full max-w-4xl bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-200 carne-container">
          
          {/* HEADER INSTITUCIONAL */}
          <div
            className="carne-header p-8 sm:p-10 text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, #062b33 100%)`
            }}
          >
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold mb-3 border border-emerald-400/30">
                  <ShieldCheck size={14} /> Documento Oficial de Inmunización
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
                  Carné de Vacunación Digital
                </h1>
                <p className="text-teal-100 text-sm sm:text-base font-medium">
                  {config?.nombre_doctor ? `${config.nombre_doctor} • ` : ""}{config?.especialidad || tenant.nombre}
                </p>
                {config?.titulo_doctor && (
                  <p className="text-xs text-teal-200/80 mt-1 font-mono">
                    {config.titulo_doctor}
                  </p>
                )}
              </div>

              <div className="text-left sm:text-right bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
                <p className="text-xs uppercase tracking-wider text-teal-200 font-bold mb-1">
                  Código Único Digital
                </p>
                <p className="font-mono text-xs text-white break-all max-w-[200px]">
                  {paciente.token_acceso}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-300 font-semibold">
                  <CheckCircle2 size={14} /> Verificado en Línea
                </div>
              </div>
            </div>
          </div>

          {/* DATOS DEL PACIENTE */}
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-6">
              <User size={20} className="text-teal-700" />
              <h2 className="text-lg font-extrabold text-slate-800">
                Información del Paciente
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="col-span-2 sm:col-span-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Paciente
                </span>
                <span className="text-base font-extrabold text-slate-800 block">
                  {paciente.nombres} {paciente.apellidos}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Identificación
                </span>
                <span className="text-base font-bold text-slate-800 block">
                  {paciente.tipo_documento} {paciente.documento}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Nacimiento / Edad
                </span>
                <span className="text-base font-bold text-slate-800 block">
                  {paciente.fecha_nacimiento}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  ({calcularEdadDetallada(paciente.fecha_nacimiento)})
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  EPS / Aseguradora
                </span>
                <span className="text-base font-bold text-slate-800 block">
                  {paciente.eps || "Particular"}
                </span>
              </div>
            </div>

            {/* KPI STATS BAR */}
            <div className="mt-6 pt-6 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase">Total Dosis Aplicadas</span>
                <p className="text-2xl font-black text-teal-800 m-0">{totalDosis}</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase">Última Vacunación</span>
                <p className="text-sm font-extrabold text-slate-800 m-0 truncate">
                  {ultimaVacuna ? formatearFecha(ultimaVacuna.fecha_aplicacion) : "Sin registros"}
                </p>
                {ultimaVacuna && (
                  <p className="text-xs text-slate-500 truncate">{ultimaVacuna.nombre_vacuna}</p>
                )}
              </div>

              <div className="col-span-2 sm:col-span-1 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Estado del Carné</span>
                  <p className="text-sm font-extrabold text-emerald-700 m-0">Vigente y Verificado</p>
                </div>
              </div>
            </div>
          </div>

          {/* HISTORIAL / TARJETAS DE VACUNACIÓN */}
          <div className="p-8 sm:p-10">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Syringe size={20} className="text-teal-700" />
                <h2 className="text-xl font-extrabold text-slate-800">
                  Esquema de Vacunación Administrado
                </h2>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                {vacunas.length} {vacunas.length === 1 ? "registro" : "registros"}
              </span>
            </div>

            {vacunas.length === 0 ? (
              <div className="text-center py-14 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Syringe size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-base font-bold text-slate-600 mb-1">
                  Aún no se han registrado vacunas en este carné digital.
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  El médico o equipo asistencial ingresará las dosis aplicadas en las consultas de seguimiento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vacunas.map((vac, idx) => (
                  <div
                    key={vac.id || idx}
                    className="carne-card bg-slate-50/70 border border-slate-200 rounded-2xl p-5 relative overflow-hidden transition-all hover:shadow-md hover:bg-white"
                  >
                    {/* Badge Dosis y Origen */}
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-teal-800 text-white">
                        {vac.dosis}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {vac.origen === "institucional" ? "🏥 Aplicada en Consultorio" : "📋 Antecedente Externo"}
                      </span>
                    </div>

                    {/* Nombre Biológico */}
                    <h3 className="text-base font-extrabold text-slate-900 mb-1">
                      {vac.nombre_vacuna}
                    </h3>

                    {vac.enfermedad_prevenida && (
                      <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Previene: <span className="font-semibold text-slate-700">{vac.enfermedad_prevenida}</span>
                      </p>
                    )}

                    {/* Detalle Técnico */}
                    <div className="bg-white rounded-xl p-3 border border-slate-100 text-xs text-slate-600 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Fecha:</span>
                        <strong className="text-slate-800 font-bold">{formatearFecha(vac.fecha_aplicacion)}</strong>
                      </div>

                      {vac.numero_lote && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Lote:</span>
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-800">
                            {vac.numero_lote}
                          </span>
                        </div>
                      )}

                      {vac.laboratorio && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Laboratorio:</span>
                          <span className="font-semibold text-slate-700">{vac.laboratorio}</span>
                        </div>
                      )}

                      {vac.via_administracion && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Vía:</span>
                          <span className="text-slate-700">{vac.via_administracion} {vac.sitio_aplicacion ? `(${vac.sitio_aplicacion})` : ""}</span>
                        </div>
                      )}

                      {vac.edad_aplicacion && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Edad al aplicar:</span>
                          <span className="text-slate-700">{vac.edad_aplicacion}</span>
                        </div>
                      )}

                      {vac.profesional_nombre && (
                        <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5">
                          <span className="text-slate-400 font-medium">Profesional:</span>
                          <span className="font-semibold text-teal-800">{vac.profesional_nombre}</span>
                        </div>
                      )}
                    </div>

                    {vac.observaciones && (
                      <p className="mt-2.5 text-[11px] text-slate-400 italic">
                        Nota: {vac.observaciones}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* SELLO Y FIRMA MÉDICA DIGITAL */}
            <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 flex-shrink-0">
                  <ShieldCheck size={36} />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                    {config?.nombre_doctor || tenant.nombre}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {config?.especialidad || "Especialista en Vacunación"}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {config?.titulo_doctor || "Profesional Médico Certificado"}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">
                    ✓ Firma y Aval Médico Digital
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-400 space-y-1">
                <p>Generado a través de <strong>HubMed Health Cloud</strong></p>
                <p>Válido como constancia de esquema de inmunización infantil y de adultos.</p>
                <p className="font-mono text-[10px] text-slate-400">
                  Hash de Seguridad: {paciente.token_acceso?.slice(0, 18)}...
                </p>
              </div>
            </div>

          </div>

          {/* FOOTER ACTIONS */}
          <div className="bg-slate-50 p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-200 print-hidden">
            <span className="text-xs text-slate-500 text-center sm:text-left">
              Para validar este carné, comparta el enlace o escanee el código oficial provisto por el consultorio.
            </span>
            <CarnePrintButton />
          </div>

        </div>

        {/* DISCLAIMER */}
        <p className="mt-8 text-xs text-slate-400 text-center max-w-lg print-hidden">
          Este carné digital es un documento clínico institucional emitido bajo estándares sanitarios de interoperabilidad. Conserva validez legal ante instituciones educativas y de salud.
        </p>

      </div>
    </>
  );
}
