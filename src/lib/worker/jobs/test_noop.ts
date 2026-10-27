import type { JobHandler } from "@/lib/worker/handlers";
// Job insertion is service-role only; no public route accepts this kind.
const testNoop: JobHandler = async () => {};
export default testNoop;
