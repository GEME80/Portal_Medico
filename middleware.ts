import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Public path prefixes that do NOT require authentication or routing logic
const PUBLIC_PREFIXES = ["/_next", "/api", "/favicon.ico"];
const RESERVED_SLUGS = new Set(["superadmin", "api", "admin", "_next", "favicon.ico", "auth"]);

// Fast in-memory cache for tenant slug/domain to ID mapping (eliminates 150-300ms DB latency on client navigations)
const tenantCache = new Map<string, { id: string; slug?: string; timestamp: number }>();
const TENANT_CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass static assets and Next.js internal endpoints
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Also bypass files with standard image/asset extensions
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/i.test(pathname)) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // 2. Initialize Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 3. Resolve Tenant (by Custom Domain or path slug) with fast cache
  const hostname = request.headers.get("host") || "";
  
  const getFallbackHost = () => {
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (process.env.VERCEL_URL) return process.env.VERCEL_URL;
    return "portal-medico-five.vercel.app";
  };

  const mainDomain = process.env.NEXT_PUBLIC_APP_URL 
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).host 
    : getFallbackHost();
  
  const isVercelDomain = hostname.endsWith(".vercel.app");
  const isLocalhost = hostname.startsWith("localhost");
  const isCustomDomain = hostname !== mainDomain && !isVercelDomain && !isLocalhost;

  let tenantSlug: string | null = null;
  let tenantId: string | null = null;

  if (isCustomDomain) {
    const cacheKey = `domain:${hostname}`;
    const cached = tenantCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp < TENANT_CACHE_TTL_MS)) {
      tenantSlug = cached.slug || null;
      tenantId = cached.id;
    } else {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, slug")
        .eq("custom_domain", hostname)
        .maybeSingle();

      if (tenant) {
        tenantSlug = tenant.slug;
        tenantId = tenant.id;
        tenantCache.set(cacheKey, { id: tenant.id, slug: tenant.slug, timestamp: now });
      }
    }
  } else {
    // Path-based tenant: /[slug]/...
    const segments = pathname.split("/").filter(Boolean);
    const potentialSlug = segments[0];

    if (potentialSlug && !RESERVED_SLUGS.has(potentialSlug)) {
      tenantSlug = potentialSlug;
      const cacheKey = `slug:${potentialSlug}`;
      const cached = tenantCache.get(cacheKey);
      const now = Date.now();

      if (cached && (now - cached.timestamp < TENANT_CACHE_TTL_MS)) {
        tenantId = cached.id;
      } else {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("id")
          .eq("slug", potentialSlug)
          .maybeSingle();

        if (tenant) {
          tenantId = tenant.id;
          tenantCache.set(cacheKey, { id: tenant.id, timestamp: now });
        }
      }
    }
  }

  // 4. Retrieve current authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  // 5. Handle Suspension (Except if the user is a superadmin, allowing supervision)
  // Suspended status is handled visually inside layouts for a better UX (modal popup overlay)
  const isSuperadminUser = user?.email?.toLowerCase() === process.env.SUPERADMIN_EMAIL?.toLowerCase() || user?.email?.toLowerCase() === "gerkof@gmail.com" || user?.app_metadata?.role === "superadmin";

  // 6. Access Control: Protect Superadmin routes
  const isSuperadminRoute = pathname.startsWith("/superadmin");
  const isSuperadminLogin = pathname === "/superadmin/login";

  if (isSuperadminRoute && !isSuperadminLogin) {
    if (!user) {
      const loginUrl = new URL("/superadmin/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isSuperadminUser) {
      const loginUrl = new URL("/superadmin/login", request.url);
      loginUrl.searchParams.set("error", "no_autorizado");
      return NextResponse.redirect(loginUrl);
    }
  }

  // 7. Access Control: Protect Tenant Admin routes
  // Path-based admin: /[slug]/admin/*
  // Domain-based admin: /admin/* (if using custom domain)
  let isAdminRoute = false;
  if (isCustomDomain) {
    isAdminRoute = pathname.startsWith("/admin");
  } else if (tenantSlug) {
    isAdminRoute = pathname.startsWith(`/${tenantSlug}/admin`);
  }

  if (isAdminRoute) {
    if (!user) {
      const slugForLogin = tenantSlug || "admin";
      const loginUrl = new URL(`/${slugForLogin}/login`, request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Strict Multi-Tenant validation: check if the user's JWT tenant_id matches the requested tenant
    if (!isSuperadminUser && tenantId && user.app_metadata?.tenant_id !== tenantId) {
      return new NextResponse("Acceso no autorizado: El tenant de la sesión no coincide con la ruta solicitada.", { status: 403 });
    }

    // Role-based route protection: personal administrativo no puede acceder a rutas médicas ni gobernanza
    const userRole = user.app_metadata?.role;
    if (userRole === 'recepcion') {
      const isRestrictedForAdminStaff = 
        pathname.includes('/admin/reportes') ||
        pathname.includes('/admin/personalizar') ||
        pathname.includes('/admin/equipo') ||
        pathname.includes('/historia');

      if (isRestrictedForAdminStaff) {
        const redirectUrl = new URL(`/${tenantSlug || 'admin'}/admin`, request.url);
        redirectUrl.searchParams.set("alerta", "restringido_medico");
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // 8. Custom Domain Rewriting
  if (isCustomDomain && tenantSlug) {
    // If it's a custom domain and not a reserved routing prefix
    // rewrite internally so Next.js treats /path as /[slug]/path
    const rewrittenUrl = new URL(`/${tenantSlug}${pathname}`, request.url);
    return NextResponse.rewrite(rewrittenUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
