#!/usr/bin/env node
// Wording inventory (#294): extract user-visible strings from src/**/*.{ts,tsx}
// with the TypeScript compiler API and write docs/wording/inventory.md.
//
//   node scripts/wording-inventory.mjs [--out docs/wording/inventory.md] [--check]
//
// Heuristics, not proof: JSX text, visible JSX attributes (aria-label,
// placeholder, title, alt) and sentence-like string/template literals are
// collected. Class lists, imports, event names, URLs, paths, model prompts
// (src/lib/prompts/**) and single bare tokens are excluded. Every entry must
// still be eyeballed in docs/wording/review.md before a wording change ships.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Keep in sync with the banned list in src/lib/pipeline/wording-check.ts.
export const BANNED = ["coach", "coaching", "advice", "advise", "recommend", "recommendation", "goal", "target", "plan", "budget", "progress", "left", "remaining", "ring", "streak", "should", "try to", "aim for", "cut back", "next time", "keep it up", "well done", "good job"];

// Terms named in #294 whose every occurrence must be listed for owner ruling.
export const TRACKED_TERMS = [
  "leftovers (not eaten)",
  "Leftovers · not eaten",
  "Leftovers",
  "not eaten",
  "Consumed",
  "Drank in this meal",
  "Log again",
  "Saved meals",
  "Additional food",
  "Clarification needed",
  "A question about this meal",
  "What did you eat?",
  "No food found",
  "Days",
  "Today",
  "Yesterday",
];

const VISIBLE_ATTRS = new Set(["aria-label", "placeholder", "title", "alt", "label"]);
const SKIP_DIRS = new Set(["node_modules", ".next"]);

function listSourceFiles(root) {
  const srcDir = join(root, "src");
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name));
      } else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
        files.push(join(dir, entry.name));
      }
    }
  };
  if (existsSync(srcDir)) walk(srcDir);
  return files.sort();
}

const normalize = (text) => text.replace(/\s+/g, " ").trim();

