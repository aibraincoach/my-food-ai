#!/usr/bin/env node
// node scripts/font-codepoints.mjs
// Preserve source literal/JSX characters in addition to the Latin subset.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import ts from 'typescript';
const points = new Set();
async function visit(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) { await visit(file); continue; }
    if (!/\.[cm]?[jt]sx?$/.test(entry.name)) continue;
    const source = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true,
      /\.[jt]sx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const collect = node => {
      if (ts.isStringLiteralLike(node) || ts.isJsxText(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
        for (const char of node.text) if (char.codePointAt(0) > 0xFF) points.add(char.codePointAt(0));
      }
      ts.forEachChild(node, collect);
    };
    collect(source);
  }
}
await visit('src');
console.log([...points].sort((a,b) => a-b).map(value => `U+${value.toString(16).toUpperCase().padStart(4,'0')}`).join(','));
