import type { JobHandler } from "@/lib/worker/handlers";
import { ApiError } from "@/lib/worker/errors";

// jobs has no client write policy and no public endpoint accepts this kind.
// Only the service role / rollback SQL test can enqueue this fixture.
const testThrow: JobHandler = async (_admin, job) => {
  const payload = job.payload;
  if (!payload || typeof payload.status !== "number") {
    throw new Error("test_throw: numeric status is required.");
  }
  throw new ApiError(payload.status, "test response", "test handler failure\nsecond line");
};

export default testThrow;
