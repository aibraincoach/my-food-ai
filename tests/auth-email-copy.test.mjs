import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const copy=JSON.parse(fs.readFileSync(new URL('./fixtures/auth-email-copy.json',import.meta.url))),subjects=JSON.parse(fs.readFileSync(new URL('../supabase/templates/subjects.json',import.meta.url)));
for(const flow of ['confirmation','recovery'])test(flow+' title and subject equal the approved bilingual copy',()=>{
 const expected=copy.en[flow+'.subject']+' / '+copy.ja[flow+'.subject'].replace(/^My Food AI: /,'');
 assert.equal(subjects[flow],expected);
 assert.equal(fs.readFileSync(new URL('../supabase/templates/'+flow+'.html',import.meta.url),'utf8').match(/<title>([^<]*)<\/title>/)?.[1],expected);
});
