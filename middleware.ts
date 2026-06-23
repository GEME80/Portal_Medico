import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Public path prefixes that do NOT require authentication or routing logic
const PUBLIC_PREFIXES = ["/_next", "/api", "/favicon.ico"];
const RESERVED_SLUGS = new Set(["superadmin", "api", "admin", "_next", "favicon.ico", "auth"]);

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

  // 3. Resolve Tenant (by Custom Domain or path slug)
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
  let isSuspended = false;

  if (isCustomDomain) {
    // Look up tenant slug by custom domain
    const { data: tenant } = await supabase
      .from("tenants")
      .select("slug, activo, estado_pago")
      .eq("custom_domain", hostname)
      .single();

    if (tenant) {
      tenantSlug = tenant.slug;
      if (!tenant.activo || tenant.estado_pago === "suspendido") {
        isSuspended = true;
      }
    }
  } else {
    // Path-based tenant: /[slug]/...
    const segments = pathname.split("/").filter(Boolean);
    const potentialSlug = segments[0];

    if (potentialSlug && !RESERVED_SLUGS.has(potentialSlug)) {
      tenantSlug = potentialSlug;
      
      // Look up tenant to check suspension state
      const { data: tenant } = await supabase
        .from("tenants")
        .select("activo, estado_pago")
        .eq("slug", potentialSlug)
        .single();

      if (tenant && (!tenant.activo || tenant.estado_pago === "suspendido")) {
        isSuspended = true;
      }
    }
  }

  // 4. Retrieve current authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  // 5. Handle Suspension (Except if the user is a superadmin, allowing supervision)
  const isSuperadminUser = user?.email === process.env.SUPERADMIN_EMAIL || user?.app_metadata?.role === "superadmin";

  if (isSuspended && !isSuperadminUser) {
    // If suspended and not superadmin, render suspended notice or 404
    // We rewrite to a generic /suspended route or return a 404 page
    // Let's rewrite to /suspended if we have a suspended page, or return 404
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Portal Suspendido</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Outfit', sans-serif;
            background-color: #0b0f19;
            color: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .container {
            max-width: 500px;
            padding: 40px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          }
          h1 {
            color: #ef4444;
            font-size: 28px;
            margin-top: 0;
          }
          p {
            font-size: 16px;
            color: #9ca3af;
            line-height: 1.6;
          }
          .icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🔒</div>
          <h1>Servicio Suspendido</h1>
          <p>Este portal médico no está disponible temporalmente por falta de pago.</p>
          <p>Si eres el administrador del sitio, ponte en contacto con soporte técnico para regularizar tu estado de suscripción.</p>
        </div>
      </body>
      </html>
      `,
      { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

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
      // Return 403 Forbidden if logged-in user is not superadmin
      return new NextResponse("Acceso no autorizado", { status: 403 });
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

  if (isAdminRoute && !user) {
    const slugForLogin = tenantSlug || "admin";
    const loginUrl = new URL(`/${slugForLogin}/login`, request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
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
