// Production execution belongs after the merge phase.
import { createClient } from '@supabase/supabase-js';
import { signInAsTestUser } from './lib/session.mjs';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdtemp, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, relative } from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

function required(name) {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
  return process.env[name];
}
function trigrams(text) {
  const result = new Set();
  for (const word of String(text).toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []) {
    const padded = `  ${word} `;
    for (let i = 0; i + 3 <= padded.length; i++) result.add(padded.slice(i, i + 3));
  }
  return result;
}
function similarity(a, b) {
  const left = trigrams(a), right = trigrams(b);
  const intersection = [...left].filter((value) => right.has(value)).length;
  return left.size + right.size ? intersection / (left.size + right.size - intersection) : 0;
}
function match(expected, actual) {
  const pairs = [];
  expected.forEach((e, i) => actual.forEach((a, j) => {
    const score = similarity(e.name, a.name);
    if (score >= 0.5) pairs.push({ i, j, score });
  }));
  pairs.sort((a, b) => b.score - a.score || a.i - b.i || a.j - b.j);
  const usedExpected = new Set(), usedActual = new Set(), rows = [];
  for (const pair of pairs) {
    if (usedExpected.has(pair.i) || usedActual.has(pair.j)) continue;
    usedExpected.add(pair.i); usedActual.add(pair.j);
    rows.push({ expected: expected[pair.i], actual: actual[pair.j], status: 'found' });
  }
  expected.forEach((e, i) => { if (!usedExpected.has(i)) rows.push({ expected: e, status: 'missed' }); });
  actual.forEach((a, j) => { if (!usedActual.has(j)) rows.push({ actual: a, status: 'invented' }); });
  return rows;
}
// Model names are untrusted text. Strip identifiers and credentials before docs.
function safe(value) {
  let text = String(value ?? '—');
  for (const [name, secret] of Object.entries(process.env)) {
    if (/(KEY|TOKEN|PASSWORD|EMAIL|URL)$/.test(name) && secret?.length > 4) text = text.replaceAll(secret, '[redacted]');
  }
  return text.replace(/https?:\/\/\S+|[\w.+-]+@[\w.-]+\.[a-z]+/gi, '[redacted]')
    .replace(/\b(?:[a-z\d-]+\.)+[a-z]{2,}\b/gi, '[host removed]')
    .replace(/@[a-z\d_.-]+/gi, '[handle removed]').replace(/[\r\n]+/g, ' ').replaceAll('|', '\\|').replaceAll('<', '&lt;');
}
async function request(url, init) {
  const response = await fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}
