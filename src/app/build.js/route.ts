import { connection } from "next/server";

// The browser compares imported scripts during worker updates, even when an
// older cached shell is running page code from the previous deployment.
export async function GET() {
  await connection();
  return new Response(`self.BUILD=${JSON.stringify(process.env.NEXT_PUBLIC_BUILD ?? "dev")};`, {
    headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" },
  });
}
