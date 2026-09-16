import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EquipoClient from './EquipoClient';
import { getMiembrosEquipo } from '@/lib/actions/equipo-actions';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EquipoPage({ params }: Props) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${cleanSlug}/login`);
  }

  // Verificación estricta de rol: personal administrativo no puede administrar el equipo
  const userRole = user.app_metadata?.role;
  if (userRole === 'recepcion') {
    redirect(`/${cleanSlug}/admin?alerta=restringido_medico`);
  }

  // Cargar tenant y miembros concurrentemente
  const adminSupabase = createAdminClient();
  const [tenantRes, miembrosRes] = await Promise.all([
    adminSupabase
      .from('tenants')
      .select('id')
      .eq('slug', cleanSlug)
      .maybeSingle(),
    getMiembrosEquipo(cleanSlug),
  ]);

  const tenant = tenantRes.data;
  let primaryColor = '#0A4D5C';
  let accentColor = '#00D4AA';

  if (tenant) {
    const { data: config } = await adminSupabase
      .from('configuracion_portal')
      .select('color_primario, color_acento')
      .eq('tenant_id', tenant.id)
      .maybeSingle();

    if (config?.color_primario) primaryColor = config.color_primario;
    if (config?.color_acento) accentColor = config.color_acento;
  }

  const miembros = miembrosRes.data || [];

  return (
    <EquipoClient
      tenantSlug={cleanSlug}
      initialMiembros={miembros}
      primaryColor={primaryColor}
      accentColor={accentColor}
    />
  );
}
