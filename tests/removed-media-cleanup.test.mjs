// Run: node --import tsx --test tests/removed-media-cleanup.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createRequire} from 'node:module';
const cleanup=createRequire(import.meta.url)('../src/lib/worker/jobs/media_cleanup.ts').default;
const owner='10000000-0000-4000-8000-000000000001',post='20000000-0000-4000-8000-000000000001',media='30000000-0000-4000-8000-000000000001';
const paths=[`${owner}/${post}/3.jpg`,`${owner}/${post}/3.feed.jpg`];
function fixture(claimed=[]){const calls=[];const db=createClient('http://127.0.0.1:1','fixture',{auth:{persistSession:false},global:{fetch:async(input,init)=>{const url=new URL(input);calls.push({path:url.pathname,query:url.searchParams,body:init?.body});if(url.pathname.endsWith('/post_media'))return Response.json(claimed);if(url.pathname.endsWith('/object/media'))return Response.json([]);throw Error(`Unexpected cleanup request ${url.pathname}`);}}});return {db,calls};}
const job=(overrides={})=>({id:'job',post_id:null,payload:{owner_id:owner,deleted_post_id:post,removed_media_id:media,exact:true,paths,...overrides}});
test('removed-photo cleanup removes exactly its original/feed pair and does not list the meal prefix',async()=>{
 const {db,calls}=fixture();await cleanup(db,job());
 assert.equal(calls.length,2);assert.ok(calls[0].query.get('or').includes(`id.eq.${media}`));assert.deepEqual(JSON.parse(calls[1].body).prefixes,paths);
});
test('a path claimed by another media row is never deleted',async()=>{
 const {db,calls}=fixture([{id:'new-claim'}]);await cleanup(db,job());assert.equal(calls.length,1);
});
test('foreign, mismatched and traversal paths fail before storage access',async()=>{
 for(const bad of [[paths[0],`${owner}/${post}/4.feed.jpg`],[paths[0],`victim/${post}/3.feed.jpg`],[paths[0],`${owner}/${post}/../3.feed.jpg`]]){
  const {db,calls}=fixture();await assert.rejects(cleanup(db,job({paths:bad})));assert.equal(calls.length,0);
 }
});
