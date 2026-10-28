import assert from "node:assert/strict";
import test from "node:test";

test("transport failures are retriable, including when wrapped by fetch", async () => {
  const { isRetriable, ioError } = await import("../src/lib/worker/errors.ts");
  assert.equal(isRetriable(Object.assign(new Error("timed out"), { name: "TimeoutError" })), true);
  for (const code of ["ECONNRESET", "ECONNREFUSED", "UND_ERR_CONNECT_TIMEOUT"]) {
    assert.equal(isRetriable({ code }), true, code);
    assert.equal(isRetriable(new TypeError("fetch failed", { cause: { code } })), true, `${code} via cause`);
    assert.equal(isRetriable(ioError("storage failed", { message: `read ${code}` }, 0)), true, `${code} via ioError`);
  }
  assert.equal(isRetriable({ code: "ENOENT" }), false);
  assert.equal(isRetriable(new Error("invalid input")), false);
});
