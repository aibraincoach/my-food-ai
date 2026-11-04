import { verifiedUserCookie } from "@/lib/auth/verified-cookie";
import { VERIFIED_USER_HEADER } from "@/lib/auth/verified-user-header";
import { mediaSessionEpoch } from "@/lib/auth/media-session-epoch";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { adminRequestAllowed, adminNotFoundResponse } from "@/lib/auth/admin-access";
import { postRequestAllowed } from "@/lib/auth/post-access";
import { sessionCookieBridge } from "@/lib/auth/session-cookies";

const PROTECTED = ["/", "/search", "/days", "/profile", "/posts"];

export async function middleware(request: NextRequest) {
  request.headers.delete(VERIFIED_USER_HEADER);
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
  console.info(`auth verify middleware ${request.nextUrl.pathname}`);
  if (user) {
    request.headers.set(VERIFIED_USER_HEADER, user.id);
    session.refreshRequestHeaders();
  }
  session.cookies.setAll([verifiedUserCookie(user?.id ?? null, request.nextUrl.protocol === "https:")]);
  const pathname = request.nextUrl.pathname;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const allowed=await adminRequestAllowed(user?.id,async()=>supabase.from("profiles").select("role").eq("id",user!.id).maybeSingle());
    if(!allowed)return adminNotFoundResponse(session.response);
  }
  if (!user && PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return session.apply(NextResponse.redirect(new URL("/sign-in", request.url)));
  }
  // A Suspense notFound() after streaming starts keeps HTTP 200. Check only
  // owner metadata here so foreign direct links return a real private 404.
  const postPath = pathname.match(/^\/posts\/([^/]+)\/?$/);
  if (user && postPath) {
    const allowed = await postRequestAllowed(user.id, postPath[1], () => supabase.from("posts")
      .select("id,user_id").eq("id", postPath[1]).eq("user_id", user.id).is("deleted_at", null).maybeSingle());
    if (!allowed) return adminNotFoundResponse(session.response);
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
  if (pathname === "/" && user) {
    // Responsive image preloads belong in HTML: HTTP Link headers cannot
    // select a density candidate and can fetch the base photo as well.
    session.response.headers.set("Cache-Control", "private, no-store");
  }
  return session.response;
}

export const config = {
  matcher: ["/", "/search/:path*", "/days/:path*", "/profile/:path*", "/posts/:path*", "/admin/:path*"],
};
