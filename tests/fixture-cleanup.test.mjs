import test from 'node:test';
import assert from 'node:assert/strict';
import {listFixtureObjects} from './fake-meta/storage-cleanup.mjs';
const root='00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-000000000002';
test('fixture cleanup collects every nested card version and paginated masks within one post',async()=>{
 const files=Array.from({length:1001},(_,n)=>({name:`mask${n}`,id:`id${n}`}));
 const tree={[root]:[{name:'cards',id:null},{name:'masks',id:null},{name:'original.jpg',id:'photo'}],[`${root}/cards`]:[{name:'old',id:null},{name:'current',id:null}],[`${root}/cards/old`]:[{name:'card.png',id:'old'}],[`${root}/cards/current`]:[{name:'card.png',id:'new'}],[`${root}/masks`]:files};
 const bucket={list:async(prefix,{offset,limit})=>{assert.ok(prefix===root||prefix.startsWith(`${root}/`));return {data:tree[prefix].slice(offset,offset+limit),error:null};}};
 const paths=await listFixtureObjects(bucket,root);assert.equal(paths.length,1004);
 assert.ok(paths.includes(`${root}/cards/old/card.png`));assert.ok(paths.includes(`${root}/cards/current/card.png`));assert.ok(paths.includes(`${root}/masks/mask1000`));
 await assert.rejects(listFixtureObjects(bucket,root+'/../other'));
});
