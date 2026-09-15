import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function FacturacionSuperAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/superadmin/login');
  }

  // Validar SuperAdmin (simplificado, usualmente se revisa app_metadata.role o el middleware lo hace)
  
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, nombre, slug, plan, estado_pago')
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Facturación y Cobranza SaaS</h1>
      <p className="text-slate-500 mb-8">Administración global de ingresos de HubMed Platform.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">MRR (Mensual)</h3>
          <p className="text-3xl font-bold text-teal-600 mt-2">$0 <span className="text-sm text-slate-400 font-normal">USD</span></p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Tenants Activos</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">
            {tenants?.filter(t => t.estado_pago === 'activo').length || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">En Mora</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {tenants?.filter(t => t.estado_pago === 'suspendido').length || 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
              <th className="p-4 font-semibold">Consultorio / Médico</th>
              <th className="p-4 font-semibold">Plan</th>
              <th className="p-4 font-semibold">Estado de Pago</th>
              <th className="p-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants?.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="p-4">
                  <div className="font-medium text-slate-800">{t.nombre}</div>
                  <div className="text-xs text-slate-500">{t.slug}.hubmed.app</div>
                </td>
                <td className="p-4 text-slate-600 capitalize">{t.plan || 'Básico'}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${t.estado_pago === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {t.estado_pago || 'activo'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-teal-600 hover:text-teal-900 text-sm font-medium mr-4">Ver Facturas</button>
                  {t.estado_pago === 'activo' ? (
                    <button className="text-red-600 hover:text-red-900 text-sm font-medium">Suspender</button>
                  ) : (
                    <button className="text-green-600 hover:text-green-900 text-sm font-medium">Reactivar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
