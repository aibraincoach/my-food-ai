// #929: the review runner names the offered model even when the picker's aria-label is only "Model".
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../tools/pplx-review.mjs',import.meta.url),'utf8');
const MODEL_BUTTON=source.match(/const MODEL_BUTTON = `(.*)`;/)[1];
const line=source.split('\n').find(l=>l.includes('const b = ${MODEL_BUTTON}'));
// Build the page script exactly as the runner's template literal does.
const script=new Function('MODEL_BUTTON','return `'+line.match(/`(.*)`\);\s*$/)[1]+'`')(new Function('return `'+MODEL_BUTTON+'`')());
function label(buttons){
 for(const b of buttons)b.getAttribute=()=>b.aria;
 const document={querySelector:selector=>selector==='button[aria-label="Model"]'?buttons.find(b=>b.aria==='Model')??null:null,querySelectorAll:()=>buttons};
 return new Function('document','return '+script)(document);
}

test('the picker is named by its aria-label, or by its visible text when the aria-label is the generic "Model"',()=>{
 assert.equal(label([{aria:'Gemini 3.8 Flash',innerText:'Gemini 3.8 Flash'}]),'Gemini 3.8 Flash');
 assert.equal(label([{aria:'Model',innerText:'Gemini 4 Hydrogen\nFast'}]),'Gemini 4 Hydrogen');
});

test('a picker that names no model is "generic", and a missing picker is empty',()=>{
 assert.equal(label([{aria:'Model',innerText:'Model'}]),'generic');
 assert.equal(label([{aria:'Model',innerText:''}]),'generic');
 assert.equal(label([]),'');
});

test('a generic picker is not changed, and the request names the model in the receipt',()=>{
 assert.match(source,/if \(!WANT && label === "generic"\) \{\n[^]*?tab\.pickerGeneric = true;\n\s*return \{ ok: true \};/);
 assert.match(source,/if \(tab\.pickerGeneric && modelPref\) tab\.modelLabel = modelPref;/);
 assert.match(source,/model taken from the request: \$\{modelPref \|\| "MISSING"\}/);
});

// The runner is a command, so its two pure functions are read from its source rather than imported.
const pure=new Function(['normModel','sameModel','answerModelOf'].map(name=>source.match(new RegExp(`^(?:const ${name} = .*;|function ${name}\\([^]*?\\n\\})$`,'m'))[0]).join('\n')+'\nreturn {sameModel,answerModelOf};')();

test('the model in the answer\'s follow-up box must agree with the request',()=>{
 const page=model=>`Answer text\nLinks\n\nAsk a follow-up\nSearch\nComputer\n${model}\n`;
 assert.equal(pure.answerModelOf(page('GPT-6.1 Sol')),'GPT-6.1 Sol');
 assert.equal(pure.sameModel(pure.answerModelOf(page('GPT-6.1 Sol')),'gemini38flash'),false,'the 2026-11-03 answers are refused');
 assert.equal(pure.sameModel(pure.answerModelOf(page('Gemini 4 Hydrogen')),'gemini4hydrogen'),true);
 assert.equal(pure.answerModelOf(page('Model')),'','a generic box names no model');
 assert.equal(pure.answerModelOf('An answer with no follow-up box'),'');
 assert.equal(pure.sameModel('Best','pplx_pro'),false,'short names cannot collide');
});
