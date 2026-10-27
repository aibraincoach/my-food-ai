// node --env-file=.env.local --test tests/retry-policy.test.mjs
// Exercise the real worker with a SQL transport so every write, including
// installation of this pending migration, lives in ONE rolled-back transaction.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { register } from "tsx/esm/api";
import { register as registerCjs } from "tsx/cjs/api";

registerCjs();
register();

const sqlString = (value) => "'" + String(value).replaceAll("'", "''") + "'";

async function session() {
  assert.ok(process.env.SUPABASE_DB_URL, "SUPABASE_DB_URL is required; this test must run against Postgres");
  const database = new URL(process.env.SUPABASE_DB_URL);
  const child = spawn("psql", ["-X", "-qAt", "-v", "ON_ERROR_STOP=1"], {
    env: {
      ...process.env,
      PGHOST: database.hostname,
      PGPORT: database.port || "5432",
      PGDATABASE: decodeURIComponent(database.pathname.slice(1)),
      PGUSER: decodeURIComponent(database.username),
      PGPASSWORD: decodeURIComponent(database.password),
      PGSSLMODE: database.searchParams.get("sslmode") || "require",
      PGCONNECT_TIMEOUT: "10",
    },
    stdio: ["pipe", "pipe", "pipe"],
  });
  const lines = createInterface({ input: child.stdout });
  let pending;
  let diagnostics = "";
  child.stderr.on("data", (data) => { diagnostics += data.toString(); });
  child.on("error", (error) => pending?.reject(error));
  child.on("exit", (code) => pending?.reject(new Error(`psql exited ${code}: ${diagnostics}`)));
  lines.on("line", (line) => {
    if (!pending) return;
    if (line === pending.marker) {
      const done = pending;
      pending = undefined;
      done.resolve(done.lines.join("\n"));
    } else pending.lines.push(line);
  });
  return {
    query(sql) {
      assert.equal(pending, undefined, "one SQL operation at a time");
      return new Promise((resolve, reject) => {
        const marker = randomUUID();
        pending = { marker, lines: [], resolve, reject };
        child.stdin.write(sql + "\n\\echo " + marker + "\n");
      });
    },
    async close() {
      if (child.exitCode !== null) return;
      child.stdin.end("rollback;\n\\q\n");
      await once(child, "exit");
    },
  };
}

