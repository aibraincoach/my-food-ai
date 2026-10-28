// node --env-file=.env.local scripts/load-test.mjs
import { createClient } from '@supabase/supabase-js';
import { signInAsTestUser } from './lib/session.mjs';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const COUNT = 20;
const INTERVAL_MS = 6_000;
const POLL_MS = 2_000;
const MAX_WAIT_MS = 15 * 60_000;
const DOC = new URL('../docs/load-test.md', import.meta.url);
const BEGIN = '<!-- load-test-results:start -->';
const END = '<!-- load-test-results:end -->';

function required(name) {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
  return process.env[name];
}

// The document must not contain credentials, host names or account details.
function safeError(value) {
  let text = String(value);
  for (const [name, secret] of Object.entries(process.env)) {
    if (/(KEY|TOKEN|PASSWORD|EMAIL|URL)$/.test(name) && secret && secret.length > 4) text = text.replaceAll(secret, '[redacted]');
  }
  return text.replace(/https?:\/\/\S+/gi, '[URL removed]')
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]+/g, '[email removed]')
    .replace(/\b[\w-]+(?:\.[\w-]+)+\.(?:com|net|org|app|ai|io|dev)\b/gi, '[host removed]')
    .replace(/\b[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}\b/gi, '[identifier removed]')
    .replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
}

async function request(url, init, label) {
  let response;
  try { response = await fetch(url, { ...init, signal: AbortSignal.timeout(60_000) }); }
  catch { throw new Error(`${label}: request failed or timed out`); }
  if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
  return response;
}

