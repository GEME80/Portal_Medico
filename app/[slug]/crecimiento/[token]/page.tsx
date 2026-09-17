import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurvasDigitalPublico } from "@/lib/actions/clinical-actions";
import CurvasDigitalClient from "@/components/CurvasDigitalClient";

interface PageProps {
  params: Promise<{ slug: string; token: string }> | { slug: string; token: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug, token } = resolvedParams;
  const data = await getCurvasDigitalPublico(slug, token);
  if (!data) return { title: "Curvas de Crecimiento OMS" };

  const nombrePaciente = `${data.paciente.nombres} ${data.paciente.apellidos}`.trim();
  const nombreDoctor = data.config?.nombre_doctor || data.tenant.nombre;
  return {
    title: `Curvas de Crecimiento OMS - ${nombrePaciente} | ${nombreDoctor}`,
    description: `Gráficas y evaluación nutricional oficial OMS (Resolución 2465/2016 MinSalud) para ${nombrePaciente}. Atendido por ${nombreDoctor}.`,
  };
}

export default async function CurvasCrecimientoPublicPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { slug, token } = resolvedParams;

  const data = await getCurvasDigitalPublico(slug, token);
  if (!data) notFound();

  return <CurvasDigitalClient data={data} />;
}
