// Prompt text and schema for Muse Spark (item 9). Both are statically
// imported so the Next.js bundle always carries them — no fs reads of
// loose files at runtime. Tune the text in ./spark/identify, never the
// worker.
import { identifyPrompt } from "./spark/identify";
import identifySchemaJson from "./spark/identify.schema.json";

export { identifyPrompt };
export const identifySchema: Record<string, unknown> =
  identifySchemaJson as Record<string, unknown>;
