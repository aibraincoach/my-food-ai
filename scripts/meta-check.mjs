// Item 1: one call each to sam-3.1, muse-spark-1.3 and
// muse-voice-transcribe-1.0. Prints status, record counts and boxes,
// where the JSON block sits, and the transcript. Results set the shape
// of items 8, 9 and 26. Reads MODEL_API_KEY from .env.local.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import {
  parseImageStream,
  recordsOfKind,
} from "@meta-sam/parser";

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    })
);
const MODEL_API_KEY = env.MODEL_API_KEY;
if (!MODEL_API_KEY) {
  console.error("meta-check: MODEL_API_KEY is not set in .env.local.");
  process.exit(1);
}
const BASE_URL = "https://api.meta.ai/v1";

function dataUrl(path) {
  const ext = path.endsWith(".png") ? "png" : "jpeg";
  return `data:image/${ext};base64,${readFileSync(path).toString("base64")}`;
}

async function checkSam(path) {
  const client = new OpenAI({ baseURL: BASE_URL, apiKey: MODEL_API_KEY });
  const stream = await client.responses.create({
    model: "sam-3.1",
    input: [
      {
        type: "message",
        role: "user",
        content: [
          { type: "input_text", text: "food item" },
          { type: "input_image", image_url: dataUrl(path) },
        ],
      },
    ],
    stream: true,
    metadata: { mask_encoding: "one_bit", include_confidence: "true" },
  });
  const parsed = parseImageStream(stream);
  for await (const {} of parsed) {
    // Drain; the result accumulates until the stream ends.
  }
  const result = await parsed.finalResult;
  const boxes = recordsOfKind(result.records, "box");
  const masks = recordsOfKind(result.records, "mask");
  console.log(`--- sam-3.1 ${path.split("/").pop()} ---`);
  console.log(`status: ${result.outcome.status}`);
  console.log(`records: ${result.records.length} (box: ${boxes.length}, mask: ${masks.length})`);
  for (const box of boxes.slice(0, 10)) {
    console.log(
      `box ${box.objectId}: left=${box.left} top=${box.top} right=${box.right} bottom=${box.bottom} confidence=${box.confidence ?? "absent"}`
    );
  }
  console.log(`diagnostics: ${result.diagnostics.length}`);
}

async function postJson(url, body, attempts = 3) {
  let last = null;
  for (let i = 0; i < attempts; i += 1) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MODEL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    last = { status: res.status, raw };
    // The gateway returns transient 404s with an empty body; retry those.
    if (res.ok && raw.length > 0) return last;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return last;
}

async function checkSpark(path) {
  const instructions = readFileSync(
    join(root, "src/lib/prompts/spark/identify.md"),
    "utf8"
  );
  const schema = JSON.parse(
    readFileSync(join(root, "src/lib/prompts/spark/identify.schema.json"), "utf8")
  );
  const res = await postJson(`${BASE_URL}/responses`, {
    model: "muse-spark-1.3",
    instructions,
    input: [
      {
        type: "message",
        role: "user",
        content: [
          { type: "input_text", text: "Caption: roast dinner. Regions: none." },
          { type: "input_image", image_url: dataUrl(path) },
        ],
      },
    ],
    text: { format: { type: "json_schema", name: "identify", schema, strict: true } },
    max_output_tokens: 2048,
  });
  console.log(`--- muse-spark-1.3 ${path.split("/").pop()} ---`);
  console.log(`http: ${res.status}`);
  const raw = res.raw;
  let payload = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    console.log(`non-JSON body: ${raw.slice(0, 200)}`);
    return;
  }
  console.log(`status: ${payload.status}`);
  if (payload.error) console.log(`error: ${JSON.stringify(payload.error)}`);
  let found = null;
  for (let i = 0; Array.isArray(payload.output) && i < payload.output.length; i += 1) {
    const item = payload.output[i];
    if (item.type !== "message" || !Array.isArray(item.content)) continue;
    for (let j = 0; j < item.content.length; j += 1) {
      const block = item.content[j];
      if (block.type === "output_text" && typeof block.text === "string" && found === null) {
        found = { path: `output[${i}].content[${j}].text`, text: block.text };
      }
    }
  }
  console.log(`json block: ${found ? found.path : "absent"}`);
  if (found) {
    try {
      const parsed = JSON.parse(found.text);
      console.log(`items: ${parsed.items?.length ?? "?"} summary: ${parsed.summary ?? "?"}`);
      console.log(JSON.stringify(parsed, null, 2).slice(0, 2000));
    } catch {
      console.log(`not JSON: ${found.text.slice(0, 500)}`);
    }
  }
  console.log(`usage: ${JSON.stringify(payload.usage ?? null)}`);
}

async function checkTranscribe(path) {
  const wav = readFileSync(path);
  const buildForm = () => {
    const fresh = new FormData();
    fresh.set(
      "request",
      new Blob(
        [JSON.stringify({ model: "muse-voice-transcribe-1.0", audioEncoding: "WAV", mode: "PUSH_TO_TALK" })],
        { type: "application/json" }
      )
    );
    fresh.set("audio", new Blob([wav], { type: "audio/wav" }), "tone.wav");
    return fresh;
  };
  let status = 0;
  let payload = null;
  for (let i = 0; i < 3; i += 1) {
    const res = await fetch(`${BASE_URL}/asr/transcribe?sessionId=meta-check-1`, {
      method: "POST",
      headers: { Authorization: `Bearer ${MODEL_API_KEY}`, Accept: "application/json" },
      body: buildForm(),
    });
    status = res.status;
    payload = await res.text().then((raw) => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    });
    // Transient gateway 404s carry an empty body; retry those.
    if (res.ok && payload !== null) break;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  console.log("--- muse-voice-transcribe-1.0 tone.wav ---");
  console.log(`http: ${status}`);
  console.log(`transcript: ${JSON.stringify(payload?.transcript ?? null)}`);
  console.log(`audioDurationMs: ${payload?.audioDurationMs ?? "absent"}`);
  console.log(`sessionId: ${payload?.sessionId ?? "absent"}`);
}

const fixtures = join(root, "scripts", "fixtures");
await checkSam(join(fixtures, "plate1.jpg"));
await checkSam(join(fixtures, "plate2.jpg"));
await checkSam(join(fixtures, "plate3.jpg"));
await checkSpark(join(fixtures, "plate1.jpg"));
await checkTranscribe(join(fixtures, "tone.wav"));