export function isCandidate(raw, kind = "string") {
  const text = normalize(raw);
  if (text.length < 2 || text.length > 300) return false;
  if (!/[A-Za-z]/.test(text)) return false;
  if (kind.startsWith("jsx-")) return true; // JSX text/visible attrs are wording by construction
  if (/^(https?:)?\/\//.test(text) || text.startsWith("/api/") || text.startsWith("data:")) return false;
  // Needs a word boundary: a space or sentence punctuation. Bare tokens are
  // statuses, event names, icon names and identifiers, not wording.
  if (!/[\s.!?:;,]/.test(text)) return false;
  // Code, CSS, regexes, selectors, paths and DB fragments are not wording.
  if (/[{}\\@<>]/.test(text) || /^[./(*[#]/.test(text) || text.includes("../")) return false;
  if (/_[a-z]/.test(text) || /\(\?:|\[[^\]]*[a-z][^\]]*\]/.test(text)) return false;
  if (/[a-z]:[a-z[]/.test(text)) return false; // CSS variants / pseudo-classes
  const tokens = text.split(" ");
  // Long all-lowercase strings with no sentence end are class lists or code.
  if (tokens.length >= 4 && !/[.!?…]$/.test(text) && !tokens.some((t) => /^[A-Z]/.test(t)) && !/^[·,]/.test(text)) return false;
  if (tokens.length >= 3 && tokens.every((t) => /^[-a-z0-9[\]/.:_%()#]+$/.test(t)) && !/[.!?]$/.test(text)) return false;
  return true;
}

const SKIP_FILE_PREFIXES = ["src/lib/trace/", "src/lib/meta/", "src/lib/theme/"];

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

export function collectInventory(root) {
  const entries = new Map(); // text -> { text, locations: [{file, line, kind}] }
  const tracked = new Map(TRACKED_TERMS.map((term) => [term, []]));
  const add = (raw, file, line, kind) => {
    const text = normalize(raw);
    if (!isCandidate(text, kind)) return;
    const key = text;
    if (!entries.has(key)) entries.set(key, { text, locations: [] });
    const loc = { file, line, kind };
    const list = entries.get(key).locations;
    if (!list.some((l) => l.file === file && l.line === line && l.kind === kind)) list.push(loc);
  };

  for (const abs of listSourceFiles(root)) {
    const file = relative(root, abs).split("\\").join("/");
    const source = readFileSync(abs, "utf8");
    // Tracked-term scan is a raw substring scan so stored values, regexes and
    // JSON-schema strings (which the AST pass filters out) are not missed.
    source.split("\n").forEach((lineText, i) => {
      for (const term of TRACKED_TERMS) {
        if (lineText.includes(term)) tracked.get(term).push(`${file}:${i + 1}`);
      }
    });

    const inPrompts = file.startsWith("src/lib/prompts/") || SKIP_FILE_PREFIXES.some((p) => file.startsWith(p));
    const sf = ts.createSourceFile(abs, source, ts.ScriptTarget.Latest, true,
      abs.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const visit = (node) => {
      if (ts.isJsxText(node)) {
        add(node.text, file, lineOf(sf, node), "jsx-text");
      } else if (ts.isJsxAttribute(node) && node.initializer) {
        const attr = node.name.getText(sf);
        if (VISIBLE_ATTRS.has(attr)) {
          if (ts.isStringLiteral(node.initializer)) add(node.initializer.text, file, lineOf(sf, node), `jsx-attr:${attr}`);
          else if (ts.isJsxExpression(node.initializer) && node.initializer.expression && ts.isStringLiteral(node.initializer.expression)) {
            add(node.initializer.expression.text, file, lineOf(sf, node), `jsx-attr:${attr}`);
          }
        }
      } else if (!inPrompts && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))) {
        const parent = node.parent;
        const skip = ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)
          || (ts.isJsxAttribute(parent) && !VISIBLE_ATTRS.has(parent.name.getText(sf)))
          || (ts.isCallExpression(parent) && /^(fetch|redirect|router\.(push|replace)|dispatchEvent)$/.test(parent.expression.getText(sf)));
        if (!skip) add(node.text, file, lineOf(sf, node), ts.isNoSubstitutionTemplateLiteral(node) ? "template" : "string");
      } else if (!inPrompts && ts.isTemplateExpression(node)) {
        const parent = node.parent;
        const inClassAttr = (ts.isJsxExpression(parent) && parent.parent && ts.isJsxAttribute(parent.parent) && !VISIBLE_ATTRS.has(parent.parent.name.getText(sf)))
          || (ts.isJsxAttribute(parent) && !VISIBLE_ATTRS.has(parent.name.getText(sf)));
        if (inClassAttr) return;
        const text = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join("${…}");
        add(text, file, lineOf(sf, node), "template");
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  const list = [...entries.values()].sort((a, b) => a.text.localeCompare(b.text));
  for (const entry of list) entry.locations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  return { entries: list, tracked };
}

export function bannedHits(text) {
  return BANNED.filter((phrase) => new RegExp(`\\b${phrase.replaceAll(" ", "\\s+")}\\b`, "i").test(text));
}

const esc = (text) => text.replaceAll("|", "\\|").replaceAll("\n", " ");

export function renderInventory({ entries, tracked }) {
  const flagged = entries.filter((e) => bannedHits(e.text).length);
  const lines = [
    "# Wording inventory",
    "",
    "Generated by `node scripts/wording-inventory.mjs` from `src/**/*.{ts,tsx}` using the TypeScript compiler API. Regenerate after any wording change; do not hand-edit this file.",
    "",
    "Scope: JSX text, visible JSX attributes (`aria-label`, `placeholder`, `title`, `alt`, `label`) and sentence-like string/template literals. Class lists, imports, event names, URLs, paths, model prompts (`src/lib/prompts/**`) and bare tokens are excluded by heuristic — absence here is not proof a string is not user-visible. Tracked terms below are a raw substring scan, so stored values and regexes are included.",
    "",
    `Unique strings: ${entries.length}. Locations: ${entries.reduce((n, e) => n + e.locations.length, 0)}. Flagged by the wording rules: ${flagged.length}.`,
    "",
    "## Tracked terms (#294)",
    "",
    "| Term | Hits | Places (file:line) |",
    "| --- | ---: | --- |",
    ...TRACKED_TERMS.map((term) => {
      const places = [...new Set(tracked.get(term) ?? [])];
      return `| ${esc(term)} | ${places.length} | ${places.length ? places.map((p) => `\`${p}\``).join(", ") : "—"} |`;
    }),
    "",
    "## Flagged by the wording rules",
    "",
    "Whole-word match against the banned list mirrored from `src/lib/pipeline/wording-check.ts` (no target, goal, ring or percentage; never \"left\" for a remaining amount). A hit is a prompt to check context, not proof of a violation — e.g. a CSS `left:` position is not wording.",
    "",
    flagged.length ? "| Text | Banned phrase(s) | Places (file:line) |\n| --- | --- | --- |" : "No flagged strings.",
    ...flagged.map((e) => `| ${esc(e.text)} | ${bannedHits(e.text).join(", ")} | ${e.locations.map((l) => `\`${l.file}:${l.line}\``).join(", ")} |`),
    "",
    "## All strings",
    "",
    "| Text | Kind | Places (file:line) |",
    "| --- | --- | --- |",
    ...entries.map((e) => `| ${esc(e.text)} | ${[...new Set(e.locations.map((l) => l.kind))].join(", ")} | ${e.locations.map((l) => `\`${l.file}:${l.line}\``).join(", ")} |`),
    "",
  ];
  return lines.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const root = resolve(args.includes("--root") ? args[args.indexOf("--root") + 1] : process.cwd());
  const outArg = args.includes("--out") ? args[args.indexOf("--out") + 1] : "docs/wording/inventory.md";
  const out = resolve(root, outArg);
  const rendered = renderInventory(collectInventory(root));
  if (args.includes("--check")) {
    if (!existsSync(out) || readFileSync(out, "utf8") !== rendered) {
      console.error(`${relative(root, out)} is stale; run node scripts/wording-inventory.mjs`);
      process.exit(1);
    }
    console.log(`${relative(root, out)} is up to date.`);
    return;
  }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, rendered);
  console.log(`Wrote ${relative(root, out)}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
