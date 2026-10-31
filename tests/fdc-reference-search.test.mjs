import test from 'node:test';
import assert from 'node:assert/strict';
import {searchFoods,FDC_SEARCH_CACHE_KIND} from '../src/lib/fdc/client.ts';
import {matchFood,foodSearchQuery} from '../src/lib/fdc/match.ts';
import {gramBasis} from '../src/lib/fdc/nutrients.ts';

test('new catalog includes prepared-food references and never reads old five-hit caches',async()=>{
 const original=globalThis.fetch,old=process.env.FDC_API_KEY;process.env.FDC_API_KEY='fixture-only';
 const food={fdcId:17,description:'Mixed salad greens, raw',dataType:'Survey (FNDDS)',foodNutrients:[]};
 const cache=new Map([['green salad',{foods:[{...food,fdcId:999}]}],['fdc-search:green salad',{kind:'fdc-search-v1',query:'green salad',payload:{foods:[{...food,fdcId:998}]}}]]);
 const readKeys=[];let requests=0;
 const admin={from(){let key;const q={select(){return q},eq(_k,value){key=value;readKeys.push(key);return q},async maybeSingle(){return{data:cache.has(key)?{response:cache.get(key)}:null,error:null}},async upsert(row){cache.set(row.query,row.response);return{error:null}}};return q}};
 globalThis.fetch=async(url,init)=>{requests++;assert.equal(new URL(url).pathname,'/fdc/v1/foods/search');assert.equal(init.method,'POST');const body=JSON.parse(init.body);assert.deepEqual(body.dataType,['Foundation','SR Legacy','Survey (FNDDS)','Branded']);assert.equal(body.pageSize,30);assert.equal(body.query,'green salad');return Response.json({foods:[food]})};
 try{assert.equal((await searchFoods(admin,'green salad'))[0].fdcId,17);assert.equal((await searchFoods(admin,'green salad'))[0].fdcId,17);assert.equal(requests,1);assert.deepEqual(readKeys,[`${FDC_SEARCH_CACHE_KIND}:green salad`,`${FDC_SEARCH_CACHE_KIND}:green salad`]);assert.equal(cache.get('green salad').foods[0].fdcId,999)}
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
