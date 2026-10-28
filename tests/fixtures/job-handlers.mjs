// Fixture job kinds for the queue tests. They are passed to drainOnce explicitly; the production
// registry (src/lib/worker/handlers.ts) never contains them.
// This file imports nothing from src/: the queue tests load it before they register a TypeScript loader
// (npm run test:db runs plain node), so its error type only has to carry what the worker's classifier reads.
class FixtureApiError extends Error {
  constructor(status, body, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export const testHandlers = {
  // Rows of this kind are inserted by service-role SQL only.
  test_noop: async () => {},
  test_throw: async (_admin, job) => {
    const payload = job.payload;
    if (!payload || typeof payload.status !== "number") throw new Error("test_throw: numeric status is required.");
    throw new FixtureApiError(payload.status, "test response", "test handler failure\nsecond line");
  },
};
