import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

type SessionCookie = { name: string; value: string; options: CookieOptions };

// A refresh must reach both the browser and this request's server render.
// Sending only Set-Cookie makes the render read the expired session again.
export function sessionCookieBridge(request: NextRequest) {
  const changed = new Map<string, SessionCookie>();
  let response = NextResponse.next({ request: { headers: request.headers } });
  const apply = (target: NextResponse) => {
    for (const { name, value, options } of changed.values()) target.cookies.set(name, value, options);
    return target;
  };
  return {
    get response() { return response; },
    apply,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies: SessionCookie[]) => {
        for (const cookie of cookies) {
          request.cookies.set(cookie.name, cookie.value);
          changed.set(cookie.name, cookie);
        }
        response = apply(NextResponse.next({ request: { headers: request.headers } }));
      },
    },
  };
}
