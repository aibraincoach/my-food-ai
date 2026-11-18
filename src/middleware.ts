import { verifiedUserCookie, VERIFIED_USER_COOKIE } from "@/lib/auth/verified-cookie";
import { VERIFIED_USER_HEADER } from "@/lib/auth/verified-user-header";
import { mediaSessionEpoch } from "@/lib/auth/media-session-epoch";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { adminRequestAllowed, adminNotFoundResponse } from "@/lib/auth/admin-access";
import { postRequestAllowed } from "@/lib/auth/post-access";
import { sessionCookieBridge } from "@/lib/auth/session-cookies";
import { FIRST_PHOTO_COOKIE, firstPhotoLinkHeader } from "@/lib/posts/first-photo-hint";

const PROTECTED = ["/", "/search", "/days", "/profile", "/posts"];

export async function middleware(request: NextRequest) {
  const previousUser = request.cookies.get(VERIFIED_USER_COOKIE)?.value;
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
  if (!userId || (previousUser && previousUser !== userId)) {
    session.cookies.setAll([{name:FIRST_PHOTO_COOKIE,value:'',options:{path:'/',maxAge:0,sameSite:'lax',secure:request.nextUrl.protocol==='https:'}}]);
  }
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
    // #222: ask for the last first photo before the shell's scripts; Home's own preload follows once the feed is read.
    const hint = request.cookies.get(FIRST_PHOTO_COOKIE)?.value;
    const started = performance.now();
    const link = await firstPhotoLinkHeader(hint, userId, (id, secret) => supabase.from('post_media')
      .select('id,kind,photo_secret,posts!inner(user_id,deleted_at)').eq('id',id).eq('photo_secret',secret)
      .eq('posts.user_id',userId).is('posts.deleted_at',null).abortSignal(AbortSignal.timeout(250)).maybeSingle());
    if(hint)session.response.headers.append('Server-Timing',`first-photo-ownership;dur=${(performance.now()-started).toFixed(1)}`);
    if (link) session.response.headers.append("Link", link);
    else if(hint)session.response.cookies.set(FIRST_PHOTO_COOKIE,'',{path:'/',maxAge:0,sameSite:'lax',secure:request.nextUrl.protocol==='https:'});
  }
  return session.response;
}

export const config = {
  matcher: ["/", "/search/:path*", "/days/:path*", "/profile/:path*", "/posts/:path*", "/admin/:path*"],
};
