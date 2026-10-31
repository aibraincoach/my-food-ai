import test from 'node:test';
import assert from 'node:assert/strict';
import {searchFoods,getFoodById} from '../src/lib/fdc/client.ts';
test('user search strings cannot poison typed exact-food cache entries',async()=>{
 const food={fdcId:77,description:'Exact food',dataType:'Foundation',foodNutrients:[]};
 const other={...food,fdcId:88,description:'Search food'};
 const cache=new Map([['fdc-detail:77',{foods:[other]}],['fdc-search:rice',{foods:[other]}]]);
 const admin={from(){let key;const q={select(){return q;},eq(_,value){key=value;return q;},maybeSingle(){return Promise.resolve({data:cache.has(key)?{response:cache.get(key)}:null,error:null,status:200});},upsert({query,response}){cache.set(query,response);return Promise.resolve({error:null,status:201});}};return q;}};
 const original=globalThis.fetch,oldKey=process.env.FDC_API_KEY;process.env.FDC_API_KEY='fixture';const requests=[];
 try{
  globalThis.fetch=async url=>{const u=new URL(url);requests.push(u.pathname);return Response.json(u.pathname.includes('/food/')?food:{foods:[food]});};
  assert.equal((await getFoodById(admin,77)).fdcId,77); // recover legacy search collision
  assert.equal((await searchFoods(admin,'fdc-detail:77'))[0].fdcId,77); // typed detail is not a search response
  assert.equal((await searchFoods(admin,'rice'))[0].fdcId,77); // reject old prefixed search collision
  const before=requests.length;await getFoodById(admin,77);await searchFoods(admin,'rice');assert.equal(requests.length,before);
  assert.equal(cache.get('fdc-detail:77').kind,'fdc-detail-v1');assert.equal(cache.get('fdc-search-v2:rice').query,'rice');
 }finally{globalThis.fetch=original;if(oldKey===undefined)delete process.env.FDC_API_KEY;else process.env.FDC_API_KEY=oldKey;}
});
