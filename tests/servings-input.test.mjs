import test from 'node:test';
import assert from 'node:assert/strict';
import {parseServings,stepServings} from '../src/lib/posts/servings.ts';

test('typed servings accepts fractions and decimal commas on the quarter grid',()=>{
 for(const [input,want] of [['1.5',1.5],['0,5',0.5],['1.6',1.5],['.5',0.5],['0.25',0.25],['50',50],[' 1.5 ',1.5]])assert.equal(parseServings(input),want,input);
});
test('invalid servings cannot cross the stored bounds or coerce arbitrary text',()=>{
 for(const input of ['0.1','0.24','50.01','51','abc','',' ','Infinity','NaN','0x10','1.5 meals','-1','1,2,3'])assert.equal(parseServings(input),null,input);
});
test('stepping retains half increments and stored bounds',()=>{
 assert.equal(stepServings(1,1),1.5);assert.equal(stepServings(1,-1),0.5);assert.equal(stepServings(0.25,-1),0.25);assert.equal(stepServings(50,1),50);
});
