import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCarneDigitalPublico } from "@/lib/actions/vacunas-actions";
import CarneDigitalClient from "@/components/CarneDigitalClient";

interface PageProps {
  params: Promise<{ slug: string; token: string }> | { slug: string; token: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug, token } = resolvedParams;
  const data = await getCarneDigitalPublico(slug, token);
  if (!data) return { title: "Carné de Vacunación Digital" };

  const nombrePaciente = `${data.paciente.nombres} ${data.paciente.apellidos}`.trim();
  const nombreDoctor = data.config?.nombre_doctor || data.tenant.nombre;
  return {
    title: `Carné de Vacunación - ${nombrePaciente} | ${nombreDoctor}`,
    description: `Registro oficial y esquema de inmunizaciones pediátricas de ${nombrePaciente}. Certificado por ${nombreDoctor}.`,
  };
}

export default async function CarneVacunalPublicPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { slug, token } = resolvedParams;

  const data = await getCarneDigitalPublico(slug, token);
  if (!data) notFound();

  return <CarneDigitalClient data={data} />;
}
