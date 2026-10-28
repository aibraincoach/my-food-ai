import assert from "node:assert/strict";
import test from "node:test";

function fakeStream() {
  const track = { stopped: false, stop() { this.stopped = true; } };
  return { track, getTracks: () => [track] };
}

function stubCamera(requests) {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { mediaDevices: { getUserMedia: async (constraints) => requests.shift()(constraints) } },
  });
}

test("a rejected flip keeps the working stream, restores facing and is retryable", async () => {
  const { openCamera, CameraFlipError } = await import("../src/lib/media/camera.ts");
  const first = fakeStream();
  const second = fakeStream();
  const seen = [];
  stubCamera([
    async (c) => { seen.push(c.video.facingMode); return first; },
    async (c) => { seen.push(c.video.facingMode); throw new DOMException("busy", "NotReadableError"); },
    async (c) => { seen.push(c.video.facingMode); return second; },
  ]);
  const camera = await openCamera("environment");
  await assert.rejects(camera.flip(), (error) => error instanceof CameraFlipError && error.retryable === true);
  assert.equal(camera.stream, first);
  assert.equal(first.track.stopped, false);
  // Retry asks for the same side again, then releases the old stream only on success.
  assert.equal(await camera.flip(), second);
  assert.deepEqual(seen, ["environment", "user", "user"]);
  assert.equal(first.track.stopped, true);
  assert.equal(second.track.stopped, false);
});
