#!/usr/bin/env node
// #990: the blind study of passing meals against an independent estimate. No step reads the database or any stored
// number of a meal; only `compare` reads stored totals, from a file that cards.mjs wrote, after the estimates are sealed.
//   prepare     the photos and drafted portions of each meal, renamed meal-01, meal-02, ... into a blind folder; the
//               map from those names to meal prefixes goes to a separate private file the reader never gets.
//   candidates  for every drafted food, USDA FoodData Central search results with their kcal per 100 g, retried on
//               a rate limit, a server error or a network error; a food that still fails is listed, never guessed.
//   total       each meal's calories from the reader's choices (blind/choices/meal-NN.json): grams x kcal per 100 g.
//               A meal with any food unchosen or unlooked-up is incomplete and has no total. Prints the sha256 seal.
//   compare     estimates against stored totals: agrees when |stored - estimate| <= 25% of the estimate, and the
//               passing-meal part closes when at least 17 meals have a complete estimate and 85% of them agree.
// Use: node scripts/numbers/study.mjs <step> --help
import { createHash } from 'node:crypto';
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

export const AGREE_SHARE = 0.25, CLOSE_MIN_COMPLETE = 17, CLOSE_MIN_AGREE = 0.85;
export const RETRY_WAITS_SECONDS = [2, 8, 30];
const SEARCH_URL = process.env.FDC_SEARCH_URL ?? 'https://api.nal.usda.gov/fdc/v1/foods/search';
const DATA_TYPES = ['Foundation', 'SR Legacy', 'Survey (FNDDS)'];
const ENERGY_IDS = [1008, 2048, 2047];
const sha256 = text => createHash('sha256').update(text).digest('hex');
const privateDir = dir => { mkdirSync(dir, { recursive: true, mode: 0o700 }); chmodSync(dir, 0o700); };
const privateWrite = (file, text) => { writeFileSync(file, text, { mode: 0o600 }); chmodSync(file, 0o600); };
const readJson = file => JSON.parse(readFileSync(file, 'utf8'));
const blindName = index => `meal-${String(index + 1).padStart(2, '0')}`;
// Pure: a photo's file extension from its first bytes, so the reader receives it under its real type.
export function photoExtension(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
  if (String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP') return 'webp';
  return null;
}

// Pure: kcal per 100 g of one search result, or null. Energy in kcal (1008) first, then the Atwater values.
export function kcalPer100g(food) {
  for (const id of ENERGY_IDS) {
    const n = (food.foodNutrients ?? []).find(x => Number(x.nutrientId) === id && String(x.unitName ?? '').toUpperCase() === 'KCAL');
    if (n && Number.isFinite(Number(n.value))) return Number(n.value);
  }
  return null;
}

// Pure: whether a failed search is worth another try.
export const retryable = status => status === 'network' || status === 429 || (status >= 500 && status <= 599);

// One search with its retries. fetcher and wait are injectable for the test of this step.
export async function search(query, { key, fetcher = fetch, wait = s => new Promise(r => setTimeout(r, s * 1000)), log = () => {} } = {}) {
  const attempts = [];
  for (let attempt = 0; attempt <= RETRY_WAITS_SECONDS.length; attempt++) {
    let status;
    try {
      const response = await fetcher(`${SEARCH_URL}?api_key=${encodeURIComponent(key)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, dataType: DATA_TYPES, pageSize: 10 }), signal: AbortSignal.timeout(30000) });
      status = response.status;
      if (response.ok) {
        const body = await response.json();
        const foods = (body.foods ?? []).map(f => ({ fdcId: f.fdcId, description: f.description, dataType: f.dataType, kcal_per_100g: kcalPer100g(f) }))
          .filter(f => f.kcal_per_100g !== null);
        attempts.push(status);
        return { ok: true, query, attempts, foods };
      }
    } catch { status = 'network'; }
    attempts.push(status);
    log(`search "${query}": ${status}`);
    if (!retryable(status) || attempt === RETRY_WAITS_SECONDS.length) return { ok: false, query, attempts, status };
    await wait(RETRY_WAITS_SECONDS[attempt]);
  }
  return { ok: false, query, attempts, status: 'unreachable' };
}

// Pure: one meal's estimate from its drafted foods, the reader's choices and the candidates.
export function estimateMeal(portion, choice, candidates) {
  const foods = portion.foods.map(food => {
    const picked = choice?.foods?.find(c => c.key === food.key);
    const found = candidates[food.key];
    if (!found?.ok) return { key: food.key, grams: food.grams, missing: 'lookup failed' };
    const record = picked?.fdcId == null ? null : found.foods.find(f => f.fdcId === picked.fdcId);
    if (!record) return { key: food.key, grams: food.grams, missing: picked?.fdcId == null ? 'not chosen' : 'chosen record not among the candidates' };
    return { key: food.key, grams: food.grams, fdcId: record.fdcId, kcal_per_100g: record.kcal_per_100g, kcal: Math.round(food.grams * record.kcal_per_100g) / 100 };
  });
  const complete = foods.every(f => f.kcal !== undefined);
  return { meal: portion.meal, complete, kcal: complete ? Math.round(foods.reduce((sum, f) => sum + f.kcal, 0) * 10) / 10 : null, foods };
}

// Pure: the comparison and whether it closes the passing-meal part.
export function compareStudy(estimates, map, stored) {
  const rows = estimates.map(e => {
    const prefix = map[e.meal];
    const s = stored[prefix];
    const agrees = e.complete && s != null ? Math.abs(s - e.kcal) <= AGREE_SHARE * e.kcal : null;
    return { meal: prefix, estimate: e.kcal, stored: s ?? null, complete: e.complete, agrees };
  });
  const complete = rows.filter(r => r.complete && r.stored != null);
  const agree = complete.filter(r => r.agrees).length;
  const closes = complete.length >= CLOSE_MIN_COMPLETE && agree >= Math.ceil(CLOSE_MIN_AGREE * complete.length);
  return { rows, complete: complete.length, agree, closes };
}

async function main(argv) {
  const [step, ...rest] = argv;
  const { values } = parseArgs({ args: rest, options: { drafts: { type: 'string' }, sample: { type: 'string' }, blind: { type: 'string' }, map: { type: 'string' },
    cache: { type: 'string' }, estimates: { type: 'string' }, stored: { type: 'string' }, 'max-minutes': { type: 'string' }, help: { type: 'boolean' } } });
  if (values.help || !['prepare', 'candidates', 'total', 'compare'].includes(step)) {
    console.log(`node scripts/numbers/study.mjs prepare --drafts=<blind-portion-drafts.json> --sample=<folder of <prefix>/photo-* files> --blind=<new folder> --map=<private map file>
node scripts/numbers/study.mjs candidates --blind=<folder> [--max-minutes=10]      (needs FDC_API_KEY)
node scripts/numbers/study.mjs total --blind=<folder>
node scripts/numbers/study.mjs compare --estimates=<blind>/estimates.json --map=<private map file> --stored=<cards.mjs output>`);
    return step ? 0 : 4;
  }
  if (step === 'prepare') {
    const drafts = readJson(values.drafts);
    if (drafts.some(d => d.storedNumbersRead !== false)) throw new Error('A draft was written after stored numbers were read; it cannot be used.');
    if (existsSync(values.blind)) throw new Error('The blind folder exists; give a new one.');
    privateDir(values.blind);
    const map = {}, portions = [];
    drafts.forEach((draft, index) => {
      const name = blindName(index);
      map[name] = draft.meal;
      privateDir(path.join(values.blind, name));
      const photos = readdirSync(path.join(values.sample, draft.meal)).filter(f => f.startsWith('photo-')).sort();
      if (!photos.length) throw new Error(`Meal ${index + 1} has no photo.`);
      photos.forEach((photo, k) => {
        const from = path.join(values.sample, draft.meal, photo), ext = photoExtension(readFileSync(from));
        if (!ext) throw new Error(`Meal ${index + 1}, photo ${k + 1} is not a JPEG, PNG or WebP image.`);
        const to = path.join(values.blind, name, `photo-${k + 1}.${ext}`); copyFileSync(from, to); chmodSync(to, 0o600);
      });
      portions.push({ meal: name, foods: draft.foods.map(f => ({ key: f.key, grams: f.grams })) });
    });
    privateWrite(path.join(values.blind, 'portions.json'), JSON.stringify(portions, null, 1) + '\n');
    privateWrite(values.map, JSON.stringify(map) + '\n');
    console.log(`${portions.length} meals, ${portions.reduce((n, p) => n + p.foods.length, 0)} foods. Drafts sha256 ${sha256(readFileSync(values.drafts))}.`);
    return 0;
  }
  if (step === 'candidates') {
    const key = process.env.FDC_API_KEY;
    if (!key) throw new Error('FDC_API_KEY is not set.');
    const file = path.join(values.blind, 'candidates.json');
    const candidates = existsSync(file) ? readJson(file) : {};
    const keys = [...new Set(readJson(path.join(values.blind, 'portions.json')).flatMap(p => p.foods.map(f => f.key)))];
    const deadline = Date.now() + Number(values['max-minutes'] ?? 10) * 60000;
    for (const food of keys) {
      if (candidates[food]?.ok) continue;
      if (Date.now() > deadline) { console.log(`STOPPED: --max-minutes used up; ${keys.filter(k => !candidates[k]?.ok).length} food(s) not looked up.`); break; }
      candidates[food] = await search(food.replaceAll('_', ' '), { key, log: line => console.log(line) });
      privateWrite(file, JSON.stringify(candidates, null, 1) + '\n');
    }
    const failed = keys.filter(k => !candidates[k]?.ok);
    console.log(`${keys.length - failed.length} of ${keys.length} foods looked up.${failed.length ? ` Failed: ${failed.map(k => `${k} (${candidates[k]?.attempts?.join(', ') ?? 'not tried'})`).join('; ')}.` : ''}`);
    return failed.length ? 1 : 0;
  }
  if (step === 'total') {
    const portions = readJson(path.join(values.blind, 'portions.json'));
    const candidates = readJson(path.join(values.blind, 'candidates.json'));
    const estimates = portions.map(p => {
      const file = path.join(values.blind, 'choices', `${p.meal}.json`);
      return estimateMeal(p, existsSync(file) ? readJson(file) : null, candidates);
    });
    const text = JSON.stringify(estimates, null, 1) + '\n';
    privateWrite(path.join(values.blind, 'estimates.json'), text);
    console.log(`${estimates.filter(e => e.complete).length} of ${estimates.length} meals have a complete estimate. Sealed: sha256 ${sha256(text)}.`);
    return 0;
  }
  const stored = {};
  for (const line of readFileSync(values.stored, 'utf8').split('\n').slice(1)) {
    const [meal, , , , , kcal] = line.split('|');
    if (/^[0-9a-f]{8}$/.test(meal ?? '') && kcal !== undefined && kcal !== '') stored[meal] = Number(kcal);
  }
  const result = compareStudy(readJson(values.estimates), readJson(values.map), stored);
  console.log('meal|estimate_kcal|stored_kcal|agrees');
  for (const r of result.rows) console.log([r.meal, r.estimate ?? 'incomplete', r.stored ?? '', r.agrees === null ? '' : r.agrees ? 'yes' : 'no'].join('|'));
  console.log(`${result.agree} of ${result.complete} complete estimates agree within ${AGREE_SHARE * 100}%. The passing-meal part ${result.closes ? 'closes' : 'does not close'} (it needs at least ${CLOSE_MIN_COMPLETE} complete and ${CLOSE_MIN_AGREE * 100}% agreeing).`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2)).then(code => { process.exitCode = code; }, error => { console.error(error.message); process.exitCode = 1; });
