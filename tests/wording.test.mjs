import assert from 'node:assert/strict';
import test from 'node:test';
import { tsImport } from 'tsx/esm/api';
const { checkWording, plainConsumed } = await tsImport('../src/lib/pipeline/wording.ts', import.meta.url);
test('model summaries reject coaching and remaining-target language', () => {
  for(const text of ['you should eat', 'calories left', 'TRY  TO eat more', 'Good job!']) assert.equal(checkWording(text).ok,false,text);
  assert.equal(checkWording('Salmon 120 g, green beans 80 g. About 463 kcal.').ok,true);
  assert.equal(checkWording('Spring rolls on a plate.').ok,true);
});
test('fallback preserves unavailable nutrition rather than inventing zero', () => {
  assert.match(plainConsumed({calories:null,protein_g:1,carbs_g:2,fat_g:3}),/unavailable kcal/);
  assert.equal(checkWording(plainConsumed({calories:100,protein_g:1,carbs_g:2,fat_g:3})).ok,true);
});
