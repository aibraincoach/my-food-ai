import { NextResponse } from "next/server";

// This check runs in middleware, before a page can start streaming. The page
// repeats authorization and RLS still controls every trace query.
export async function adminRequestAllowed(
  userId: string | undefined,
  readRole: () => Promise<{ data: { role: string } | null; error: unknown }>,
): Promise<boolean> {
  if (!userId) return false;
  try {
    const { data, error } = await readRole();
    return !error && data?.role === "admin";
  } catch {
    return false;
  }
}

export function adminNotFoundResponse(sessionResponse: NextResponse): NextResponse {
  const response = new NextResponse("Not found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" },
  });
  for (const cookie of sessionResponse.cookies.getAll()) response.cookies.set(cookie);
  return response;
}
