import test from 'node:test';
import assert from 'node:assert/strict';
import {searchFoods,FDC_SEARCH_CACHE_KIND,foodSearchTrace,strictGenericQuery,FDC_GENERIC_DATA_TYPES} from '../src/lib/fdc/client.ts';
import {traceText} from '../src/lib/trace/record.ts';
import {matchFood,foodSearchQuery,requiredFoodSearchQuery} from '../src/lib/fdc/match.ts';
import {gramBasis} from '../src/lib/fdc/nutrients.ts';

test('new catalog includes prepared-food references and never reads old five-hit caches',async()=>{
 const original=globalThis.fetch,old=process.env.FDC_API_KEY;process.env.FDC_API_KEY='fixture-only';
 const food={fdcId:17,description:'Mixed salad greens, raw',dataType:'Survey (FNDDS)',foodNutrients:[]};
 const cache=new Map([['green salad',{foods:[{...food,fdcId:999}]}],['fdc-search:green salad',{kind:'fdc-search-v1',query:'green salad',payload:{foods:[{...food,fdcId:998}]}}]]);
 const readKeys=[];let requests=0;
 const admin={from(){let key;const q={select(){return q},eq(_k,value){key=value;readKeys.push(key);return q},async maybeSingle(){return{data:cache.has(key)?{response:cache.get(key)}:null,error:null}},async upsert(row){cache.set(row.query,row.response);return{error:null}}};return q}};
 globalThis.fetch=async(url,init)=>{const u=new URL(url);if(u.pathname.endsWith('/model_calls'))return Response.json(null);assert.equal(u.hostname,'api.nal.usda.gov');requests++;assert.equal(new URL(url).pathname,'/fdc/v1/foods/search');assert.equal(init.method,'POST');const body=JSON.parse(init.body);assert.deepEqual(body.dataType,requests===1?['Foundation','SR Legacy','Survey (FNDDS)','Branded']:FDC_GENERIC_DATA_TYPES);assert.equal(body.pageSize,30);assert.equal(body.query,requests===1?'green salad':'+green +salad');return Response.json({foods:[food]})};
 try{assert.equal((await searchFoods(admin,'green salad'))[0].fdcId,17);assert.equal((await searchFoods(admin,'green salad'))[0].fdcId,17);assert.equal(requests,2);assert.deepEqual(readKeys,[`${FDC_SEARCH_CACHE_KIND}:green salad`,`${FDC_SEARCH_CACHE_KIND}:green salad`]);assert.equal(cache.get('green salad').foods[0].fdcId,999)}
 finally{globalThis.fetch=original;if(old===undefined)delete process.env.FDC_API_KEY;else process.env.FDC_API_KEY=old}
});

test('target query is explicit on refinement; punctuation is not USDA search syntax',async()=>{
 const queries=[],decisions=[];const food={fdcId:1,description:'Whole prepared food',dataType:'Survey (FNDDS)',foodNutrients:[{nutrientId:1008,value:100}]};
 const result=await matchFood('Regional dish (one portion','Other meal food',{search:async q=>{queries.push(q);return queries.length===1?[]:[food]},choose:async(name,caption,foods,retry,currentQuery)=>{decisions.push({name,caption,retry,currentQuery});return retry?{id:1,query:null,reason:'whole dish'}:{id:null,query:'prepared (whole) food',reason:'translated target'}}});
 assert.deepEqual(queries,['Regional dish one portion','prepared whole food']);assert.deepEqual(decisions.map(d=>d.currentQuery),queries);assert.equal(result.food.fdcId,1);assert.equal(result.searches,2);
 assert.equal(foodSearchQuery('fish: (coated) + fried - sauce'),'fish coated fried sauce');
 assert.equal((await matchFood('()','',{search:async()=>{throw Error('must not search')},choose:async()=>{throw Error('must not choose')}})).searches,0);
});

