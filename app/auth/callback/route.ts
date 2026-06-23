import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Component — cookies are read-only
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;
      const role = user.app_metadata?.role;
      const tenantSlug = user.app_metadata?.tenant_slug;

      // Redirect based on role and metadata
      if (role === "superadmin" || user.email === process.env.SUPERADMIN_EMAIL) {
        return NextResponse.redirect(`${origin}/superadmin`);
      } else if (role === "admin" && tenantSlug) {
        return NextResponse.redirect(`${origin}/${tenantSlug}/admin/personalizar`);
      }
    }
  }

  // Return to home or fallback path
  return NextResponse.redirect(`${origin}${next}`);
}
