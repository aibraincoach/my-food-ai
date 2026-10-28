// Fixture job kinds for the queue tests. They are passed to drainOnce explicitly; the production
// registry (src/lib/worker/handlers.ts) never contains them.
import { ApiError } from "../../src/lib/worker/errors.ts";

export const testHandlers = {
  // Rows of this kind are inserted by service-role SQL only.
  test_noop: async () => {},
  test_throw: async (_admin, job) => {
    const payload = job.payload;
    if (!payload || typeof payload.status !== "number") throw new Error("test_throw: numeric status is required.");
    throw new ApiError(payload.status, "test response", "test handler failure\nsecond line");
  },
};
