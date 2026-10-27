// Prompt files for Muse Spark (item 9). Markdown instructions beside
// their JSON schemas; loaded at startup and typed. Each file is read
// with an explicit static path so Next's file tracing bundles the
// assets into the serverless function.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function readPrompt(name: string): string {
  return readFileSync(join(here, "spark", name), "utf8");
}

function readSchema(name: string): Record<string, unknown> {
  return JSON.parse(readPrompt(name)) as Record<string, unknown>;
}

export const identifyPrompt: string = readPrompt("identify.md");
export const identifySchema: Record<string, unknown> =
  readSchema("identify.schema.json");