test("classified failures, delayed claims, third-attempt limit and worker-only access", { timeout: 30_000 }, async () => {
  const { drainOnce } = await import("../src/lib/worker/drain.ts");
  const { ApiError, isRetriable } = await import("../src/lib/worker/errors.ts");
  assert.equal(isRetriable(new ApiError(400, "bad input")), false);
  assert.equal(isRetriable(new ApiError(404, "missing")), false);
  assert.equal(isRetriable(new ApiError(429, "busy")), true);
  assert.equal(isRetriable(new ApiError(503, "unavailable")), true);
  assert.equal(isRetriable(Object.assign(new Error("timeout"), { name: "AbortError" })), true);
  assert.equal(isRetriable({ code: "ETIMEDOUT" }), true);
  assert.equal(isRetriable({ cause: { code: "ETIMEDOUT" } }), true);
  assert.equal(isRetriable(new Error("invalid input")), false);

  const db = await session();
  try {
    await db.query("begin; set local lock_timeout = '5s'; set local statement_timeout = '10s'; lock public.jobs in access exclusive mode;");
    const installed = await db.query("select exists(select 1 from information_schema.columns where table_schema='public' and table_name='jobs' and column_name='run_after');");
    if (installed === "f") await db.query(readFileSync(new URL("../supabase/migrations/0005_jobs_retry.sql", import.meta.url), "utf8"));
    const owned = await db.query("select to_regprocedure('public.claim_owned_job(timestamptz)') is not null;");
    if (owned === "f") {
      const items = await db.query("select to_regprocedure('public.mark_post_ready(uuid)') is not null;");
      if (items === "f") await db.query(readFileSync(new URL("../supabase/migrations/0007_post_items_supersede.sql", import.meta.url), "utf8"));
      await db.query(readFileSync(new URL("../supabase/migrations/0007b_comment_corrections.sql", import.meta.url), "utf8"));
    }
    // Hide other jobs only inside this transaction. The table lock prevents
    // another worker seeing this state or competing for the fixture job.
    await db.query("update public.jobs set status='finished' where status='queued';");
    const user = randomUUID(), post = randomUUID();
    await db.query(`insert into auth.users(id) values (${sqlString(user)});
      insert into public.profiles(id,handle) values (${sqlString(user)}, ${sqlString("retry_" + user)});
      insert into public.posts(id,user_id,status) values (${sqlString(post)},${sqlString(user)},'processing');`);
    const grants = await db.query("select has_function_privilege('authenticated', 'public.claim_job(timestamptz)', 'EXECUTE') or has_function_privilege('anon', 'public.fail_job(uuid,text,boolean)', 'EXECUTE');");
    assert.equal(grants, "f", "clients cannot claim/fail server jobs");
    await db.query("set local role authenticated; select set_config('request.jwt.claims', " + sqlString(JSON.stringify({ sub: user, role: "authenticated" })) + ", true);");
    assert.equal(await db.query("select count(*) from public.jobs;"), "0", "ordinary account cannot read job payloads");
    await db.query("reset role; set local role service_role;");

    // Only the transport is adapted; claims and failure transitions run the
    // actual production RPCs, and drainOnce loads the actual test_throw module.
    const admin = {
      async rpc(name, args = {}) {
        let sql;
        if (name === "claim_owned_job") sql = "select row_to_json(public.claim_owned_job());";
        else if (name === "fail_job") sql = `select public.fail_job(${sqlString(args.p_job_id)},${sqlString(args.p_message)},${args.p_retriable});`;
        else throw new Error("Unexpected RPC " + name);
        const output = await db.query(sql);
        return { data: name === "claim_owned_job" && output ? JSON.parse(output) : null, error: null };
      },
    };
    async function enqueue(status) {
      const job = randomUUID();
      await db.query(`update public.posts set status='processing',fail_reason=null where id=${sqlString(post)};
        insert into public.jobs(id,post_id,kind,payload) values (${sqlString(job)},${sqlString(post)},'test_throw',${sqlString(JSON.stringify({status}))});`);
      return job;
    }
    async function state(job) {
      return JSON.parse(await db.query(`select json_build_object('status',j.status,'attempts',j.attempts,'finished',j.finished_at is not null,'error',j.error,'future',j.run_after > clock_timestamp(),'delay',extract(epoch from j.run_after-clock_timestamp()),'post_status',p.status,'reason',p.fail_reason) from public.jobs j join public.posts p on p.id=j.post_id where j.id=${sqlString(job)};`));
    }
    const bad = await enqueue(400);
    assert.deepEqual(await drainOnce(admin), { processed: 1, failed: true });
    const badState = await state(bad);
    assert.equal(badState.status, "error");
    assert.equal(badState.attempts, 1);
    assert.equal(badState.finished, true);
    assert.equal(badState.post_status, "failed");
    assert.equal(badState.reason, "test handler failure");
    assert.match(badState.error, /second line/);

    const limited = await enqueue(429);
    await drainOnce(admin);
    let actual = await state(limited);
    assert.equal(actual.status, "queued");
    assert.equal(actual.attempts, 1);
    assert.equal(actual.finished, false);
    assert.equal(actual.future, true);
    assert.ok(actual.delay > 25 && actual.delay <= 30);
    assert.equal(actual.post_status, "processing");
    assert.equal(actual.reason, null);
    assert.deepEqual(await drainOnce(admin), { processed: 0, failed: false }, "future job is not claimed early");
    for (const attempt of [2, 3]) {
      await db.query(`update public.jobs set run_after=now()-interval '1 second' where id=${sqlString(limited)};`);
      await drainOnce(admin);
      actual = await state(limited);
      assert.equal(actual.attempts, attempt);
      if (attempt === 2) {
        assert.equal(actual.status, "queued");
        assert.ok(actual.delay > 55 && actual.delay <= 60);
      } else {
        assert.equal(actual.status, "error");
        assert.equal(actual.finished, true);
        assert.equal(actual.post_status, "failed");
        assert.equal(actual.reason, "test handler failure");
      }
    }
  } finally {
    await db.close();
  }
});
