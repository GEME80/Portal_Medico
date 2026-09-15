import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import BookingForm from "./BookingForm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicCitasPage({ params }: PageProps) {
  const { slug } = await params;
  const adminSupabase = createAdminClient();

  // Load tenant
  const { data: tenant } = await adminSupabase
    .from("tenants")
    .select("id, nombre, activo")
    .eq("slug", slug)
    .single();

  if (!tenant || !tenant.activo) notFound();

  // Load config
  const { data: config } = await adminSupabase
    .from("configuracion_portal")
    .select("nombre_doctor, especialidad, nombre_clinica, telefono, color_primario, color_acento, hero_badge_texto")
    .eq("tenant_id", tenant.id)
    .single();

  const doctorName = config?.nombre_doctor || tenant.nombre || "Doctor";
  const specialty = config?.especialidad || "Medicina General y Especializada";
  const clinicName = config?.nombre_clinica || "Consultorio Médico";
  const phone = config?.telefono || "";
  const primaryColor = config?.color_primario || "#0A4D5C";
  const accentColor = config?.color_acento || "#00D4AA";

  let calendarInstructions = "Por favor presentarse 10 minutos antes con su documento de identidad y exámenes previos.";
  if (config?.hero_badge_texto) {
    try {
      const parsed = typeof config.hero_badge_texto === "string"
        ? JSON.parse(config.hero_badge_texto)
        : config.hero_badge_texto;
      if (parsed?.agenda_config?.mensaje_instrucciones_calendario) {
        calendarInstructions = parsed.agenda_config.mensaje_instrucciones_calendario;
      }
    } catch (e) {
      // default
    }
  }

  return (
    <div style={{ minHeight: "80vh", padding: "40px 0 80px", background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)" }}>
      <BookingForm
        tenantSlug={slug}
        doctorName={doctorName}
        specialty={specialty}
        clinicName={clinicName}
        phone={phone}
        primaryColor={primaryColor}
        accentColor={accentColor}
        calendarInstructions={calendarInstructions}
      />
    </div>
  );
}
