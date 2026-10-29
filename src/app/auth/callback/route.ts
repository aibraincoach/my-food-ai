import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const magicLink = url.searchParams.get("type") === "magiclink";
  if (code || (tokenHash && magicLink)) {
    const cookieStore: { name: string; value: string; options?: object }[] = [];
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const cookie of cookiesToSet) {
              cookieStore.push(cookie);
            }
          },
        },
      }
    );
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: "magiclink" });
    if (error) {
      return NextResponse.redirect(
        new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }
    const response = NextResponse.redirect(new URL("/", request.url));
    for (const { name, value, options } of cookieStore) {
      response.cookies.set(name, value, options);
    }
    return response;
  }
  return NextResponse.redirect(new URL("/sign-in", request.url));
}
