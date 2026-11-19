import test from 'node:test';
import assert from 'node:assert/strict';
import {checkRecord} from '../src/lib/fdc/record-kind.ts';

const conflict = (name, description) => checkRecord(name, {description}).strong.some(s => s.startsWith('plant:'));
for (const [name, description] of [
 ['Lemon wedge','Potatoes, french fried, wedge cut'],
 ['charred lemon half','Lemon pie filling'],
 ['Grilled onions','Mushrooms, portabella, grilled'],
 ['Spiced potato side dish',"McDONALD'S, Side Salad"],
 ['lemon','Limes, raw'],['tomato','Cucumber, raw'],['broccoli','Cabbage, raw'],
 ['sweet potato','Potatoes, cooked'],['corn','Cornbread'],['apple','Apple pie'],
]) test(`plain plant conflicts: ${name} / ${description}`,()=>assert.equal(conflict(name,description),true));

for (const [name, description] of [
 ['Lemon wedge','Lemon, raw'],['lemon twist','Lemon peel, raw'],['grilled onions','Onions, cooked'],
 ['potato','Potato, roasted, NFS'],['fries','Potatoes, french fried'],
 ['pak choy','Cabbage, chinese (pak-choi)'],['bok choy','Cabbage, chinese (pak-choi)'],
 ['kangkung','Spinach, cooked'],['kangkung','Swamp cabbage, cooked'],
 ['calamansi','Limes, raw'],['calamansi','Lemons, raw'],['honeydew','Melons, honeydew, raw'],
 ['mixed green salad','Lettuce, raw'],['zucchini','Squash, summer, zucchini'],
 ['scallions','Onions, spring or scallions'],['sweet potato','Sweet potato, cooked'],
 ['lemon chicken','Lemons, raw'],['lemon tea','Lemons, raw'],['apple sauce','Apple sauce'],
 ['strawberry jam','Jams, strawberry'],['curry powder','Spices, curry powder'],
 ['potato salad','Salad, potato'],['mixed vegetables','Vegetables, mixed, corn, peas, carrots'],
 ['lemon and herb chicken','Lemons, raw'],['lime and rum tiki cocktail','Limes, raw'],
 ['unknown plant','Lemons, raw'],['corn','Vegetables, mixed, corn, peas, carrots'],
 ['curry','Potatoes, cooked'],['fruit salad','Fruit salad, canned'],
]) test(`no plant conflict: ${name} / ${description}`,()=>assert.equal(conflict(name,description),false));

test('the additive signal never keeps a pair rejected by the recorded main gate', async () => {
 const {readdir, readFile} = await import('node:fs/promises');
 const {referenceProteinMismatch} = await import('../src/lib/fdc/protein-reference.ts');
 const folder = new URL('./fixtures/record-gate/', import.meta.url);
 for (const file of await readdir(folder)) {
  const rows = JSON.parse(await readFile(new URL(file, folder), 'utf8'));
  for (const row of rows) if (row.mainRejected) {
   assert.equal(checkRecord(row.name,{description:row.description,category:row.category}).strong.length>0
    || referenceProteinMismatch(row.name,row.description),true,`${file}: ${row.name} / ${row.description}`);
  }
 }
});
