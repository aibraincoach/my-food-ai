import assert from 'node:assert/strict';
import test from 'node:test';
import Module, {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {loadFirstPhoto} from '../src/lib/pipeline/analyze.ts';

test('privileged photo reads reject historical metadata outside the meal namespace', async () => {
  for (const path of ['owner/meal/0.jpg','victim/meal/0.jpg','owner/other/0.jpg','owner/meal/../other/0.jpg']) {
    let downloads = 0;
    const client = createClient('https://fixture.invalid','fixture-key',{global:{fetch:async input=>{
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.pathname.endsWith('/post_media')) return Response.json({storage_path:path,width:1,height:1});
      if (url.pathname.endsWith('/posts')) return Response.json({user_id:'owner'});
      if (url.pathname.includes('/storage/')) {downloads++;return new Response(new Uint8Array([1]));}
      throw new Error('Unexpected fixture request');
    }}});
    if (path === 'owner/meal/0.jpg') assert.equal((await loadFirstPhoto(client,'meal')).bytes.length,1);
    else await assert.rejects(loadFirstPhoto(client,'meal'),/does not belong/);
    assert.equal(downloads,path === 'owner/meal/0.jpg' ? 1 : 0);
  }
});

test('privileged card cleanup never deletes a forged foreign or traversing path', async () => {
  const originalLoad = Module._load;
  Module._load = function (name, ...args) {
    if (name === 'next/og') return {ImageResponse: class {async arrayBuffer() {return new ArrayBuffer(1);}}};
    return originalLoad.call(this, name, ...args);
  };
  let renderResultsCard;
  try { ({renderResultsCard} = createRequire(import.meta.url)('../src/lib/pipeline/results-card.tsx')); }
  finally {Module._load = originalLoad;}
  const user = '11111111-1111-1111-1111-111111111111';
  const post = '22222222-2222-2222-2222-222222222222';
  const generation = '33333333-3333-3333-3333-333333333333';
  const own = `${user}/${post}/cards/${generation}/card.png`;
  for (const oldPath of [own, `victim/${post}/cards/${generation}/card.png`, `${user}/other/cards/${generation}/card.png`, `${user}/${post}/cards/../../victim/card.png`, `${own}?other=1`]) {
    const removed = [];
    const admin = {
      rpc: async name => ({data: name === 'results_card_snapshot'
        ? {user_id:user,eaten_at:'2026-10-28T00:00:00Z',fingerprint:'fixture',items:[]}
        : {published:true,old_path:oldPath}, error:null}),
      storage: {from: () => ({upload:async()=>({error:null}),remove:async paths=>{removed.push(...paths);return {error:null};}})},
    };
    assert.equal(await renderResultsCard(admin,post,'job'),true);
    assert.deepEqual(removed,oldPath === own ? [own] : []);
  }
});

test('clients cannot forge generated card pointers and old forged pointers are never returned for cleanup', () => {
  assert.ok(process.env.SUPABASE_DB_URL);
  const migrations = [
    ['0007_post_items_supersede.sql',"to_regprocedure('public.edit_post_item(uuid,uuid,text,uuid,text,numeric,jsonb)')"],
    ['0007b_comment_corrections.sql',"to_regprocedure('public.post_work_matches(uuid,uuid)')"],
    ['0008_post_media_kind.sql',"to_regprocedure('public.protect_generated_card_media()')"],
  ].map(([name,probe]) => `select ${probe} is not null as installed \\gset
\\if :installed
\\else
${readFileSync(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8')}
\\endif`).join('\n');
  const sql = `\\set ON_ERROR_STOP on
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
${migrations}
do $test$
declare u uuid:=gen_random_uuid();p uuid;photo uuid;card uuid;result jsonb;new_path text;
begin
 insert into auth.users(id)values(u);
 insert into profiles(id,handle)values(u,'card-access-'||u);
 insert into posts(user_id,status)values(u,'ready')returning id into p;
 insert into post_media(post_id,kind,storage_path)values(p,'photo',u::text||'/'||p::text||'/0.jpg')returning id into photo;
 -- Reproduce an already-stored forged pointer from before protection existed.
 insert into post_media(post_id,kind,storage_path)values(p,'card','victim/another-meal/cards/secret/card.png')returning id into card;
 perform set_config('request.jwt.claims',json_build_object('sub',u,'role','authenticated')::text,true);
 perform set_config('role','authenticated',true);
 update post_media set width=50 where id=photo;
 if not found then raise exception 'ordinary owner photo update was blocked';end if;
 begin update post_media set storage_path='victim/other/0.jpg' where id=photo;
  raise exception 'foreign photo pointer accepted';exception when insufficient_privilege then null;end;
 begin insert into post_media(post_id,kind,storage_path)values(p,'photo',u::text||'/'||p::text||'/../other/0.jpg');
  raise exception 'traversing photo pointer accepted';exception when insufficient_privilege then null;end;
 begin update post_media set storage_path='victim/other.png' where id=card;
  raise exception 'card pointer forgery accepted';exception when insufficient_privilege then null;end;
 begin update post_media set kind='card' where id=photo;
  raise exception 'photo-to-card forgery accepted';exception when insufficient_privilege then null;end;
 begin insert into post_media(post_id,kind,storage_path)values(p,'card','victim/new.png');
  raise exception 'card insertion accepted';exception when insufficient_privilege then null;end;
 begin delete from post_media where id=card;
  raise exception 'generated card deletion accepted';exception when insufficient_privilege then null;end;
 perform set_config('role','none',true);
 new_path:=u::text||'/'||p::text||'/cards/'||gen_random_uuid()::text||'/card.png';
 result:=publish_results_card(p,results_card_snapshot(p)->>'fingerprint',new_path,1080);
 if not (result->>'published')::boolean or result->>'old_path' is not null then raise exception 'forged old path escaped publication';end if;
 result:=publish_results_card(p,results_card_snapshot(p)->>'fingerprint',u::text||'/'||p::text||'/cards/'||gen_random_uuid()::text||'/card.png',1080);
 if not (result->>'published')::boolean or result->>'old_path' is distinct from new_path then raise exception 'valid owned old card was not returned';end if;
end;
$test$;
rollback;`;
  const result=spawnSync('psql',['-X','-q','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:90000});
  assert.ifError(result.error);
  assert.equal(result.status,0,result.stderr);
});