test('gram portions reject volume and unsupported activity units while accepting USDA gram codes',()=>{
 const food={dataType:'Branded'};
 for(const servingSizeUnit of ['ml',' mL ','IU','each'])assert.equal(gramBasis({...food,servingSizeUnit}),false);
 for(const servingSizeUnit of ['g','GRM','oz'])assert.equal(gramBasis({...food,servingSizeUnit}),true);
});

test('all sixty candidate identities and core values survive long escaped descriptions and aliases',()=>{
 const foods=Array.from({length:60},(_,i)=>({fdcId:i+1,description:'food \"\\'.repeat(1000),additionalDescriptions:'alias \"\\'.repeat(2000),dataType:'Survey (FNDDS)',foodNutrients:Array.from({length:200},(_,j)=>({nutrientId:[1008,2047,2048,1003,1004,1005][j]??(3000+j),value:j,unitName:'MG'}))}));
 const text=traceText(foodSearchTrace(foods));assert.ok(text.length<60000);
 const decoded=JSON.parse(text);assert.equal(decoded.projection,'candidate-identities-and-core-nutrients');assert.deepEqual(decoded.foods.map(f=>f.fdcId),foods.map(f=>f.fdcId));
 assert.deepEqual(decoded.foods.map(f=>f.nutrients),foods.map(food=>food.foodNutrients.slice(0,6).map(n=>({id:n.nutrientId,value:n.value,unit:n.unitName}))));
});

test('refined queries require the translated base food and normalize preparation across dishes',()=>{
 assert.equal(requiredFoodSearchQuery('pork breaded fried','pork'),'+pork coated fried');
 assert.equal(requiredFoodSearchQuery('fish battered cooked','fish'),'+fish coated cooked');
 assert.throws(()=>requiredFoodSearchQuery('cooked grain','another'),/required food term/);
 assert.throws(()=>requiredFoodSearchQuery('cooked grain','two words'),/required food term/);
});

test('strict generic words escape search operators and punctuation without food special cases',()=>{
 assert.equal(strictGenericQuery(' +Butternut, (squash) -soup OR soup!'),'+butternut +squash +soup +or');
 assert.equal(strictGenericQuery('rice/rice & beans'),'+rice +beans');
 assert.equal(strictGenericQuery('() + -'),null);
 assert.equal(strictGenericQuery(Array.from({length:33},(_,i)=>'word'+i).join(' ')),null);
});

test('strict generic aliases augment all thirty broad identities and replace neither order nor nutrition',async()=>{
 const old=globalThis.fetch,key=process.env.FDC_API_KEY;process.env.FDC_API_KEY='fixture';
 const broad=Array.from({length:30},(_,i)=>({fdcId:i+1,description:'Broad '+i,dataType:'Branded',foodNutrients:[]}));
 const alias={fdcId:99,description:'Soup, pumpkin',additionalDescriptions:'squash, butternut squash, sweet potato, or carrot soup',dataType:'Survey (FNDDS)',foodNutrients:[]};
 const cache=new Map([['fdc-search-v2:butternut squash soup',{kind:'fdc-search-v2',query:'butternut squash soup',payload:{foods:[]}}]]);
 const db={from(){let key;return {select(){return this},eq(_,v){key=v;return this},async maybeSingle(){return {data:cache.has(key)?{response:cache.get(key)}:null,error:null}},async upsert(row){cache.set(row.query,row.response);return {error:null}}}}};
 let calls=0;
 globalThis.fetch=async(url,init)=>{if(new URL(url).pathname.endsWith('/model_calls'))return Response.json(null);calls++;const body=JSON.parse(init.body);assert.equal(body.pageSize,30);if(calls===1){assert.equal(body.query,'butternut squash soup');return Response.json({foods:broad})}assert.equal(body.query,'+butternut +squash +soup');assert.deepEqual(body.dataType,FDC_GENERIC_DATA_TYPES);return Response.json({foods:[{...broad[7],description:"Different duplicate",additionalDescriptions:"Duplicate alias",foodNutrients:[{nutrientId:1008,nutrientName:"Energy",unitName:"KCAL",value:999}]},alias]})};
 try{
  const foods=await searchFoods(db,'butternut squash soup');assert.deepEqual(foods.slice(0,30).map(f=>f.fdcId),broad.map(f=>f.fdcId));assert.deepEqual(foods.slice(0,30).map(f=>f.description),broad.map(f=>f.description));assert.equal(foods.length,31);assert.deepEqual(foods[7].foodNutrients,[],'generic duplicate never replaces original nutrition');assert.equal(foods[7].additionalDescriptions,'Duplicate alias');assert.equal(foods[30].fdcId,alias.fdcId);assert.equal(foods[30].additionalDescriptions,alias.additionalDescriptions);
  assert.equal(foodSearchTrace(foods).foods[30].additionalDescriptions,alias.additionalDescriptions);
  assert.deepEqual(await searchFoods(db,'butternut squash soup'),foods);assert.equal(calls,2,'v3 merged cache is reused, v2 is ignored');
 }finally{globalThis.fetch=old;if(key===undefined)delete process.env.FDC_API_KEY;else process.env.FDC_API_KEY=key;}
});


