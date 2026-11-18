// node --import tsx --test tests/meal-read-one-query.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NEXT_PUBLIC_SUPABASE_URL='https://fixture.invalid';process.env.SUPABASE_SECRET_KEY='fixture';
const {getPostDetail}=await import('../src/lib/posts/items.ts');

// #1102, rule 5: the meal is read once, with identify_model and identify_host. A failed read fails visibly; it is
// never repeated without those columns.
function db(error){const reads=[];return{reads,from(table){const read={table,select:null};reads.push(read);const chain=new Proxy({},{get(_t,key){
 if(key==='select')return selection=>{read.select=selection;return chain;};
 if(key==='maybeSingle'||key==='single')return async()=>({data:null,error,status:400});
 if(key==='then')return undefined;return()=>chain;}});return chain;}};}

test('a meal read that the database rejects is one request and fails the page',async()=>{
 const missing=db({code:'42703',message:'column posts.identify_model does not exist'});
 await assert.rejects(()=>getPostDetail(missing,'10000000-0000-4000-8000-000000000001'),/Meal could not be loaded/);
 const posts=missing.reads.filter(read=>read.table==='posts');
 assert.equal(posts.length,1);assert.match(posts[0].select,/identify_model,identify_host/);
});
