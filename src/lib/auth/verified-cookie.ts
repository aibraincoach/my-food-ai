// The server verified the user with Auth on a page response and tells the
// browser so through this cookie; the browser then makes no Auth request of
// its own. Data access never relies on it: every read runs under row-level
// security with the real session. Shared by the middleware and the browser.
export const VERIFIED_USER_COOKIE = "mfa-verified-user";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function verifiedUserCookie(userId: string | null, secure: boolean): { name: string; value: string; options: { path: string; sameSite: "lax"; secure: boolean; httpOnly: boolean; maxAge: number } } {
  return { name: VERIFIED_USER_COOKIE, value: userId ?? "", options: { path: "/", sameSite: "lax", secure, httpOnly: false, maxAge: userId ? 3600 : 0 } };
}
export function readVerifiedUserCookie(cookieHeader: string): string | null {
  const value = cookieHeader.split(";").map(pair=>pair.trim()).find(pair => pair.startsWith(`${VERIFIED_USER_COOKIE}=`))?.slice(VERIFIED_USER_COOKIE.length + 1) ?? null;
  return value && UUID.test(value) ? value : null;
}
