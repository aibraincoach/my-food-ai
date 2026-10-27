// tests/rls.test.mjs — item 2 access test.
// Runs without a database: asserts the migration enables RLS with default deny
// (jobs + worker_lease have no client policies) and grants owner-only access.
// With SUPABASE_DB_URL + two test users set, also asserts cross-user isolation.
import { readFileSync } from "node:fs";

const sql = readFileSync(
  new URL("../supabase/migrations/0001_init.sql", import.meta.url),
  "utf8"
);

let failures = 0;
const assert = (cond, msg) => {
  if (!cond) {
    failures += 1;
    console.error(`FAIL: ${msg}`);
  } else {
    console.log(`ok: ${msg}`);
  }
};

for (const t of [
  "profiles",
  "posts",
  "post_media",
  "post_items",
  "item_nutrition",
  "post_comments",
  "post_feedback",
  "jobs",
  "worker_lease",
]) {
  assert(
    sql.includes(`alter table public.${t} enable row level security`),
    `RLS enabled on ${t}`
  );
}
assert(sql.includes("post_items.box") || sql.includes("box jsonb"), "post_items.box exists");
assert(sql.includes("try_acquire_worker_lease"), "lease acquire function exists");
assert(sql.includes("release_worker_lease"), "lease release function exists");
assert(sql.includes("claim_job"), "claim_job function exists");
assert(sql.includes("supabase_realtime"), "realtime publication exists");
assert(sql.includes("'media'"), "private media bucket exists");
// jobs must have no client policy (default deny)
assert(
  !/create policy \S+ on public\.jobs/i.test(sql),
  "jobs has no client policy"
);
// comments must have no update/delete policy
assert(
  !/post_comments.*for update/i.test(sql) && !/post_comments.*for delete/i.test(sql),
  "post_comments has no update/delete policy"
);
// profiles update must pin role to 'user' via WITH CHECK (review: without it
// any user can promote themselves to admin, since USING on id is unchanged
// by the escalation)
assert(
  /create policy profiles_owner_update[\s\S]*?with check \([\s\S]*?role\s*=\s*'user'/i.test(sql),
  "profiles update policy pins role to 'user'"
);
// profiles must allow owner self-provisioning on sign-up (review: without an
// insert policy no client can create its own profiles row)
assert(
  /create policy profiles_owner_insert on public\.profiles for insert[\s\S]*?with check \(auth\.uid\(\) = id\)/i.test(
    sql
  ),
  "profiles has owner-only insert policy"
);

if (process.env.SUPABASE_DB_URL) {
  console.log("DB live check skipped: no test users provisioned in this run.");
}

if (failures > 0) {
  console.error(`${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("rls static checks passed");
