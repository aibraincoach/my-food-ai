// node --import tsx --test tests/camera-flip.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

function fakeStream() {
  const track = { stopped: false, stop() { this.stopped = true; } };
  return { track, getTracks: () => [track] };
}

function stubCamera(handler) {
  const seen = [];
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { mediaDevices: { getUserMedia: async (constraints) => { seen.push(constraints.video.facingMode); return handler(seen.length, constraints.video.facingMode); } } },
  });
  return seen;
}
const busy = () => new DOMException("busy", "NotReadableError");

test("a device that needs the old camera released switches after the fallback", async () => {
  const { openCamera } = await import("../src/lib/media/camera.ts");
  const first = fakeStream();
  const second = fakeStream();
  const seen = stubCamera((n) => {
    if (n === 1) return first;
    if (n === 2) { assert.equal(first.track.stopped, false); throw busy(); } // acquire-first fails while the old camera is held
    assert.equal(first.track.stopped, true); // the fallback released it before asking again
    return second;
  });
  const camera = await openCamera("environment");
  assert.equal(await camera.flip(), second);
  assert.deepEqual(seen, ["environment", "user", "user"]);
  assert.equal(camera.stream, second);
  assert.equal(second.track.stopped, false);
});

test("when the switch cannot succeed the previous camera is reopened and the error is retryable", async () => {
  const { openCamera, CameraFlipError } = await import("../src/lib/media/camera.ts");
  const first = fakeStream();
  const restored = fakeStream();
  const retried = fakeStream();
  const seen = stubCamera((n, facing) => {
    if (n === 1) return first;
    if (facing === "user" && n <= 3) throw busy();
    if (n === 4) return restored; // previous camera back
    return retried; // later retry of the switch
  });
  const camera = await openCamera("environment");
  await assert.rejects(camera.flip(), (error) => error instanceof CameraFlipError && error.retryable === true && error.stream === restored);
  assert.deepEqual(seen, ["environment", "user", "user", "environment"]);
  assert.equal(camera.stream, restored);
  assert.equal(restored.track.stopped, false);
  // Facing was restored, so a retry asks for the same side again and releases the restored stream on success.
  assert.equal(await camera.flip(), retried);
  assert.equal(seen[4], "user");
  assert.equal(restored.track.stopped, true);
});

test("if the previous camera cannot be reopened either, the failure is not a retryable flip error", async () => {
  const { openCamera, CameraFlipError } = await import("../src/lib/media/camera.ts");
  const first = fakeStream();
  stubCamera((n) => { if (n === 1) return first; throw busy(); });
  const camera = await openCamera("environment");
  await assert.rejects(camera.flip(), (error) => !(error instanceof CameraFlipError) && /Camera unavailable/.test(error.message));
});

test("a failure that releasing cannot fix leaves the working camera running", async () => {
  const { openCamera, CameraFlipError } = await import("../src/lib/media/camera.ts");
  const first = fakeStream();
  const second = fakeStream();
  const seen = stubCamera((n) => {
    if (n === 1) return first;
    if (n === 2) throw new DOMException("denied", "NotAllowedError");
    return second;
  });
  const camera = await openCamera("environment");
  await assert.rejects(camera.flip(), (error) => error instanceof CameraFlipError && error.stream === undefined);
  assert.equal(first.track.stopped, false);
  assert.equal(camera.stream, first);
  assert.deepEqual(seen, ["environment", "user"]); // no second attempt, no restore
  assert.equal(await camera.flip(), second); // a later flip can still succeed
  assert.equal(first.track.stopped, true);
});
