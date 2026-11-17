// node --import tsx --test tests/reanalysis-prior.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createRequire} from 'node:module';
const analyze=createRequire(import.meta.url)('../src/lib/worker/jobs/analyze.ts').default;

// The handler reads the post and its photos, then (for an ordinary single-photo meal) asks for
// earlier meals. The fixture stops the run at the first read made by the analysis itself.
async function requests(payload){
 const seen=[];let posts=0;
 const db=createClient('http://127.0.0.1:1','fixture',{auth:{persistSession:false},global:{fetch:async input=>{
  const path=new URL(input).pathname;seen.push(path.slice(path.lastIndexOf('/')+1));
  if(path.endsWith('/posts'))return Response.json(posts++===0?[{analysis_initialized_at:null,question:null}]:[]);
  if(path.endsWith('/post_media'))return Response.json([{id:'photo',not_eaten:false}]);
  if(path.endsWith('/rpc/meal_prior_candidates'))return Response.json([]);
  throw Error(`Unexpected fixture request ${path}`);
 }}});
 await assert.rejects(analyze(db,{id:'job',post_id:'post',kind:'analyze',payload}),/post/i);
 return seen;
}

test('an ordinary single-photo analysis consults earlier meals',async()=>{
 assert.deepEqual(await requests({}),['posts','post_media','meal_prior_candidates','posts']);
});

test('an operator re-analysis never consults earlier meals: no hint and no copied numbers',async()=>{
 for(const payload of [{operator:'reanalysis'},{operator:'reanalysis',post_ownership:true}]){
  assert.deepEqual(await requests(payload),['posts','post_media','posts']);
 }
});
