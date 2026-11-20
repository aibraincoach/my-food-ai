import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const code = url.searchParams.get("code");
  if (code) {
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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/sign-in?error=${encodeURIComponent("Sign-in failed. Try again.")}`, request.url)
      );
    }
    const response = NextResponse.redirect(new URL("/", request.url));
    for (const { name, value, options } of cookieStore) {
      response.cookies.set(name, value, options);
    }
    return response;
  }
  const message = url.searchParams.get("error") === "access_denied"
    ? "Sign-in was cancelled."
    : "Sign-in failed. Try again.";
  return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(message)}`, request.url));
}
