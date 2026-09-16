import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Stethoscope, UserPlus } from 'lucide-react';

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
    <>
      {/* ── TOPBAR STICKY ── */}
      <div className="admin-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "rgba(10, 77, 92, 0.08)",
            color: "var(--doc-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Stethoscope size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="admin-topbar-title" style={{ margin: 0, lineHeight: 1.2 }}>Gestión de Equipo</h1>
            <p style={{ fontSize: "12px", color: "var(--slate-500)", margin: "2px 0 0" }}>
              Administra los accesos de tus recepcionistas y médicos auxiliares
            </p>
          </div>
        </div>
        <div className="admin-topbar-right">
          <button className="btn btn-emerald" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <UserPlus size={15} /> Invitar Miembro
          </button>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">

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
    </>
  );
}
