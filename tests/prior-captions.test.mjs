import assert from 'node:assert/strict';
import test from 'node:test';
import {createClient} from '@supabase/supabase-js';
import {findPrior} from '../src/lib/pipeline/prior.ts';

test('a changed caption reaches confirmation before prior nutrition can be copied',async()=>{
  const savedFetch=globalThis.fetch, savedKey=process.env.MODEL_API_KEY;
  process.env.MODEL_API_KEY='fixture-key';
  let confirmation;
  globalThis.fetch=async(_url,options)=>{
    const url=new URL(_url instanceof Request?_url.url:String(_url));
    if(url.pathname.endsWith('/rest/v1/model_calls'))return new Response(null,{status:201});
    assert.equal(url.pathname,'/v1/responses');
    const request=JSON.parse(options.body);
    confirmation=JSON.parse(request.input[0].content[0].text);
    const same=confirmation.current_caption===confirmation.past_caption;
    return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({same_meal:same})}]}]});
  };
  const db=createClient('https://fixture.invalid','fixture-key',{global:{fetch:async input=>{
    const url=new URL(input instanceof Request?input.url:String(input));
    if(url.pathname.endsWith('/rpc/meal_prior_candidates'))return Response.json([{post_id:'past',text_score:1,photo_score:1,distance_m:0}]);
    if(url.pathname.endsWith('/post_items'))return Response.json([{id:'item',name:'Rice',portion_text:'one bowl',portion_grams:100,confidence:1,item_nutrition:[{calories:130}]}]);
    if(url.pathname.endsWith('/post_media'))return Response.json([{storage_path:'fixture.jpg',width:10,height:10}]);
    if(url.pathname.includes('/storage/'))return new Response(new Uint8Array([1,2,3]),{headers:{'Content-Type':'image/jpeg'}});
    if(url.pathname.endsWith('/posts'))return Response.json({user_id:'owner',caption:url.searchParams.get('id')==='eq.current'?'Two bowls of rice':'One bowl of rice'});
    throw Error('Unexpected fixture request');
  }}});
  try{
    const result=await findPrior(db,'current');
    assert.equal(confirmation.current_caption,'Two bowls of rice');
    assert.equal(confirmation.past_caption,'One bowl of rice');
    assert.equal(result.named,undefined,'different portions cannot reuse prior nutrition');
  }finally{globalThis.fetch=savedFetch;if(savedKey===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=savedKey;}
});

test('captionless identical photos reach confirmation but never copy without its approval',async()=>{
  const {priorScore}=await import('../src/lib/pipeline/prior.ts');
  assert.equal(priorScore({text_score:null,photo_score:1,distance_m:null}),1);
  assert.equal(priorScore({text_score:null,photo_score:null,distance_m:null}),0);
  const savedFetch=globalThis.fetch,savedKey=process.env.MODEL_API_KEY;
  process.env.MODEL_API_KEY='fixture-key';
  let approved=false,calls=0;
  globalThis.fetch=async input=>{const url=new URL(input instanceof Request?input.url:String(input));if(url.pathname.endsWith('/rest/v1/model_calls'))return new Response(null,{status:201});assert.equal(url.pathname,'/v1/responses');calls++;return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({same_meal:approved})}]}]});};
  const db=createClient('https://fixture.invalid','fixture-key',{global:{fetch:async input=>{
    const url=new URL(input instanceof Request?input.url:String(input));
    if(url.pathname.endsWith('/rpc/meal_prior_candidates'))return Response.json([{post_id:'past',text_score:null,photo_score:1,distance_m:null}]);
    if(url.pathname.endsWith('/post_items'))return Response.json([{id:'item',name:'Rice',portion_grams:100,item_nutrition:[{calories:130}]}]);
    if(url.pathname.endsWith('/post_media'))return Response.json([{storage_path:'fixture.jpg',width:10,height:10}]);
    if(url.pathname.includes('/storage/'))return new Response(new Uint8Array([1,2,3]),{headers:{'Content-Type':'image/jpeg'}});
    if(url.pathname.endsWith('/posts'))return Response.json({user_id:'owner',caption:''});
    throw Error('Unexpected fixture request');
  }}});
  try{
    assert.equal((await findPrior(db,'current')).named,undefined);
    approved=true;
    const accepted=await findPrior(db,'current');
    assert.equal(calls,2);
    assert.equal(accepted.named.captionOnly[0].portionGrams,100);
    assert.equal(accepted.nutrition[0].calories,130);
  }finally{globalThis.fetch=savedFetch;if(savedKey===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=savedKey;}
});
