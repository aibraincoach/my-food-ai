// node --import tsx --test tests/fdc-match.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { chooseBestMatch } from "../src/lib/fdc/nutrients.ts";

const kcal = (value) => [{ nutrientId: 1008, nutrientName: "Energy", unitName: "KCAL", value }];

test("mixed green salad prefers side salad over dressing", () => {
  const foods = [
    { fdcId: 169057, description: "Salad dressing, green goddess, regular", dataType: "SR Legacy", foodNutrients: kcal(427) },
    { fdcId: 172074, description: "McDONALD'S, Side Salad", dataType: "SR Legacy", foodNutrients: kcal(20) },
  ];
  assert.equal(chooseBestMatch(foods, "mixed green salad")?.fdcId, 172074);
});

test("black coffee prefers zero-cal branded black coffee over soymilk", () => {
  const foods = [
    { fdcId: 175224, description: "SILK Coffee, soymilk", dataType: "SR Legacy", foodNutrients: kcal(62) },
    { fdcId: 1904507, description: "BLACK COFFEE", dataType: "Branded", foodNutrients: kcal(0) },
  ];
  assert.equal(chooseBestMatch(foods, "black coffee")?.fdcId, 1904507);
});

test("scrambled egg with ketchup prefers egg over ketchup", () => {
  const foods = [
    { fdcId: 747693, description: "Ketchup, restaurant", dataType: "Foundation", foodNutrients: kcal(117) },
    { fdcId: 172187, description: "Egg, whole, cooked, scrambled", dataType: "SR Legacy", foodNutrients: kcal(149) },
  ];
  assert.equal(chooseBestMatch(foods, "scrambled egg with ketchup")?.fdcId, 172187);
});

test("egg salad is not penalized when the query names egg salad", () => {
  const foods = [
    { fdcId: 173343, description: "Potato salad with egg", dataType: "SR Legacy", foodNutrients: kcal(157) },
    { fdcId: 169057, description: "Salad dressing, green goddess, regular", dataType: "SR Legacy", foodNutrients: kcal(427) },
  ];
  assert.equal(chooseBestMatch(foods, "egg salad")?.fdcId, 173343);
});

test("without a query, data-type rank still decides", () => {
  const foods = [
    { fdcId: 2, description: "Branded", dataType: "Branded", foodNutrients: kcal(100) },
    { fdcId: 1, description: "Foundation", dataType: "Foundation", foodNutrients: kcal(50) },
  ];
  assert.equal(chooseBestMatch(foods)?.fdcId, 1);
});

import { identifyPrompt } from "../src/lib/prompts/spark/identify.ts";
import { correctPrompt } from "../src/lib/prompts/spark/correct.ts";
test("both portion prompts bind caption count and size to one single serving", () => {
  for (const prompt of [identifyPrompt, correctPrompt]) {
    assert.match(prompt, /count or size in the caption bounds the portion exactly/);
    assert.match(prompt, /one slice.*never two/);
    assert.match(prompt, /small.*low end of the range/);
    assert.match(prompt, /a slice of Japanese toast.*thick single slice/);
  }
});

test("explicitly requested soymilk coffee is not replaced by black coffee", () => {
  const foods = [
    { fdcId: 1, description: "BLACK COFFEE", dataType: "Foundation", foodNutrients: kcal(0) },
    { fdcId: 2, description: "SILK Coffee, soymilk", dataType: "SR Legacy", foodNutrients: kcal(62) },
  ];
  assert.equal(chooseBestMatch(foods, "coffee with soymilk")?.fdcId, 2);
});
