import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import NoticiasList from "./NoticiasList";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DynamicNoticiasPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Load tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, nombre")
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (!tenant) notFound();

  // Load configuration and articles
  const [configRes, postsRes] = await Promise.all([
    supabase.from("configuracion_portal").select("nombre_doctor, color_primario, color_acento").eq("tenant_id", tenant.id).single(),
    supabase.from("noticias_posts").select("id,titulo,resumen,emoji,categoria,created_at,slug,publicado,imagen_portada_url").eq("tenant_id", tenant.id).eq("publicado", true).order("created_at", { ascending: false }),
  ]);

  const config = configRes.data;
  const posts = postsRes.data ?? [];

  const primaryColor = config?.color_primario || "#0A4D5C";
  const accentColor = config?.color_acento || "#00D4AA";

  return (
    <NoticiasList
      tenantSlug={slug}
      nombreDoctor={config?.nombre_doctor || tenant.nombre}
      primaryColor={primaryColor}
      accentColor={accentColor}
      posts={posts.map(p => ({
        id: p.id,
        slug: p.slug,
        emoji: p.emoji || "📄",
        category: p.categoria || "Académico",
        date: p.created_at ? new Date(p.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "",
        readTime: "5 min",
        title: p.titulo,
        excerpt: p.resumen || "",
        imagenPortadaUrl: p.imagen_portada_url || "",
        featured: false
      }))}
    />
  );
}
