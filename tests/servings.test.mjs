// node --import tsx --test tests/servings.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { OZ_G, portionsFromDetail, toGrams } from "../src/lib/nutrition/units.ts";
import { parseItemEdit } from "../src/lib/posts/items.ts";
import { stepServings, validServings, servingsLabel } from "../src/lib/posts/servings.ts";
import { rescaleStoredNutrition, sumNutrition } from "../src/lib/nutrition/totals.ts";

const ID = "0f0659f8-d3b4-4bc0-8c4d-8c4d8c4d8c4d";

test("grams and ounces convert exactly; cups and pieces need a stated weight", () => {
  assert.equal(toGrams(80, "g", []), 80);
  assert.equal(toGrams(2, "oz", []), 2 * OZ_G);
  assert.equal(toGrams(1, "cup", []), null);
  assert.equal(toGrams(0, "g", []), null);
  assert.equal(toGrams(2, "cup", [{ unit: "cup", gramsPerUnit: 120 }]), 240);
});

test("FDC portions: foundation foods give pieces and cups, branded foods give their household serving", () => {
  const foundation = portionsFromDetail({ foodPortions: [
    { amount: 1, gramWeight: 115, measureUnit: { name: "Banana" } },
    { amount: 1, gramWeight: 240, measureUnit: { name: "cup" } },
    { amount: 1, gramWeight: 140, measureUnit: { name: "RACC" } },
    { amount: 1, gramWeight: 5, measureUnit: { name: "undetermined" } }] });
  assert.deepEqual(foundation, [{ unit: "piece", gramsPerUnit: 115 }, { unit: "cup", gramsPerUnit: 240 }]);
  assert.deepEqual(portionsFromDetail({ servingSize: 27, servingSizeUnit: "g", householdServingFullText: "0.75 cup" }), [{ unit: "cup", gramsPerUnit: 36 }]);
  assert.deepEqual(portionsFromDetail({ servingSize: 30, servingSizeUnit: "g", householdServingFullText: "1 cookie" }), [{ unit: "piece", gramsPerUnit: 30 }]);
  assert.deepEqual(portionsFromDetail({ servingSize: 30, servingSizeUnit: "g", householdServingFullText: "30 g" }), []);
  assert.deepEqual(portionsFromDetail(null), []);
});

test("an item edit in ounces becomes grams; cups and pieces wait for the food's weight; grams cannot be doubled up", () => {
  const oz = parseItemEdit({ action: "portion", item_id: ID, name: "Rice", portion_amount: 3, portion_unit: "oz" });
  assert.equal(oz.portion_grams, Math.round(3 * OZ_G * 100) / 100);
  const cup = parseItemEdit({ action: "portion", item_id: ID, name: "Rice", portion_amount: 1.5, portion_unit: "cup" });
  assert.equal(cup.portion_unit, "cup"); assert.equal(cup.portion_amount, 1.5);
  assert.equal(parseItemEdit({ action: "portion", item_id: ID, name: "Rice", portion_amount: 80, portion_unit: "g" }).portion_grams, 80);
  for (const bad of [
    { action: "portion", item_id: ID, name: "Rice", portion_amount: 1, portion_unit: "stone" },
    { action: "portion", item_id: ID, name: "Rice", portion_amount: 0, portion_unit: "oz" },
    { action: "portion", item_id: ID, name: "Rice", portion_amount: 1, portion_unit: "oz", portion_grams: 30 },
    { action: "portion", item_id: ID, name: "Rice", portion_unit: "cup" },
  ]) assert.throws(() => parseItemEdit(bad), JSON.stringify(bad));
});

test("servings step by half on the quarter grid and stay within 0.25 to 50", () => {
  assert.equal(stepServings(1, 1), 1.5);
  assert.equal(stepServings(1, -1), 0.5);
  assert.equal(stepServings(0.5, -1), 0.25);
  assert.equal(stepServings(0.25, -1), 0.25);
  assert.equal(stepServings(50, 1), 50);
  assert.equal(servingsLabel(1.5), "1.5");
  assert.equal(servingsLabel(2), "2");
  assert.equal(validServings(0.24), false); assert.equal(validServings(51), false); assert.equal(validServings("2"), false); assert.equal(validServings(2), true);
});

test("2 servings doubles the totals: every item's portion doubles and its stored nutrition rescales with it", () => {
  const row = (id, grams, kcal, protein) => ({ post_item_id: id, calories: kcal, protein_g: protein, carbs_g: 10, fat_g: 2, fibre_g: null, sugar_g: null, sodium_mg: 50, micronutrients: [], source_ref: "1" });
  const before = [row("a", 100, 200, 8), row("b", 50, 90, 3)];
  const doubled = [rescaleStoredNutrition(before[0], 100, 200), rescaleStoredNutrition(before[1], 50, 100)];
  const one = sumNutrition(before), two = sumNutrition(doubled);
  assert.equal(two.calories, one.calories * 2);
  assert.equal(two.protein_g, one.protein_g * 2);
  assert.equal(two.sodium_mg, one.sodium_mg * 2);
});

test("80 g recomputes an item's nutrition from its per-100 g values", () => {
  const per100 = { post_item_id: "a", calories: 370, protein_g: 3.7, carbs_g: 85.19, fat_g: 5.56, fibre_g: null, sugar_g: null, sodium_mg: null, micronutrients: [], source_ref: "1636115" };
  const at80 = rescaleStoredNutrition(per100, 100, 80);
  assert.ok(Math.abs(at80.calories - 296) < 1e-9);
  assert.ok(Math.abs(at80.protein_g - 2.96) < 1e-9);
});