test('a third search tries the base food before declaring nutrition unavailable',async()=>{
 const queries=[];
 const steak={fdcId:42,description:'Beef steak, cooked',dataType:'Survey (FNDDS)',foodNutrients:[{nutrientId:1008,value:200}]};
 const result=await matchFood('beef tenderloin steak','',{
  search:async query=>{queries.push(query);return query==='beef'?[steak]:[]},
  choose:async(_name,_caption,foods,retry)=>foods.length?{id:42,query:null,query_food:null,reason:'Compatible steak'}:retry?{id:null,query:null,query_food:null,reason:'No compatible refined result'}:{id:null,query:'beef steak',query_food:'beef',reason:'Try a broader reference'},
 });
 assert.deepEqual(queries,['beef tenderloin steak','+beef steak','beef']);
 assert.equal(result.food.fdcId,42);
 assert.equal(result.searches,3);
});


test('distinct second refinement retains earlier eligible identities and original nutrients',async()=>{
 const original={fdcId:81,description:'Whole dish, NFS',foodNutrients:[{nutrientId:1008,value:180}]};
 const other={fdcId:82,description:'Other dish',foodNutrients:[{nutrientId:1008,value:220}]};
 const queries=[],remaining=[];
 const result=await matchFood('assembled dish','',{
  search:async query=>{queries.push(query);return queries.length===1?[original]:queries.length===2?[{...original,foodNutrients:[{nutrientId:1008,value:999}]},other]:[other]},
  choose:async(_name,_caption,foods,_retry,_query,left)=>{
   remaining.push(left);
   assert.equal(foods[0],original,'a later duplicate cannot replace original reference values');
   if(left===2)return {id:null,query:'whole dish',query_food:'dish',reason:'Refine'};
   if(left===1)return {id:null,query:'assembled food',query_food:'food',reason:'Different refinement'};
   assert.deepEqual(foods.map(f=>f.fdcId),[81,82]);
   return {id:81,query:null,query_food:null,reason:'Reconsidered compatible whole-dish reference'};
  },
 });
 assert.deepEqual(queries,['assembled dish','whole +dish','assembled +food']);
 assert.deepEqual(remaining,[2,1,0]);assert.equal(result.food,original);
});

test('repeated refinements cannot loop and rejected compound foods remain unavailable',async()=>{
 const queries=[];
 const result=await matchFood('mixed dish','',{
  search:async query=>{queries.push(query);return []},
  choose:async()=>({id:null,query:'mixed dish',query_food:'dish',reason:'No complete component coverage'}),
 });
 assert.deepEqual(queries,['mixed dish','mixed +dish','dish']);
 assert.equal(result.food,null);assert.equal(result.searches,3);
});

