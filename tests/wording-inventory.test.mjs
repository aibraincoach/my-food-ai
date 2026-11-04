import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { collectInventory, isCandidate } from "../scripts/wording-inventory.mjs";

test("wording inventory keeps visible text and drops code strings", () => {
  const root = mkdtempSync(join(tmpdir(), "wording-inventory-"));
  mkdirSync(join(root, "src", "components"), { recursive: true });
  writeFileSync(join(root, "src", "components", "Sample.tsx"), `
    import { thing } from "./thing";
    export default function Sample() {
      const note = "Saved meals could not be loaded.";
      return <section aria-label="Saved meals" className="flex min-h-tap items-center">
        <h2>Saved meals</h2><p>{note}</p><span className="a b c">Log again</span>
      </section>;
    }
  `);
  const { entries, tracked } = collectInventory(root);
  const texts = entries.map((e) => e.text);
  assert.ok(texts.includes("Saved meals"));
  assert.ok(texts.includes("Saved meals could not be loaded."));
  assert.ok(texts.includes("Log again"));
  assert.ok(!texts.some((t) => t.includes("min-h-tap")), "class lists are excluded");
  assert.ok(!texts.includes("./thing"), "imports are excluded");
  assert.equal(tracked.get("Saved meals").length >= 2, true);
});

test("wording candidate filter rejects bare tokens and URLs", () => {
  assert.equal(isCandidate("ready"), false);
  assert.equal(isCandidate("https://example.com/some path"), false);
  assert.equal(isCandidate("What did you eat?"), true);
});
