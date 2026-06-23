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
    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/noticias`);
    revalidatePath(`/${slug}/vacunas`);
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
  const folder = formData.get("folder") as string; // 'logo' or 'posts'

  if (!file || !tenantId || !folder) {
    return { success: false, error: "Archivo, Tenant ID y Carpeta son requeridos." };
  }

  const supabase = createAdminClient();
  try {
    // 1. Ensure public bucket 'portal-media' exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;

    const exists = buckets?.some(b => b.id === 'portal-media');
    if (!exists) {
      const { error: createError } = await supabase.storage.createBucket('portal-media', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'],
        fileSizeLimit: 1024 * 1024 * 5 // 5MB
      });
      if (createError) throw createError;
    }

    // 2. Upload file
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${tenantId}/${folder}/${Date.now()}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabase.storage
      .from('portal-media')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('portal-media')
      .getPublicUrl(fileName);

    return { success: true, publicUrl };
  } catch (err: any) {
    console.error("Upload error:", err);
    return { success: false, error: err.message || "Error desconocido al subir archivo." };
  }
}
