/**
 * AGY review invocation: complete delivery and deterministic coverage check.
 * Guards the failure recorded in aibraintrust-io
 * docs/evidence/agy-coverage-root-cause-2026-09-12.md (imported finding):
 * content clipped by shell output capture and paths dropped before review.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import * as tool from './agy-review.mjs';

const { PART_BYTES, READ_METHOD, splitParts, extractResponse, writePacket, buildManifest, checkCoverage } = tool;

function sh(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
}

function repoWithTwoCommits() {
  const dir = mkdtempSync(join(tmpdir(), 'agy-review-'));
  sh(dir, ['init', '-q']);
  sh(dir, ['config', 'user.email', 't@example.com']);
  sh(dir, ['config', 'user.name', 't']);
  mkdirSync(join(dir, 'docs'));
  writeFileSync(join(dir, 'keep.ts'), 'export const a = 1;\n');
  writeFileSync(join(dir, 'gone.ts'), "export const secretlyRemoved = 'must be reviewed';\n");
  writeFileSync(join(dir, 'docs/note.md'), '# note\n');
  writeFileSync(join(dir, 'big.ts'), Array.from({ length: 2000 }, (_, i) => `export const v${i} = ${i};`).join('\n') + '\n');
  sh(dir, ['add', '.']);
  sh(dir, ['commit', '-qm', 'base']);
  const base = sh(dir, ['rev-parse', 'HEAD']);
  writeFileSync(join(dir, 'keep.ts'), 'export const a = 2;\n');
  rmSync(join(dir, 'gone.ts'));
  writeFileSync(join(dir, 'docs/note.md'), '# note\nchanged\n');
  writeFileSync(join(dir, 'big.ts'), Array.from({ length: 2000 }, (_, i) => `export const v${i} = ${i + 1};`).join('\n') + '\n');
  writeFileSync(join(dir, 'added.ts'), 'export const b = 3;\n');
  sh(dir, ['add', '-A']);
  sh(dir, ['commit', '-qm', 'head']);
  const head = sh(dir, ['rev-parse', 'HEAD']);
  return { dir, base, head };
}

test('manifest keeps every path including docs and deletions; deletions carry full removed content', () => {
  const { dir, base, head } = repoWithTwoCommits();
  try {
    const out = join(dir, 'packet');
    const manifest = writePacket(dir, base, head, out);
    assert.deepEqual(manifest.files.map((f) => `${f.status} ${f.path}`), [
      'A added.ts', 'M big.ts', 'M docs/note.md', 'D gone.ts', 'M keep.ts',
    ]);
    assert.deepEqual(buildManifest(dir, base, head).map((f) => f.path), manifest.files.map((f) => f.path));
    const gone = manifest.files.find((f) => f.path === 'gone.ts');
    const patch = readFileSync(join(out, gone.parts[0].name), 'utf8');
    assert.match(patch, /deleted file mode/);
    assert.match(patch, /-export const secretlyRemoved = 'must be reviewed';/);
    for (const f of manifest.files) for (const p of f.parts) assert.ok(p.bytes <= PART_BYTES, `${p.name} exceeds part limit`);
    const big = manifest.files.find((f) => f.path === 'big.ts');
    assert.ok(big.parts.length >= 2, 'large patch is split into several parts');
    const joined = big.parts.map((p) => readFileSync(join(out, p.name), 'utf8')).join('');
    const full = spawnSync('git', ['diff', '--no-ext-diff', '--no-renames', base, head, '--', 'big.ts'], { cwd: dir, encoding: 'utf8' }).stdout;
    assert.equal(joined, full, 'parts concatenate to the exact git patch, nothing lost');
    assert.match(readFileSync(join(out, 'MANIFEST.md'), 'utf8'), /Never use run_command, cat, sed, head, tail or git/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('splitParts never drops bytes, including over-long lines', () => {
  const text = 'a\n' + 'x'.repeat(95) + '\n' + 'b\n';
  const parts = splitParts(text, 40);
  assert.equal(parts.join(''), text);
  for (const p of parts) assert.ok(Buffer.byteLength(p) <= 40);
});

test('splitParts keeps multi-byte characters intact when slicing an over-long line', () => {
  const line = 'é'.repeat(30) + '😀'.repeat(10) + '\n';
  const parts = splitParts(line, 41);
  assert.equal(parts.join(''), line, 'rejoined text equals the original');
  assert.equal((parts.join('').match(/\uFFFD/g) ?? []).length, 0, 'no replacement characters');
  for (const p of parts) assert.ok(Buffer.byteLength(p) <= 41);
});

test('coverage check passes only when every path and part is complete via the native viewer', () => {
  const { dir, base, head } = repoWithTwoCommits();
  try {
    const manifest = writePacket(dir, base, head, join(dir, 'packet'));
    const complete = () => ({
      head, base, verdict: 'BLOCKERS: NONE', summary: 'ok', blockers: [],
      files: manifest.files.map((f) => ({
        path: f.path, status: f.status, findings: [],
        parts: f.parts.map((p) => ({ name: p.name, read_method: READ_METHOD, bytes_read: p.bytes, complete: true })),
      })),
    });
    assert.deepEqual(checkCoverage(manifest, complete()), { ok: true, problems: [] });

    const missing = complete(); missing.files = missing.files.filter((f) => f.path !== 'docs/note.md');
    assert.match(checkCoverage(manifest, missing).problems.join('\n'), /missing from response: docs\/note\.md/);

    const shell = complete(); shell.files[0].parts[0].read_method = 'run_command';
    assert.match(checkCoverage(manifest, shell).problems.join('\n'), /read via run_command, not view_file/);

    const clipped = complete(); clipped.files[1].parts[0].bytes_read = 8192;
    assert.match(checkCoverage(manifest, clipped).problems.join('\n'), /bytes_read 8192 vs/);

    const partial = complete(); partial.files[1].parts[1].complete = false;
    assert.match(checkCoverage(manifest, partial).problems.join('\n'), /reported incomplete/);

    const wrongHead = complete(); wrongHead.head = '0'.repeat(40);
    assert.match(checkCoverage(manifest, wrongHead).problems.join('\n'), /head mismatch/);

    const extra = complete(); extra.files.push({ path: 'unchanged.ts', status: 'M', findings: [], parts: [] });
    assert.match(checkCoverage(manifest, extra).problems.join('\n'), /not in the diff: unchanged\.ts/);

    const incomplete = complete(); incomplete.verdict = 'REVIEW INCOMPLETE';
    assert.match(checkCoverage(manifest, incomplete).problems.join('\n'), /REVIEW INCOMPLETE/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('extractResponse unwraps the agy json envelope and fenced JSON', () => {
  const inner = { head: 'h', base: 'b', verdict: 'BLOCKERS: NONE', summary: '', blockers: [], files: [] };
  assert.deepEqual(extractResponse(JSON.stringify({ response: JSON.stringify(inner) })).response, inner);
  assert.deepEqual(extractResponse(JSON.stringify({ response: '```json\n' + JSON.stringify(inner) + '\n```' })).response, inner);
  assert.ok(extractResponse('not json').error);
  assert.ok(extractResponse(JSON.stringify({ response: 'prose only' })).error);
});

test('supplemental context uses exact committed head, without changing diff coverage', () => {
  const { dir, base, head } = repoWithTwoCommits();
  try {
    writeFileSync(join(dir, 'keep.ts'), 'uncommitted content must not enter packet');
    const out = join(dir, 'packet');
    const manifest = writePacket(dir, base, head, out, { contextPaths: ['keep.ts'] });
    const part = manifest.supplemental[0].parts[0];
    assert.equal(readFileSync(join(out, part.name), 'utf8'), 'export const a = 2;\n');
    assert.deepEqual(manifest.files.map(f => f.path), buildManifest(dir, base, head).map(f => f.path));
    assert.match(readFileSync(join(out, 'MANIFEST.md'), 'utf8'), /Supplemental exact-head context: keep.ts/);
    assert.throws(() => writePacket(dir, base, head, out, { contextPaths: ['../secret'] }), /invalid context path/);
    const prompt = tool.buildPrompt(manifest, {});
    assert.match(prompt, /My Food AI/);
    assert.match(prompt, /admin-only database trace/);
    assert.doesNotMatch(prompt, /lib\/openai.js|Shut-off|no conversation content/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