async function fixtures() {
  // Next already installs sharp for local image handling; no application
  // runtime decoder or additional dependency is introduced by this script.
  const require = createRequire(import.meta.url);
  let sharp;
  try { sharp = createRequire(require.resolve('next/package.json'))('sharp'); }
  catch { throw new Error('Install dependencies including Next optional dependencies before the load test.'); }
  return Promise.all([1, 2, 3].map(async (number) => {
    let input, name;
    try { name = `eval/photos/${String(number).padStart(2, '0')}.jpg`; input = await readFile(new URL(`../${name}`, import.meta.url)); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      name = `scripts/fixtures/plate${number}.jpg`; input = await readFile(new URL(`../${name}`, import.meta.url));
    }
    const encode = (size) => sharp(input).rotate().resize(size, size, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer({ resolveWithObject: true });
    const [original, feed] = await Promise.all([encode(4096), encode(1080)]);
    return { number, name, original: original.data, feed: feed.data, width: original.info.width, height: original.info.height };
  }));
}

async function report(run) {
  const ready = run.posts.filter((p) => p.readyMs !== undefined).map((p) => p.readyMs).sort((a, b) => a - b);
  const middle = Math.floor(ready.length / 2);
  const median = ready.length ? (ready.length % 2 ? ready[middle] : (ready[middle - 1] + ready[middle]) / 2) : null;
  const failed = run.posts.filter((p) => p.error || p.status === 'failed').length;
  const incomplete = run.posts.filter((p) => !p.error && !['ready', 'failed'].includes(p.status)).length;
  const seconds = (ms) => ms === null || ms === undefined ? '—' : (ms / 1000).toFixed(2);
  const lines = [
    `Run started: ${new Date(run.startedAt).toISOString()}.`, '',
    `Twenty posts were scheduled across 114 seconds, within the two-minute window. ${run.posts.filter((p) => p.id).length} post rows were created.`,
    `Ready: ${ready.length}; failed requests/posts: ${failed}; incomplete at observation deadline: ${incomplete}.`,
    `Median time to ready: ${seconds(median)} seconds. Maximum: ${seconds(ready.at(-1))} seconds.`, '',
    '| Post | Fixture | Creation started (s) | Result | Observed ready (s) |',
    '| --- | --- | ---: | --- | ---: |',
    ...run.posts.map((p) => `| ${p.number} | ${p.fixture} | ${seconds(p.startedAt === undefined ? undefined : p.startedAt - run.startedAt)} | ${safeError(p.error ?? p.status)} | ${seconds(p.readyMs)} |`), '',
    'Observed job errors containing 429:', '',
    ...(run.rateLimits.length ? run.rateLimits.map((e) => `- Post ${e.number}, attempt ${e.attempt}: ${safeError(e.error)}`) : ['None observed.']), '',
    `Worker concurrency (operator-reported via DEPLOYED_WORKER_CONCURRENCY, not read from the deployment): **${process.env.DEPLOYED_WORKER_CONCURRENCY?.trim() || 'unknown'}**. This report does not justify increasing it; confirm the deployed setting before comparing timings across runs.`,
  ];
  if (incomplete || failed) lines.push('', 'This run did not complete successfully for every post. The unresolved outcomes above remain part of the result.');
  const current = await readFile(DOC, 'utf8');
  if (!current.includes(BEGIN) || !current.includes(END)) throw new Error('Load-test document markers are missing.');
  await writeFile(DOC, current.slice(0, current.indexOf(BEGIN) + BEGIN.length) + '\n' + lines.join('\n') + '\n' + current.slice(current.indexOf(END)));
  const privateDir = await mkdtemp(join(tmpdir(), 'mfa-load-test-'));
  await writeFile(join(privateDir, 'result.json'), JSON.stringify(run, null, 2) + '\n', { mode: 0o600 });
  console.log(`Report written; private run identifiers: ${join(privateDir, 'result.json')}`);
  console.log(`Ready ${ready.length}/${COUNT}; failed ${failed}; incomplete ${incomplete}; median ${seconds(median)}s; max ${seconds(ready.at(-1))}s.`);
  if (failed || incomplete) process.exitCode = 1;
}

async function main() {
  const app = new URL(required('APP_URL'));
  if (!['http:', 'https:'].includes(app.protocol) || app.username || app.password) throw new Error('APP_URL must be an HTTP origin without credentials.');
  const url = required('NEXT_PUBLIC_SUPABASE_URL');
  const secret = required('SUPABASE_SECRET_KEY');
  const images = await fixtures();
  const cookie = await signInAsTestUser(1);
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const appRequest = (method, body) => request(new URL('/api/posts', app), {
    method, headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(body),
  }, `${method} /api/posts`);
    const run = { startedAt: Date.now(), posts: Array.from({ length: COUNT }, (_, i) => ({ number: i + 1, fixture: images[i % images.length].name, status: 'not-created' })), rateLimits: [] };
    const observedErrors = new Set();
    let creationDone = false;
    const creation = Promise.all(run.posts.map(async (entry, index) => {
      await sleep(Math.max(0, run.startedAt + index * INTERVAL_MS - Date.now()));
      entry.startedAt = Date.now();
      const fixture = images[index % images.length];
      try {
        const response = await appRequest('POST', { caption: `Load test ${entry.number}`, eaten_at: new Date().toISOString(), shots: [{ position: 0, width: fixture.width, height: fixture.height }] });
        const body = await response.json();
        if (typeof body.postId !== 'string' || !Array.isArray(body.uploads) || body.uploads.length !== 1) throw new Error('Post response was incomplete.');
        entry.id = body.postId; entry.status = 'queued';
        const upload = body.uploads[0];
        await Promise.all([
          request(upload.originalSignedUrl, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: fixture.original }, 'Original upload'),
          request(upload.feedSignedUrl, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: fixture.feed }, 'Feed upload'),
        ]);
        await appRequest('PUT', { postId: entry.id });
      } catch (error) { entry.error = safeError(error instanceof Error ? error.message : 'Request failed'); }
      console.log(`Post ${entry.number}: ${entry.error ?? 'uploaded'}`);
    })).finally(() => { creationDone = true; });
    const poll = (async () => {
      while (Date.now() - run.startedAt < MAX_WAIT_MS) {
        const ids = run.posts.filter((p) => p.id).map((p) => p.id);
        if (ids.length) {
          const [posts, jobs] = await Promise.all([
            admin.from('posts').select('id,status').in('id', ids),
            admin.from('jobs').select('id,post_id,error,attempts').in('post_id', ids),
          ]);
          if (posts.error || jobs.error) throw new Error('Load-test state polling failed.');
          for (const post of posts.data) {
            const entry = run.posts.find((p) => p.id === post.id);
            entry.status = post.status;
            if (post.status === 'ready' && entry.readyMs === undefined) entry.readyMs = Date.now() - entry.startedAt;
          }
          for (const job of jobs.data) {
            if (!job.error?.includes('429')) continue;
            const signature = `${job.id}:${job.attempts}:${job.error}`;
            if (observedErrors.has(signature)) continue;
            observedErrors.add(signature);
            run.rateLimits.push({ number: run.posts.find((p) => p.id === job.post_id).number, attempt: job.attempts, error: safeError(job.error) });
          }
        }
        if (creationDone && run.posts.every((p) => p.error || ['ready', 'failed'].includes(p.status))) break;
        await sleep(POLL_MS);
      }
    })();
    try {
      const outcomes = await Promise.allSettled([creation, poll]);
      const failure = outcomes.find((result) => result.status === 'rejected');
      if (failure) throw failure.reason;
    } finally { await report(run); }
}

main().catch((error) => {
  console.error(safeError(error instanceof Error ? error.message : 'Load test failed.'));
  process.exitCode = 1;
});
