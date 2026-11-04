import test from 'node:test';
import assert from 'node:assert/strict';
import {certifiedPriorNutrition} from '../src/lib/pipeline/prior-version.ts';
import {FOOD_MATCH_VERSION} from '../src/lib/fdc/version.ts';

test('legacy or mixed-version prior producers cannot bypass fresh analysis during rollout',()=>{
 assert.equal(certifiedPriorNutrition(undefined),false);
 assert.equal(certifiedPriorNutrition([]),false);
 assert.equal(certifiedPriorNutrition([{source_ref:'7'}]),false);
 assert.equal(certifiedPriorNutrition([{matcher_version:FOOD_MATCH_VERSION},{matcher_version:'old'}]),false);
 const row={matcher_version:FOOD_MATCH_VERSION,calories:1,protein_g:1,carbs_g:1,fat_g:1};
 assert.equal(certifiedPriorNutrition([row,{...row}]),true);
});
