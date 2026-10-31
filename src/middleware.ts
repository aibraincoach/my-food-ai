import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sessionCookieBridge } from "@/lib/auth/session-cookies";

const PROTECTED = ["/", "/search", "/days", "/profile"];

export async function middleware(request: NextRequest) {
  const session = sessionCookieBridge(request);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: session.cookies,
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  if (!user && PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return session.apply(NextResponse.redirect(new URL("/sign-in", request.url)));
  }
  return session.response;
}

export const config = {
  matcher: ["/", "/search/:path*", "/days/:path*", "/profile/:path*"],
};
