#!/usr/bin/env node
// Development queue inspector: node scripts/worker-local.mjs
// Prints queued/running depth and the oldest waiting job. Draining itself
// happens through GET /api/jobs/tick (item 7) once the app runs.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envLocal = join(root, ".env.local");
if (existsSync(envLocal)) {
  for (const line of readFileSync(envLocal, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2];
  }
}

// Importing this module is side-effect free apart from loading missing env names.
export async function drainOnce(admin, handlers) {
  const { tsImport } = await import("tsx/esm/api");
  const worker = await tsImport("../src/lib/worker/drain.ts", import.meta.url);
  return worker.drainOnce(admin, handlers);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error("worker-local: Supabase URL/secret key missing from .env.local.");
  process.exit(1);
}

const { createClient } = await import("@supabase/supabase-js");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const [{ count: queued }, { count: running }, { data: oldest }] = await Promise.all([
  admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "queued"),
  admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "running"),
  admin.from("jobs").select("id,kind,created_at,attempts").eq("status", "queued").order("created_at").limit(1),
]);
console.log(JSON.stringify({ queued: queued ?? 0, running: running ?? 0, oldest: oldest?.[0] ?? null }));

}
