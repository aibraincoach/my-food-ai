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
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  if (userId) {
    request.headers.set(VERIFIED_USER_HEADER, userId);
    session.refreshRequestHeaders();
  }
  session.cookies.setAll([verifiedUserCookie(userId, request.nextUrl.protocol === "https:")]);
  const pathname = request.nextUrl.pathname;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const allowed = await adminRequestAllowed(
      userId ?? undefined,
      async () => supabase.from("profiles").select("role").eq("id", userId!).maybeSingle(),
    );
    if(!allowed)return adminNotFoundResponse(session.response);
  }
  if (!userId && PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return session.apply(NextResponse.redirect(new URL("/sign-in", request.url)));
  }
  const postPath = pathname.match(/^\/posts\/([^/]+)\/?$/);
  if (userId && postPath && !request.headers.get("RSC")) {
    const allowed = await postRequestAllowed(userId, postPath[1], () => supabase.from("posts")
      .select("id,user_id").eq("id", postPath[1]).eq("user_id", userId).is("deleted_at", null).maybeSingle());
    if (!allowed) return adminNotFoundResponse(session.response);
  }
  if (userId) {
    try {
      const {data: {session: authenticated}} = await supabase.auth.getSession();
      const identity = mediaSessionEpoch(authenticated);
      if (identity?.userId === userId) {
        session.response.headers.set("x-mfa-media-user", identity.userId);
        session.response.headers.set("x-mfa-media-session", identity.epoch);
      }
    } catch { /* Unknown identity leaves private caching disabled. */ }
  }
  if (pathname === "/" && userId) {
    session.response.headers.set("Cache-Control", "private, no-store");
  }
  return session.response;
}

export const config = {
  matcher: ["/", "/search/:path*", "/days/:path*", "/profile/:path*", "/posts/:path*", "/admin/:path*"],
};
