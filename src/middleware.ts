import { mediaSessionEpoch } from "@/lib/auth/media-session-epoch";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { adminRequestAllowed, adminNotFoundResponse } from "@/lib/auth/admin-access";
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
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const allowed=await adminRequestAllowed(user?.id,async()=>supabase.from("profiles").select("role").eq("id",user!.id).maybeSingle());
    if(!allowed)return adminNotFoundResponse(session.response);
  }
  if (!user && PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return session.apply(NextResponse.redirect(new URL("/sign-in", request.url)));
  }
  // The worker can bind a new document before its priority SSR image arrives.
  // getUser above already validated Auth; this reads the local cookie session,
  // sends only UUID metadata, and performs no additional Auth network request.
  if (user) {
    try {
      const {data: {session: authenticated}} = await supabase.auth.getSession();
      const identity = mediaSessionEpoch(authenticated);
      if (identity?.userId === user.id) {
        session.response.headers.set("x-mfa-media-user", identity.userId);
        session.response.headers.set("x-mfa-media-session", identity.epoch);
      }
    } catch { /* Unknown identity leaves private caching disabled. */ }
  }
  return session.response;
}

export const config = {
  matcher: ["/", "/search/:path*", "/days/:path*", "/profile/:path*", "/admin/:path*"],
};
