import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const code = url.searchParams.get("code");
  if (code) {
    const cookieStore: { name: string; value: string }[] = [];
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value } of cookiesToSet) {
              cookieStore.push({ name, value });
            }
          },
        },
      }
    );
    await supabase.auth.exchangeCodeForSession(code);
    const response = NextResponse.redirect(new URL("/", request.url));
    for (const { name, value } of cookieStore) {
      response.cookies.set(name, value);
    }
    return response;
  }
  return NextResponse.redirect(new URL("/sign-in", request.url));
}
