import { NextResponse } from "next/server";

const NAMES = [
  "MODEL_API_KEY",
  "FDC_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
] as const;

// Returns which production variable names are set (never values).
export function GET() {
  const result: Record<string, boolean> = {};
  for (const name of NAMES) {
    result[name] = (process.env[name] ?? "").length > 0;
  }
  return NextResponse.json(result);
}
