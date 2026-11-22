import {isLocale} from '@/i18n/locales';
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
  request.headers.delete('x-mfa-shell-locale');
  // Only the anonymous worker shell accepts this explicit, non-credential
  // override. Return before constructing Auth or reading account data.
  if (request.nextUrl.pathname === '/shell') {
    const locale = request.nextUrl.searchParams.get('lang');
    const headers = new Headers(request.headers);
    if (isLocale(locale)) headers.set('x-mfa-shell-locale', locale);
    return NextResponse.next({request: {headers}});
  }
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
  // The OAuth return is a document load; RSC navigation/prefetch already passed
  // onboarding. Admin still checks its role on every request.
  let profile: {id: string; role: string} | null = null;
  if (userId && (!request.headers.get("RSC") || pathname === "/admin" || pathname.startsWith("/admin/"))) {
    try {
      const {data, error} = await supabase.from("profiles").select("id,role").eq("id", userId)
        .abortSignal(AbortSignal.timeout(8000)).maybeSingle();
      if (error) throw error;
      profile = data;
    } catch {
      return session.apply(new NextResponse("Your account could not be loaded. Try again.", {
        status: 503, headers: {"Cache-Control": "private, no-store", "Content-Type": "text/plain; charset=utf-8"},
      }));
    }
    if (!profile && pathname !== "/choose-handle") {
      return session.apply(NextResponse.redirect(new URL("/choose-handle", request.url)));
    }
    if (profile && pathname === "/choose-handle") {
      return session.apply(NextResponse.redirect(new URL("/", request.url)));
    }
  }
  if (!userId && pathname === "/choose-handle") {
    return session.apply(NextResponse.redirect(new URL("/welcome", request.url)));
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const allowed = await adminRequestAllowed(
      userId ?? undefined,
      async () => ({data: profile, error: null}),
    );
    if(!allowed)return adminNotFoundResponse(session.response);
  }
  if (!userId && PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return session.apply(NextResponse.redirect(new URL("/welcome", request.url)));
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
  matcher: ["/shell", "/", "/search/:path*", "/days/:path*", "/profile/:path*", "/posts/:path*", "/admin/:path*", "/choose-handle"],
};
