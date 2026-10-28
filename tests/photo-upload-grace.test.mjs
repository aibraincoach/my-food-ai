// node --import tsx --test tests/photo-upload-grace.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { isRetriable } from "../src/lib/worker/errors.ts";
import { loadFirstPhoto, photoStillUploading, UPLOAD_GRACE_MS } from "../src/lib/pipeline/analyze.ts";

const notFound = { message: "Object not found" };
const now = Date.parse("2026-10-28T12:00:00Z");
const ago = (ms) => new Date(now - ms).toISOString();

test("a missing object is the upload still in flight only in the first minute", () => {
  assert.equal(photoStillUploading(notFound, ago(1300), now), true);
  assert.equal(photoStillUploading(notFound, ago(UPLOAD_GRACE_MS - 1), now), true);
  assert.equal(photoStillUploading(notFound, ago(UPLOAD_GRACE_MS + 1), now), false);
  assert.equal(photoStillUploading({ message: "permission denied" }, ago(1000), now), false);
  assert.equal(photoStillUploading(notFound, undefined, now), false);
  assert.equal(photoStillUploading(notFound, new Date(now + 5000).toISOString(), now), false); // clock skew is not a grace
});

function dbFor(createdAt) {
  return createClient("https://fixture.invalid", "fixture-key", { global: { fetch: async (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname.includes("/rest/v1/post_media")) return new Response(JSON.stringify({ storage_path: "owner/post/0.jpg", width: 10, height: 10 }));
    if (url.pathname.includes("/rest/v1/posts")) return new Response(JSON.stringify({ user_id: "owner", created_at: createdAt }));
    assert.ok(url.pathname.includes("/storage/v1/object/"));
    return new Response(JSON.stringify({ statusCode: "404", error: "not_found", message: "Object not found" }), { status: 400 });
  } } });
}

test("the worker retries a photo that is not readable right after creation", async () => {
  await assert.rejects(loadFirstPhoto(dbFor(new Date(Date.now() - 2000).toISOString()), "post"), (error) => isRetriable(error) && /not readable yet/.test(error.message));
});

test("a photo that is still missing after the grace period fails for good", async () => {
  await assert.rejects(loadFirstPhoto(dbFor(new Date(Date.now() - 5 * 60_000).toISOString()), "post"), (error) => !isRetriable(error) && /photo download failed/.test(error.message));
});
