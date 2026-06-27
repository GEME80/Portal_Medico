"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Revalidates the tenant's public pages to clear the Next.js static cache
 * and immediately display new or updated publications.
 */
export async function revalidateTenantPagesAction(slug: string) {
  if (!slug) return { success: false, error: "Slug is required" };
  try {
    // Revalidate the entire tenant layout tree to catch all sub-routes
    revalidatePath(`/${slug}`, "layout");
    // Also revalidate specific key pages explicitly
    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/noticias`);
    revalidatePath(`/${slug}/vacunas`);
    revalidatePath(`/${slug}/sobre-el-doctor`);
    return { success: true };
  } catch (err: any) {
    console.error("Revalidation failed:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Uploads an image to the Supabase storage bucket 'portal-media'
 * using the Admin client to bypass any client-side RLS policy limitations.
 */
export async function uploadImageAction(formData: FormData) {
  const file = formData.get("file") as File;
  const tenantId = formData.get("tenantId") as string;
  const folder = formData.get("folder") as string;

  if (!file || !tenantId || !folder) {
    return { success: false, error: "Archivo, Tenant ID y Carpeta son requeridos." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return {
      success: false,
      error: "Error de configuración: Claves de Supabase (URL o Service Role Key) no configuradas en el servidor.",
    };
  }

  const supabase = createAdminClient();
  const MAX_SIZE = 1024 * 1024 * 10; // 10 MB

  try {
    // Pre-upload file size check
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    if (fileBuffer.byteLength > MAX_SIZE) {
      return { success: false, error: `La imagen es demasiado grande (${(fileBuffer.byteLength / (1024 * 1024)).toFixed(1)} MB). El límite es 10 MB. Intenta comprimir o reducir la resolución.` };
    }

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;

    const exists = buckets?.some((b) => b.id === "portal-media");
    if (!exists) {
      const { error: createError } = await supabase.storage.createBucket("portal-media", {
        public: true,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"],
        fileSizeLimit: MAX_SIZE,
      });
      if (createError) throw createError;
    } else {
      // Update bucket config if it already exists (e.g. increase size limit)
      await supabase.storage.updateBucket("portal-media", {
        public: true,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"],
        fileSizeLimit: MAX_SIZE,
      });
    }

    const fileExt = file.name.split(".").pop() || "png";
    const fileName = `${tenantId}/${folder}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage.from("portal-media").upload(fileName, fileBuffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from("portal-media").getPublicUrl(fileName);
    return { success: true, publicUrl };
  } catch (err: any) {
    console.error("Upload error:", err);
    // Better error message for common issues
    if (err.statusCode === "413" || err.status === 413 || (err.message && err.message.includes("exceeded"))) {
      return { success: false, error: "La imagen excede el tamaño máximo permitido (10 MB). Intenta comprimir la imagen o usar una de menor resolución." };
    }
    return { success: false, error: err.message || "Error desconocido al subir archivo." };
  }
}

// ──────────────────────────────────────────────────────────────
// CATEGORY ACTIONS
// ──────────────────────────────────────────────────────────────

export interface Categoria {
  id?: string;
  tenant_id?: string;
  nombre: string;
  emoji: string;
  color: string;
  orden: number;
}

/** List all categories for a tenant */
export async function getCategoriasAction(tenantId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("noticias_categorias")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("orden", { ascending: true });

  if (error) {
    return { success: false, error: error.message, data: [] };
  }

  // Si la tabla está vacía, hacemos un Auto-Seed sincronizando con las publicaciones existentes
  if (!data || data.length === 0) {
    // 1. Obtener todas las categorías únicas que ya están siendo usadas en publicaciones
    const { data: posts } = await supabase
      .from("noticias_posts")
      .select("categoria")
      .eq("tenant_id", tenantId);
      
    const usedCategories = Array.from(new Set(posts?.map(p => p.categoria).filter(Boolean) || []));
    
    // 2. Categorías por defecto con sus estilos
    const defaultCats = [
      { nombre: "Académico",     emoji: "📚", color: "teal",    orden: 0 },
      { nombre: "Prevención",    emoji: "🛡️", color: "emerald", orden: 1 },
      { nombre: "Epidemiología", emoji: "📊", color: "rose",    orden: 2 },
      { nombre: "HubMed",        emoji: "🔬", color: "amber",   orden: 3 },
    ];
    
    const toInsert = [];
    let orderCounter = 0;
    
    // Insertamos las por defecto siempre
    for (const dc of defaultCats) {
      toInsert.push({ ...dc, orden: orderCounter++, tenant_id: tenantId });
    }
    
    // Insertamos cualquier otra categoría personalizada que el usuario ya tuviera
    const defaultNames = defaultCats.map(c => c.nombre.toLowerCase());
    for (const uc of usedCategories) {
      if (!defaultNames.includes(uc.toLowerCase())) {
        toInsert.push({
          nombre: uc,
          emoji: "📂", // emoji genérico
          color: "teal", // color genérico
          orden: orderCounter++,
          tenant_id: tenantId
        });
      }
    }
    
    if (toInsert.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from("noticias_categorias")
        .insert(toInsert)
        .select();
        
      if (!insertErr && inserted) {
        return { success: true, data: inserted };
      }
    }
  }

  return { success: true, data: data || [] };
}

/** Create or update a category */
export async function saveCategoriaAction(payload: Categoria & { tenantId: string }) {
  const supabase = createAdminClient();
  const { tenantId, id, ...rest } = payload as any;

  let error;
  if (id) {
    const { error: err } = await supabase
      .from("noticias_categorias")
      .update({ ...rest, tenant_id: tenantId })
      .eq("id", id)
      .eq("tenant_id", tenantId);
    error = err;
  } else {
    const { error: err } = await supabase
      .from("noticias_categorias")
      .insert({ ...rest, tenant_id: tenantId });
    error = err;
  }

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Delete a category (only if no posts use it) */
export async function deleteCategoriaAction(id: string, tenantId: string, nombre: string) {
  const supabase = createAdminClient();

  // Check if any posts use this category
  const { count } = await supabase
    .from("noticias_posts")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("categoria", nombre);

  if ((count ?? 0) > 0) {
    return {
      success: false,
      error: `No se puede eliminar: ${count} publicación(es) usan esta categoría. Reasígnalas primero.`,
    };
  }

  const { error } = await supabase
    .from("noticias_categorias")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
