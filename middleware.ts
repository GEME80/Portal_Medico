import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/favicon.ico", "/_next", "/api", "/superadmin"];
const RESERVED_SLUGS = new Set(["superadmin", "api", "admin", "_next", "favicon.ico"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass static assets and reserved paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Create Supabase client with cookie handling
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

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  // Extract slug from path: /[slug]/admin/* → protect admin routes
  const segments = pathname.split("/").filter(Boolean);
  const slug = segments[0];
  const isAdminRoute = segments[1] === "admin";

  // Protect admin routes — redirect to login if not authenticated
  if (slug && !RESERVED_SLUGS.has(slug) && isAdminRoute && !user) {
    const loginUrl = new URL(`/${slug}/login`, request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect superadmin routes
  if (pathname.startsWith("/superadmin") && !user) {
    const loginUrl = new URL("/superadmin/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