test('a first decision that names no base food still yields the bare name for the closest-record step', async()=>{const queries=[];const result=await matchFood('Pickled ginger','Load test 18',{search:async query=>{queries.push(query);return []},choose:async()=>({id:null,query:null,query_food:null,reason:'All candidates are Branded'})});assert.deepEqual(queries,['Pickled ginger']);assert.equal(result.food,null);assert.equal(result.searches,1);assert.equal(result.baseFood,'Pickled ginger');});


test('references cannot silently omit a component such as Caesar dressing',async()=>{
 const nutrient={nutrientId:1008,value:150};
 const foods=[{fdcId:1,description:'Chicken caesar salad, no dressing',dataType:'Survey (FNDDS)',foodNutrients:[nutrient]},{fdcId:2,description:'Chicken caesar salad, with dressing',dataType:'Survey (FNDDS)',foodNutrients:[nutrient]}];
 const result=await matchFood('Chicken caesar salad','',{
  search:async()=>foods,
  choose:async(_name,_caption,candidates)=>{assert.deepEqual(candidates.map(food=>food.fdcId),[2]);return{id:2,query:null,query_food:null,reason:'With dressing'}}
 });
 assert.equal(result.food.fdcId,2);
});

test('explicit target exclusions and preparation notes stay eligible',async()=>{
 const {excludedComponents}=await import('../src/lib/fdc/exclusions.ts');
 assert.deepEqual(excludedComponents('Rice, white, cooked, no added fat','steamed white rice'),[]);
 assert.deepEqual(excludedComponents('Salad, no dressing','green salad no dressing'),[]);
 assert.deepEqual(excludedComponents('Salad, no dressing','green salad without dressing'),[]);
 assert.deepEqual(excludedComponents('Salad, no dressing','green salad no dressingless sauce'),['no dressing']);
 for(const note of ['no salt','without sugar','no fat'])assert.deepEqual(excludedComponents(`Rice, ${note}`,'rice'),[]);
 assert.deepEqual(excludedComponents('Salad, without croutons','green salad'),['without croutons']);
});

test('multiword excluded components cannot collide on their first adjective',async()=>{
 const {excludedComponents}=await import('../src/lib/fdc/exclusions.ts');
 assert.deepEqual(excludedComponents('Salad, no hot peppers','salad no hot sauce'),['no hot peppers']);
 assert.deepEqual(excludedComponents('Salad, without hot sauce','salad without hot peppers'),['without hot sauce']);
 assert.deepEqual(excludedComponents('Salad, no hot peppers','salad without hot peppers please'),[]);
 assert.deepEqual(excludedComponents('Salad, no hot peppers, with cheese','salad without hot peppers'),[]);
 assert.deepEqual(excludedComponents('Salad, no dressing','salad without dressing please'),[]);
 assert.deepEqual(excludedComponents('Salad, no hot peppers and no cheese','salad without hot peppers, no cheese'),[]);
 assert.deepEqual(excludedComponents('Salad, no hot peppers and no cheese','salad without hot peppers'),['no cheese']);
});

test('candidate matching rejects a missing multiword component despite a different target exclusion',async()=>{
 const nutrient={nutrientId:1008,value:150};
 const foods=[{fdcId:1,description:'Salad, no hot peppers',dataType:'Survey (FNDDS)',foodNutrients:[nutrient]},{fdcId:2,description:'Salad, no hot sauce',dataType:'Survey (FNDDS)',foodNutrients:[nutrient]}];
 const result=await matchFood('Salad','without hot sauce',{
  search:async()=>foods,
  choose:async(_name,_caption,candidates)=>{assert.deepEqual(candidates.map(food=>food.fdcId),[2]);return{id:2,query:null,query_food:null,reason:'Matches sauce exclusion'}}
 });
 assert.equal(result.food.fdcId,2);
});
