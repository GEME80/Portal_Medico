import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function CarneVacunalPublicPage({ params }: { params: { slug: string, token: string } }) {
  const supabase = await createClient();

  // Buscar el paciente por token y asegurarse de que pertenezca al tenant (slug)
  const { data: tenant } = await supabase.from('tenants').select('id, nombre').eq('slug', params.slug).single();
  if (!tenant) return notFound();

  const { data: paciente } = await supabase
    .from('pacientes')
    .select('*')
    .eq('token_acceso', params.token)
    .eq('tenant_id', tenant.id)
    .single();

  if (!paciente) return notFound();

  // Aquí obtendríamos el historial de vacunas (ej: kardex, o aplicación de vacunas)
  // Por ahora mostramos los datos básicos
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-100">
        
        {/* Cabecera del Carné */}
        <div className="bg-teal-600 p-8 text-white text-center">
          <h1 className="text-3xl font-bold mb-2">Carné de Vacunación Digital</h1>
          <p className="text-teal-100">{tenant.nombre}</p>
        </div>

        {/* Datos del Paciente */}
        <div className="p-8">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">Paciente</p>
              <p className="text-lg font-semibold text-slate-800">{paciente.nombres} {paciente.apellidos}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">Documento</p>
              <p className="text-lg font-semibold text-slate-800">{paciente.tipo_documento} {paciente.documento}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">Fecha de Nacimiento</p>
              <p className="text-lg font-semibold text-slate-800">{paciente.fecha_nacimiento}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">EPS</p>
              <p className="text-lg font-semibold text-slate-800">{paciente.eps || 'No registrada'}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Esquema Aplicado</h2>
            
            {/* Placeholder de historial de vacunas */}
            <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-slate-500">
                El historial detallado de vacunación se listará aquí.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-6 flex justify-center border-t border-slate-100">
          <button 
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Guardar como PDF
          </button>
        </div>

      </div>
      
      <p className="mt-8 text-sm text-slate-400 text-center max-w-md">
        Este documento es generado automáticamente por HubMed Platform y es válido como comprobante digital de vacunación.
      </p>
    </div>
  );
}
