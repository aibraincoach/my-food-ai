import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {importRows} from '../scripts/lib/mext-import.mjs';
import {parseMextRecord} from '../src/lib/mext/record.ts';
import {mextCandidateEligible,groupKind} from '../src/lib/mext/gate.ts';
import {recordContradicts} from '../src/lib/fdc/record-kind.ts';
const source=importRows(JSON.parse(readFileSync(new URL('./fixtures/mext-source-sample.json',import.meta.url),'utf8')),{});
const rawSquid=JSON.parse(readFileSync(new URL('./fixtures/mext-raw-squid.json',import.meta.url),'utf8'));
const food=id=>parseMextRecord(id==='10345'?rawSquid:source.find(row=>row.food_number===id));
test('all eighteen groups have an explicit kind, with prepared foods falling back to description',()=>{
  for(let g=1;g<=18;g++)assert.doesNotThrow(()=>groupKind(String(g).padStart(2,'0')));
  assert.equal(groupKind('18'),null);assert.throws(()=>groupKind('19'));
});
test('raw squid, wrong group and species never reach the MEXT chooser',()=>{
  assert.equal(mextCandidateEligible('baked squid','',food('10345')),false);
  const rice=food('01088');assert.equal(mextCandidateEligible('cooked rice','',rice),true);
  assert.equal(mextCandidateEligible('pork belly','',{...rice,foodGroup:'07'}),false);
  assert.equal(mextCandidateEligible('cooked salmon','',food('11129')),false);
  assert.equal(mextCandidateEligible('baked squid','',food('10346')),false);
});
test('a single pork reference cannot represent pork and rice; USDA keeps its existing decision',()=>{
  const pork=food('11129');
  assert.equal(mextCandidateEligible('pork belly','',pork),true);
  assert.equal(mextCandidateEligible('pork belly and rice','',pork),false);
  assert.equal(recordContradicts('pork belly and rice',{description:pork.nameEn}),false);
});

test('instant miso powder and paste are never substituted for a prepared bowl of miso soup',()=>{
 const instant=JSON.parse(readFileSync(new URL('./fixtures/mext-miso-instant.json',import.meta.url),'utf8'));
 assert.deepEqual(instant.map(row=>row.food_number),['17049','17050']);
 for(const row of instant){const candidate=parseMextRecord(row);assert.equal(candidate.foodGroup,'17');assert.equal(mextCandidateEligible('miso soup','a prepared bowl',candidate),false);}
});
