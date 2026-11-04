// node --import tsx --test tests/profile-avatar.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import sharp from 'sharp';
import {createClient} from '@supabase/supabase-js';
import {signInAsTestUser, signInTestClient} from '../scripts/lib/session.mjs';
import * as avatar from '../src/lib/profile/avatar-url.ts';

const owner = '11111111-1111-4111-8111-111111111111';
const media = '33333333-3333-4333-8333-333333333333';
const routeSource = readFileSync(new URL('../src/app/api/media/avatar/[owner]/[media]/[variant]/route.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(routeSource, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;

function mediaRoute({user = {id: owner}, row = {avatar_media_id: media}, fetchImpl} = {}) {
  const filters = [];
  const calls = {fetch: 0};
  const query = {
    select() { return this; },
    eq(key, value) { filters.push([key, value]); return this; },
    async maybeSingle() { return {data: row, error: null}; },
  };
  const db = {
    auth: {
      async getSession() {
        return {data: {session: user ? {access_token: 'offline-token', user} : null}};
      },
    },
    from() { return query; },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === '@/lib/supabase/server') return {createClient: async () => db};
      if (name === '@/lib/profile/avatar-url') return avatar;
      throw Error(name);
    },
    Response,
    Request,
    URL,
    AbortSignal,
    process: {env: {NEXT_PUBLIC_SUPABASE_URL: 'https://storage.example', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'offline'}},
    fetch: async (...args) => { calls.fetch++; return fetchImpl(...args); },
  });
  return {
    get: async (params = {owner, media, variant: '96.webp'}, headers = {}) =>
      exports.GET(new Request(`https://app.example/api/media/avatar/${params.owner}/${params.media}/${params.variant}`, {headers}), {params: Promise.resolve(params)}),
    calls,
    filters,
  };
}

test('avatar media route rejects invalid ids, signed-out requests and mismatched profile media', async () => {
  for (const [setup, params, status] of [
    [{user: null}, {owner, media, variant: '96.webp'}, 401],
    [{row: {avatar_media_id: null}}, {owner, media, variant: '96.webp'}, 404],
    [{row: {avatar_media_id: media}}, {owner: 'bad', media, variant: '96.webp'}, 404],
    [{row: {avatar_media_id: media}}, {owner, media, variant: '128.webp'}, 404],
  ]) {
    const route = mediaRoute({...setup, fetchImpl: async () => { throw Error('no fetch'); }});
    const response = await route.get(params);
    assert.equal(response.status, status);
    assert.equal(route.calls.fetch, 0);
  }
});

test('avatar media route serves immutable webp for the bound profile media', async () => {
  const bytes = await sharp({create: {width: 120, height: 90, channels: 3, background: '#2244aa'}}).webp().toBuffer();
  const route = mediaRoute({
    fetchImpl: async (url, init) => {
      assert.equal(url.pathname, `/storage/v1/object/authenticated/media/${owner}/avatar/${media}/96.webp`);
      assert.equal(init.headers.Authorization, 'Bearer offline-token');
      return new Response(bytes);
    },
  });
  const response = await route.get();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.equal(response.headers.get('content-type'), 'image/webp');
  assert.deepEqual(route.filters, [['id', owner]]);
});

test('profile avatar HTTP keeps session scope and blocks cross-account writes', {timeout: 90000}, async () => {
  for (const key of ['APP_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_DB_URL']) {
    assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env[key]).hostname), 'Disposable local only');
  }
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {auth: {persistSession: false}});
  const {user} = await signInTestClient(1);
  const {user: other, client: otherClient} = await signInTestClient(2);
  const cookie = await signInAsTestUser(1);
  const otherCookie = await signInAsTestUser(2);
  const origin = process.env.APP_URL;
  const photo = await sharp({create: {width: 640, height: 480, channels: 3, background: '#c8a070'}}).jpeg().toBuffer();
  const form = () => {
    const body = new FormData();
    body.set('photo', new Blob([photo], {type: 'image/jpeg'}), 'avatar.jpg');
    return body;
  };
  const paths = [];
  try {
    assert.equal((await fetch(`${origin}/api/profile/avatar`, {method: 'POST', body: form()})).status, 401);
    assert.equal((await fetch(`${origin}/api/profile/avatar`, {method: 'DELETE'})).status, 401);

    const first = await fetch(`${origin}/api/profile/avatar`, {method: 'POST', headers: {Cookie: cookie}, body: form()});
    const firstBody = await first.json();
    assert.equal(first.status, 200, JSON.stringify(firstBody));
    assert.ok(firstBody.avatar_media_id);
    paths.push(`${user.id}/avatar/${firstBody.avatar_media_id}/256.webp`, `${user.id}/avatar/${firstBody.avatar_media_id}/96.webp`);

    const beforeOther = (await admin.from('profiles').select('avatar_media_id').eq('id', other.id).single()).data?.avatar_media_id ?? null;
    const cross = await fetch(`${origin}/api/profile/avatar`, {method: 'POST', headers: {Cookie: otherCookie}, body: form()});
    assert.equal(cross.status, 200);
    const crossBody = await cross.json();
    paths.push(`${other.id}/avatar/${crossBody.avatar_media_id}/256.webp`, `${other.id}/avatar/${crossBody.avatar_media_id}/96.webp`);
    const afterOther = (await admin.from('profiles').select('avatar_media_id').eq('id', other.id).single()).data?.avatar_media_id;
    assert.notEqual(afterOther, firstBody.avatar_media_id);
    assert.equal((await admin.from('profiles').select('avatar_media_id').eq('id', user.id).single()).data?.avatar_media_id, firstBody.avatar_media_id);

    const foreignUpload = await otherClient.storage.from('media').upload(`${user.id}/avatar/${firstBody.avatar_media_id}/96.webp`, photo, {upsert: true});
    assert.ok(foreignUpload.error, 'second account cannot write the first account avatar object');

    const foreignDelete = await fetch(`${origin}/api/profile/avatar`, {method: 'DELETE', headers: {Cookie: otherCookie}});
    assert.equal(foreignDelete.status, 200);
    assert.equal((await admin.from('profiles').select('avatar_media_id').eq('id', user.id).single()).data?.avatar_media_id, firstBody.avatar_media_id);

    const removed = await fetch(`${origin}/api/profile/avatar`, {method: 'DELETE', headers: {Cookie: cookie}});
    assert.equal(removed.status, 200);
    assert.equal((await admin.from('profiles').select('avatar_media_id').eq('id', user.id).single()).data?.avatar_media_id, null);

    if (beforeOther) {
      await admin.from('profiles').update({avatar_media_id: beforeOther}).eq('id', other.id);
    } else {
      await admin.from('profiles').update({avatar_media_id: null}).eq('id', other.id);
      await admin.storage.from('media').remove(paths.filter(path => path.startsWith(`${other.id}/avatar/`)));
    }
  } finally {
    await admin.from('profiles').update({avatar_media_id: null}).eq('id', user.id);
    if (paths.length) await admin.storage.from('media').remove(paths);
  }
});
