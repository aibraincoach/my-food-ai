import test from 'node:test';
import assert from 'node:assert/strict';
import {recordKind,recordContradicts} from '../src/lib/fdc/record-kind.ts';
for(const [name,description] of [['cabbage slaw','Coleslaw with dressing'],['pancakes','Pancakes with syrup']])test(`${name} keeps its own record before an accompaniment`,()=>{assert.equal(recordKind(description),null);assert.equal(recordContradicts(name,{description}),false);});
for(const description of ['Salad dressing','Sauce with mushrooms'])test(`a condiment head stays a condiment: ${description}`,()=>assert.equal(recordKind(description),'condiment'));
for(const [name,description] of [['curry sauce','Persimmons, japanese, dried'],['lamb curry','Lamb, ground, raw']])test(`existing wrong record still rejected: ${name}`,()=>assert.equal(recordContradicts(name,{description}),true));
test('an explicit category still names the record',()=>assert.equal(recordKind('Coleslaw with dressing','salad dressings'),'condiment'));
