import test from 'node:test';import assert from 'node:assert/strict';
import {drinkGlyph,waterCups} from '../src/lib/intake/drink-glyph.ts';
test('drink pictures distinguish the kind and preserve water cup counts',()=>{
 for(const [label,kind,want] of [['Coffee','caffeine','coffee'],['Water, glass','water','water'],['Tea','caffeine','coffee'],['Lime and rum tiki cocktail','alcohol','cocktail'],['Red wine','alcohol','wine'],['Bintang','alcohol','beer'],['Coca-Cola','water','tumbler']])assert.equal(drinkGlyph(label,kind),want);
 assert.equal(waterCups(500),2);assert.equal(waterCups(100),1);
});