async function main() {
  if (process.env.EVAL_OUTPUT_DIR && !/^[a-f\d]{40}$/i.test(process.env.EVAL_DEPLOYED_COMMIT ?? '')) throw new Error('Exact deployed commit required for evidence.');
  const app = new URL(required('APP_URL'));
  if (process.env.EVAL_OUTPUT_DIR && app.protocol !== 'https:') throw new Error('Production HTTPS required for evidence.');
  if (!['http:', 'https:'].includes(app.protocol) || app.username || app.password) throw new Error('Invalid APP_URL');
  const cookie = await signInAsTestUser(1);
  const admin = createClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('SUPABASE_SECRET_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
  const require = createRequire(import.meta.url);
  const sharp = createRequire(require.resolve('next/package.json'))('sharp');
  const { photos } = JSON.parse(await readFile(new URL('../eval/expected.json', import.meta.url), 'utf8'));
  const results = [], owned = [];
  const startedAt = new Date().toISOString();
  const evidenceDir = process.env.EVAL_OUTPUT_DIR ? resolve(process.env.EVAL_OUTPUT_DIR) : null;
  const repoDir = resolve(new URL('..', import.meta.url).pathname);
  if (evidenceDir && !relative(repoDir, evidenceDir).startsWith('..')) throw new Error('Evidence must be outside the repository.');
  if (evidenceDir) await mkdir(evidenceDir, { recursive: true, mode: 0o700 });
  const privateDir = evidenceDir ?? await mkdtemp(join(tmpdir(), 'mfa-eval-'));
  const saveEvidence = async () => { if (evidenceDir) await writeFile(join(evidenceDir, 'results.json'), JSON.stringify({ startedAt, deployedCommit: process.env.EVAL_DEPLOYED_COMMIT ?? null, results }, null, 2), { mode: 0o600 }); };
  const saveOwned = () => writeFile(join(privateDir, 'owned-posts.json'), JSON.stringify(owned), { mode: 0o600 });
  for (const photo of photos) {
    const result = { file: photo.file, expected: photo.items, state: 'not-created', actual: [], startedAt: new Date().toISOString(), finishedAt: null, elapsedMs: null, error: null, job: null, jobError: null, traceKinds: {}, fdcSources: {}, resolutionEvents: {}, traceError: null };
    const startMs = performance.now();
    results.push(result);
    try {
      const input = await readFile(new URL(`../eval/photos/${photo.file}`, import.meta.url));
      const encode = (size) => sharp(input).rotate().resize(size, size, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer({ resolveWithObject: true });
      const [original, feed] = await Promise.all([encode(4096), encode(1080)]);
      const post = async (method, body) => request(new URL('/api/posts', app), { method, headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(body) });
      const response = await post('POST', { operation_id: randomUUID(), capture_intent: 'photo', caption: photo.caption, eaten_at: new Date().toISOString(), shots: [{ position: 0, width: original.info.width, height: original.info.height }] });
      const payload = await response.json();
      if (typeof payload.postId !== 'string' || payload.uploads?.length !== 1) throw new Error('Invalid post response');
      owned.push(payload.postId); await saveOwned();
      const upload = payload.uploads[0];
      await Promise.all([
        request(upload.originalSignedUrl, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: original.data }),
        request(upload.feedSignedUrl, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: feed.data }),
      ]);
      await post('PUT', { postId: payload.postId });
      const deadline = Date.now() + 15 * 60000;
      result.state = 'timed-out';
      while (Date.now() < deadline) {
        const { data, error } = await admin.from('posts').select('status').eq('id', payload.postId).single();
        if (error) throw new Error('Status unavailable');
        if (['ready', 'failed', 'needs_input'].includes(data.status)) { result.state = data.status; break; }
        await sleep(2000);
      }
      if (result.state === 'ready') {
        const { data, error } = await admin.from('post_items').select('name,portion_grams,nutrition:item_nutrition(calories,source_ref)').eq('post_id', payload.postId).is('superseded_at', null);
        if (error) throw new Error('Items unavailable');
        result.actual = data.map((item) => { const nutrition = Array.isArray(item.nutrition) ? item.nutrition[0] : item.nutrition; return { name: safe(item.name), grams: item.portion_grams, calories: nutrition?.calories ?? null, sourceRef: nutrition?.source_ref == null ? null : safe(nutrition.source_ref) }; });
      } else process.exitCode = 1;
      try {
        const { data: jobs, error: jobError } = await admin.from('jobs').select('kind,status,attempts,error').eq('post_id', payload.postId).eq('kind', 'analyze');
        if (jobError) result.jobError = 'Job metadata unavailable';
        else result.job = (jobs ?? []).map(job => ({ kind: job.kind, status: job.status, attempts: job.attempts, error: job.error == null ? null : safe(job.error) }));
      } catch { result.jobError = 'Job metadata unavailable'; }
      try {
        const { data: calls, error: traceError } = await admin.from('model_calls').select('kind,request_text').eq('post_id', payload.postId);
        if (traceError) result.traceError = 'Trace metadata unavailable';
        else for (const call of calls ?? []) {
          result.traceKinds[call.kind] = (result.traceKinds[call.kind] ?? 0) + 1;
          if (call.kind !== 'fdc') continue;
          let request = {}; try { request = JSON.parse(call.request_text); } catch {}
          if (['food_resolution','nutrition_reuse'].includes(request.event)) result.resolutionEvents[request.event] = (result.resolutionEvents[request.event] ?? 0) + 1;
          if (['network','cache','legacy_cache','copied','retained'].includes(request.source)) result.fdcSources[request.source] = (result.fdcSources[request.source] ?? 0) + 1;
        }
      } catch { result.traceError = 'Trace metadata unavailable'; }
    } catch (error) {
      result.state = 'request-failed'; result.error = safe(error instanceof Error ? error.message : 'Request failed'); process.exitCode = 1;
    }
    result.finishedAt = new Date().toISOString(); result.elapsedMs = Math.round(performance.now() - startMs);
    await saveEvidence();
    console.log(`Photo ${photo.file}: ${result.state}`);
  }
  const lines = [`Run: ${new Date().toISOString()}.`, '', 'Weights below are visual annotations, not measured ground truth.', ''];
  const total = { found: 0, missed: 0, invented: 0 };
  for (const result of results) {
    const rows = match(result.expected, result.actual);
    const counts = { found: 0, missed: 0, invented: 0 };
    rows.forEach((row) => { counts[row.status]++; total[row.status]++; });
    lines.push(`## Photo ${result.file}`, '', `Pipeline outcome: ${result.state}; elapsed ${(result.elapsedMs / 1000).toFixed(2)} seconds.`, ...(result.error ? [`Error: ${safe(result.error)}.`] : []), '', '| Expected item | Returned item | Expected grams | Returned grams | Status |', '| --- | --- | ---: | ---: | --- |', ...rows.map((row) => `| ${safe(row.expected?.name)} | ${safe(row.actual?.name)} | ${safe(row.expected?.grams)} | ${safe(row.actual?.grams)} | ${row.status} |`), '', `Totals: found ${counts.found}, missed ${counts.missed}, invented ${counts.invented}.`, '');
  }
  lines.push(`Overall: found ${total.found}, missed ${total.missed}, invented ${total.invented}. Ready photos: ${results.filter((r) => r.state === 'ready').length}/${photos.length}.`, '', 'Non-ready photos are reported as missed expected items because no completed result was available; this includes pipeline failures, not only recognition failures. Unmatched returned names are labeled invented by this mechanical matcher; ingredient-level versus composite-dish naming requires visual review and is not itself proof of hallucination.');
  if (evidenceDir) await writeFile(join(evidenceDir, 'report.md'), lines.join('\n') + '\n', { mode: 0o600 });
  if (process.env.EVAL_NO_DOCS === '1') { console.log('Evidence written outside the repository; documentation unchanged.'); return; }
  const doc = new URL('../docs/eval.md', import.meta.url), begin = '<!-- eval-results:start -->', end = '<!-- eval-results:end -->';
  const current = await readFile(doc, 'utf8');
  if (!current.includes(begin) || !current.includes(end)) throw new Error('Report markers absent');
  await writeFile(doc, current.slice(0, current.indexOf(begin) + begin.length) + '\n' + lines.join('\n') + '\n' + current.slice(current.indexOf(end)));
  console.log(`Report written. Private owned-post list: ${join(privateDir, 'owned-posts.json')}`);
}
main().catch(() => { console.error('Evaluation could not complete; check configuration and service availability.'); process.exitCode = 1; });
