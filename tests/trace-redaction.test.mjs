// node --import tsx --test tests/trace-redaction.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { traceText } from "../src/lib/trace/record.ts";

test("credentials typed into free text are redacted and ordinary meal text stays readable", () => {
  const out = traceText({ input: [{ content: [{ type: "input_text", text: "Caption: rice and beans. Authorization: Bearer abc123SECRETvalue and api_key=sk-live-999" }] }] });
  assert.match(out, /rice and beans/);
  assert.doesNotMatch(out, /abc123SECRETvalue|sk-live-999/);
});

test("a JSON reply string is inspected as a structure", () => {
  const out = traceText('{"items":[{"name":"rice"}],"api_key":"sk-hidden-123"}');
  assert.match(out, /rice/);
  assert.doesNotMatch(out, /sk-hidden-123/);
});

test("sensitive keys, binaries and URLs are still removed", () => {
  const out = traceText({ authorization: "Bearer x1234567", image_url: "data:image/png;base64,AAAA", note: "see https://example.com/a?sig=1", bytes: new Uint8Array([1, 2]) });
  assert.doesNotMatch(out, /x1234567|AAAA|example\.com/);
  assert.match(out, /URL omitted|omitted/);
});

test("a stalled trace store never holds back a finished call, and a failing call rethrows its own error", { timeout: 30000 }, async () => {
  const { createServer } = await import("node:http");
  const { recordCall, TRACE_WRITE_TIMEOUT_MS } = await import("../src/lib/trace/record.ts");
  const server = createServer(() => { /* never answers: the trace insert stalls */ });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const saved = { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.SUPABASE_SECRET_KEY };
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${server.address().port}`;
  process.env.SUPABASE_SECRET_KEY = "test-key";
  const originalError = console.error;
  console.error = () => {};
  try {
    const started = Date.now();
    assert.equal(await recordCall("fdc", "q", async () => "result"), "result");
    assert.ok(Date.now() - started < TRACE_WRITE_TIMEOUT_MS + 2000, "the successful result waited for the stalled write");
    const original = Object.assign(new Error("model failed"), { status: 503 });
    await assert.rejects(recordCall("fdc", "q", async () => { throw original; }), (error) => error === original);
  } finally {
    console.error = originalError;
    for (const [name, value] of [["NEXT_PUBLIC_SUPABASE_URL", saved.url], ["SUPABASE_SECRET_KEY", saved.key]]) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("passwords are redacted as keys, in serialized JSON, in quoted assignments and when multi-word", () => {
  for (const input of [
    { password: "hunter2" },
    '{"password":"hunter2"}',
    'Caption: password="hunter2"',
    "Caption: password=two word passphrase",
    "my passphrase: 'correct horse battery'",
    { user: { pwd: "hunter2" } },
  ]) {
    const out = traceText(input);
    assert.doesNotMatch(out, /hunter2|two word|correct horse/, JSON.stringify(input));
  }
  assert.match(traceText("Caption: password=hunter2, then rice and beans"), /credential omitted/);
});
