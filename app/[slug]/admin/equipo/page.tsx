import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function EquipoPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${params.slug}/login`);
  }

  // Obtener miembros del equipo
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', params.slug).single();
  let miembros: any[] = [];
  
  if (tenant) {
    const { data } = await supabase
      .from('miembros_equipo')
      .select('*')
      .eq('tenant_id', tenant.id);
    if (data) miembros = data;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Equipo</h1>
          <p className="text-slate-500 mt-1">Administra los accesos de tus recepcionistas y médicos auxiliares.</p>
        </div>
        <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm">
          + Invitar Miembro
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        {miembros.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            Aún no has agregado a ningún miembro a tu consultorio. (El propietario/admin se maneja vía SuperAdmin).
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Usuario (UUID)</th>
                <th className="p-4 font-semibold">Rol Asignado</th>
                <th className="p-4 font-semibold">Fecha de Ingreso</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {miembros.map((miembro) => (
                <tr key={miembro.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-800 font-medium">
                    {miembro.user_id}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${miembro.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 
                        miembro.rol === 'recepcion' ? 'bg-blue-100 text-blue-800' : 
                        'bg-teal-100 text-teal-800'}`}>
                      {miembro.rol}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 text-sm">
                    {new Date(miembro.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-red-600 hover:text-red-900 text-sm font-medium">Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
