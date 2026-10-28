// node --import tsx --test tests/push-leave.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { leaveSession } from "../src/lib/push/leave.ts";
import { pushIsSigningOut } from "../src/lib/push/lifecycle.ts";

const redirect = () => Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/sign-in;307" });

test("a failing device cleanup does not stop the session from ending", async () => {
  let signedOut = 0;
  await assert.rejects(leaveSession({ detach: async () => { throw new Error("push service down"); }, signOut: async () => { signedOut++; throw redirect(); } }), /NEXT_REDIRECT/);
  assert.equal(signedOut, 1);
});

test("a hanging device cleanup is abandoned after the timeout and sign-out still runs", async () => {
  let signedOut = 0;
  const started = Date.now();
  await assert.rejects(leaveSession({ detach: () => new Promise(() => {}), signOut: async () => { signedOut++; throw redirect(); }, timeoutMs: 50 }), /NEXT_REDIRECT/);
  assert.equal(signedOut, 1);
  assert.ok(Date.now() - started < 2000);
});

test("a failed sign-out action restores the tab and reports failure instead of staying busy", async () => {
  const result = await leaveSession({ detach: async () => {}, signOut: async () => { throw new TypeError("network down"); } });
  assert.equal(result, "failed");
  assert.equal(pushIsSigningOut(), false);
});
