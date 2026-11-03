import test from 'node:test';
import assert from 'node:assert/strict';
import {summaryLine} from '../src/lib/posts/summary-line.ts';
test('search summaries use the post’s resolved drink rather than losing its volume and caffeine',()=>{
 const post={kind:'drink',items:[],drink:{ml:240,caffeineMg:95,totalMl:690,dayCaffeineMg:158,drinksMl:440,foodMl:250,label:'Coffee, cup'}};
 assert.equal(summaryLine(post),'Drank: 240 ml · 95 mg caffeine · Consumed today: 690 ml · 158 mg caffeine');
 assert.match(summaryLine({...post,drink:null}),/^Drank: unavailable ml/);
 assert.match(summaryLine(post,{...post.drink,ml:350,caffeineMg:138}),/^Drank: 350 ml · 138 mg caffeine/);
});
