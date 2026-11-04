import test from 'node:test';
import assert from 'node:assert/strict';
import {parseServings,servingsLabel,stepServings,validServings} from '../src/lib/posts/servings.ts';

test('parseServings accepts decimals and decimal commas rounded to two places',()=>{
 for(const [input,want] of [['1.5',1.5],['0,5',0.5],['.5',0.5],['0.25',0.25],['50',50],[' 1.5 ',1.5],['0.1',0.1],['1.666',1.67]]){
  assert.equal(parseServings(input),want,input);
 }
});
test('parseServings accepts vulgar and unicode fractions',()=>{
 for(const [input,want] of [['1/2',0.5],['1/4',0.25],['3/4',0.75],['1 1/2',1.5],['2 1/4',2.25],['½',0.5],['⅓',0.33],['⅔',0.67],['¼',0.25],['¾',0.75],['⅛',0.13],['1½',1.5],['2¼',2.25]]){
  assert.equal(parseServings(input),want,input);
 }
});
test('parseServings accepts multiplier shorthands',()=>{
 assert.equal(parseServings('2x'),2);
 assert.equal(parseServings('x2'),2);
 assert.equal(parseServings('×2'),2);
 assert.equal(parseServings('1.5 x2'),3);
 assert.equal(parseServings('¼ ×2'),0.5);
});
test('parseServings rejects out-of-range and non-numeric text',()=>{
 for(const input of ['0.09','0.05','50.01','51','abc','',' ','Infinity','NaN','0x10','1.5 meals','-1','1,2,3']){
  assert.equal(parseServings(input),null,input);
 }
});
test('servingsLabel shows common fraction glyphs',()=>{
 assert.equal(servingsLabel(0.25),'¼');
 assert.equal(servingsLabel(0.33),'⅓');
 assert.equal(servingsLabel(0.5),'½');
 assert.equal(servingsLabel(0.75),'¾');
 assert.equal(servingsLabel(1.5),'1½');
 assert.equal(servingsLabel(2),'2');
});
test('validServings matches parseServings bounds',()=>{
 assert.equal(validServings(0.1),true);
 assert.equal(validServings(0.09),false);
 assert.equal(validServings(50),true);
 assert.equal(validServings(50.01),false);
});
test('stepping retains half increments within bounds',()=>{
 assert.equal(stepServings(1,1),1.5);
 assert.equal(stepServings(1,-1),0.5);
 assert.equal(stepServings(0.1,-1),0.1);
 assert.equal(stepServings(50,1),50);
});
