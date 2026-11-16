// A feed's nutrition and feedback revision must describe the same analysis.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {toFeedPosts,hasUnavailableFields} from '../src/lib/posts/feed.ts';
const row={id:'meal',user_id:'owner',status:'ready',caption:'',created_at:'2026-11-16',eaten_at:'2026-11-16'};
function db(revisions){let call=0;return createClient('https://fixture.invalid','fixture',{global:{fetch:async input=>{
 const url=new URL(input instanceof Request?input.url:String(input));
 if(url.pathname.endsWith('/rpc/feedback_revisions')){const revision=revisions[call++];if(revision==='error')return Response.json({message:'fixture unavailable'},{status:503});return Response.json([{post_id:'meal',revision}]);}
 return Response.json([]);
}}});}
test('a revision race or unavailable revision read marks a ready server card for repair',async()=>{
 for(const readings of [[{fingerprint:'a',modelCommentId:'a'},{fingerprint:'b',modelCommentId:'b'}],['error','error']]){
  const [post]=await toFeedPosts(db(readings),[row]);assert.equal(post.revisionUnavailable,true);assert.equal(hasUnavailableFields(post),true);assert.equal(post.analysisFingerprint,null);
 }
});
test('consistent and genuinely empty revisions do not add a redundant repair read',async()=>{
 for(const revision of [null,{fingerprint:'same',modelCommentId:'same'}]){
  const [post]=await toFeedPosts(db([revision,revision]),[row]);assert.equal(post.revisionUnavailable,false);assert.equal(post.analysisFingerprint,revision?.fingerprint??null);
 }
});
