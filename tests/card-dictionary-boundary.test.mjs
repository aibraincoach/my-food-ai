import test from 'node:test';
import assert from 'node:assert/strict';
import {createTranslator} from 'next-intl';
import {cardDataFromRow} from '../src/lib/pipeline/card-data.ts';
import {cardTranslators} from './fixtures/card-translators.mjs';
import {onError,getMessageFallback} from '../src/i18n/strict.ts';
test('an injected server translator still throws for a missing key without English fallback',()=>{
 for(const locale of ['en','ja']){
  const {tn}=cardTranslators(locale);
  const t=createTranslator({locale,messages:{},onError,getMessageFallback});
  assert.throws(()=>cardDataFromRow({items:[]},locale,{t,tn}),/unavailable/);
 }
});
