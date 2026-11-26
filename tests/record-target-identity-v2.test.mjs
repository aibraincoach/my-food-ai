import test from 'node:test';
import assert from 'node:assert/strict';
import {recordContradicts,recordKind} from '../src/lib/fdc/record-kind.ts';
for(const [name,description] of [['cabbage slaw','Coleslaw with dressing'],['pad thai','Pad thai with chicken'],['coleslaw','Coleslaw'],['coleslaw','Coleslaw with dressing']])test(`keep the named food: ${name} / ${description}`,()=>assert.equal(recordContradicts(name,{description}),false));
for(const [name,description] of [['chicken','Churros with chocolate'],['chicken','Crepes with sauce'],['chicken','Yuzu in juice'],['chicken','Coleslaw with dressing'],['fried rice','Coleslaw with dressing'],['curry sauce','Persimmons, japanese, dried'],['lamb curry','Lamb, ground, raw'],['rice','Licorice in syrup']])test(`reject another food: ${name} / ${description}`,()=>assert.equal(recordContradicts(name,{description}),true));
test('record kind and explicit category keep their original meaning',()=>{assert.equal(recordKind('Coleslaw with dressing'),'condiment');assert.equal(recordContradicts('cabbage slaw',{description:'Coleslaw with dressing',foodCategory:'salad dressings'}),true);assert.equal(recordKind('Honey with chocolate'),'sweet');});
test('explicit MEXT kind is never overridden by a description identity',()=>{
 assert.equal(recordContradicts('cabbage slaw',{description:'Coleslaw with dressing',kind:'condiment'}),true);
 assert.equal(recordContradicts('cabbage slaw',{description:'Coleslaw with dressing'}),false);
});
test('named coleslaw remains eligible while an unlisted compound gets no suffix identity',()=>{
 assert.equal(recordContradicts('coleslaw',{description:'Salad dressing, coleslaw'}),false);
 assert.equal(recordContradicts('cabbage slaw',{description:'Rainbowslaw with dressing'}),true);
});

test('the crossed cabbage and carrot slaw name has the same coleslaw identity',()=>assert.equal(recordContradicts('shredded cabbage and carrot slaw',{description:'Coleslaw with dressing'}),false));
