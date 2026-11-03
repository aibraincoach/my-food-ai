import test from'node:test';import assert from'node:assert/strict';
import{photoDrinkVolume}from'../src/lib/intake/drink-volume.ts';

test('explicit ml accepts the observed parenthesized model text and existing forms without inferring volume',()=>{
 for(const [text,expected]of[
  ['1 slim can (330 ml, read from the can)',330],
  ['330 ml read from the can',330],['300 ml estimated from the photo',300],
  ['1 glass (250.5 mL, estimated from the photo)',251],['1 bottle (5000 ml)',5000],
  ['1 can',null],['330 g read from the can',null],['1 can (330 grams)',null],
  ['(-330 ml)',null],['(0 ml)',null],['(5001 ml)',null],['(Infinity ml)',null],
  ['(NaN ml)',null],['330 mlunknown',null],[null,null],[undefined,null]
 ])assert.equal(photoDrinkVolume(text),expected,String(text));
});

test('the actual cola identify text produces the drink card, source, volume and hydration nutrient offline',async()=>{
 process.env.MODEL_API_BASE_URL='https://meta.invalid/v1';process.env.MODEL_API_KEY='offline-fixture';
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://trace.invalid';process.env.SUPABASE_SECRET_KEY='offline-fixture';
 const{identifyDrinks}=await import('../src/lib/intake/identify-drinks.ts');
 const original=globalThis.fetch,calls=[];
 const food={fdcId:990040,description:'Beverages, carbonated, cola, regular',foodCategory:'Soft drinks',dataType:'SR Legacy',foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:42},{nutrientId:1057,nutrientName:'Caffeine',unitName:'MG',value:9}]};
 const admin={from(table){assert.equal(table,'fdc_cache');let query;const chain={select(){return this;},eq(_field,value){query=value.replace(/^fdc-search-v3:/,'');return this;},abortSignal(){return this;},async maybeSingle(){return{data:{response:{kind:'fdc-search-v3',query,payload:{foods:[food]}}},error:null};}};return chain;}};
 globalThis.fetch=async(input,init)=>{const url=new URL(input);if(url.hostname==='trace.invalid')return new Response(null,{status:201});assert.equal(url.hostname,'meta.invalid','No actual model, USDA or production request allowed');const body=JSON.parse(init.body),kind=body.text.format.name;calls.push(kind);const output=kind==='identify'?{nutrition_label:false,needs_input:null,summary:'Cola',items:[{name:'Coca-Cola',region_index:null,portion_grams:330,portion_text:'1 slim can (330 ml, read from the can)',confidence:0.9}]}:{id:990040,query:null,query_food:null,reason:'Offline cola reference'};return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(output)}]}],usage:{input_tokens:1,output_tokens:1}});};
 try{const result=await identifyDrinks(admin,'fixture-owner',new Uint8Array([1]));assert.equal(result.allDrinks,true);assert.equal(result.drinks.length,1);const drink=result.drinks[0];assert.equal(drink.ml,330);assert.equal(drink.grams,330);assert.equal(drink.source,'read from the can');assert.equal(drink.name,'Coca-Cola, can');assert.equal(drink.caffeineMg,29.7);assert.equal(drink.nutrition.micronutrients.find(n=>n.nutrientId===1051).value,330);assert.deepEqual(calls,['identify','search_query']);}finally{globalThis.fetch=original;}
});
