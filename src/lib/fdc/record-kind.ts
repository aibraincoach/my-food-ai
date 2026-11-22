// #990: is a USDA record the same kind of food as the food it stands for? One reader for the matcher (which drops a
// record that is plainly another kind of food before the model chooses) and for the stored-numbers detector
// (scripts/numbers/mismatch.mjs), so both apply the same rules.
//
// Strong signals, which the matcher acts on:
//   kind  — the record is a fruit, a sweet, a drink, a condiment or a fat, and the food's name has no word of that kind
//           but does have words of another kind (curry sauce matched to dried persimmons).
//   raw   — the record is raw and the food's name says it is cooked or a dish (lamb curry matched to raw ground lamb).
// Weak signals, which only the detector counts:
//   part    — the name joins foods of different kinds ("with", "and") and the record names only one of them.
//   density — the record's calories per 100 g are far outside what the food's kind allows.

export type FoodKind = "fruit" | "sweet" | "drink" | "condiment" | "fat" | "meat" | "seafood" | "grain" | "vegetable" | "dairy" | "egg" | "legume" | "dish";

const NAME_WORDS: [FoodKind, RegExp][] = [
  ["fruit", /\b(fruits?|apples?|bananas?|papayas?|mangos?|mangoes|melons?|watermelons?|honeydew|cantaloupe|persimmons?|berry|berries|strawberr(y|ies)|blueberr(y|ies)|grapes?|oranges?|pineapples?|durian|jackfruit|rambutan|lychees?|longan|guavas?|kiwis?|pears?|peach(es)?|plums?|cherr(y|ies)|dates|figs?|raisins?|apricots?|avocados?|dragon ?fruit|pomelo|mangosteen|salak|starfruit)\b/i],
  ["sweet", /\b(cakes?|cookies?|biscuits?|candy|candies|chocolate|desserts?|pastr(y|ies)|donuts?|doughnuts?|pudding|ice cream|gelato|brownies?|tarts?|pies?|kue|martabak manis|croissants?|jell(y|ies)|jams?|preserves?|sweets?)\b/i],
  ["drink", /\b(drinks?|juice|tea|coffee|kopi|teh|espresso|latte|cappuccino|americano|mocha|milkshakes?|shakes?|mocktails?|smoothie|soda|cola|coke|beer|radler|wine|cocktail|mai tai|mojito|margarita|sake|soju|whisk(e)?y|vodka|gin|rum|liquor|water|lemonade|boba|bubble tea|kombucha|bintang|lager|ale)\b/i],
  ["condiment", /\b(sauces?|gravy|dressings?|sambal|ketchup|mayonnaise|mayo|salsa|dips?|condiments?|chutney|relish|mustard|pesto|aioli|vinaigrette|kecap|syrup|honey|jam)\b/i],
  ["fat", /\b(oil|butter|margarine|ghee|lard|shortening)\b/i],
  ["meat", /\b(chicken|beef|pork|lamb|mutton|goat|veal|duck|turkey|bacon|ham|sausages?|salami|meat|steak|ribs?|tonkatsu|katsu|rendang|satay|sate|bakso|meatballs?|crackling|chiro|kebabs?|kabobs?|seekh|shawarma|gyros?)\b/i],
  ["seafood", /\b(fish|salmon|tuna|shrimp|prawns?|crab|lobster|squid|calamari|octopus|clams?|mussels?|oysters?|scallops?|seafood|anchov(y|ies)|eel|unagi|sashimi)\b/i],
  ["grain", /\b(rice|nasi|noodles?|mie|bihun|vermicelli|pasta|spaghetti|bread|buns?|bao|toast|sandwich|burger|wraps?|tortilla|pizza|oats?|oatmeal|porridge|congee|bubur|cereal|dumplings?|gyoza|dim sum|siomay|crackers?|fritters?|pancakes?|waffles?|croissant|bagel)\b/i],
  ["vegetable", /\b(salad|vegetables?|veggies?|greens|lettuce|cabbage|cucumber|tomato(es)?|carrots?|broccoli|spinach|kangkung|potato(es)?|fries|corn|onions?|mushrooms?|eggplant|beans? sprouts?|pak ?choy|bok ?choy|kimchi|gado gado|sayur)\b/i],
  ["dairy", /\b(milk|cheese|yogh?urt|cream|kefir|paneer)\b/i],
  ["egg", /\b(eggs?|omelet(te)?|telur)\b/i],
  ["legume", /\b(peanuts?|nuts?|almonds?|cashews?|tofu|tahu|tempeh|tempe|beans|lentils?|chickpeas?|hummus|edamame)\b/i],
  ["dish", /\b(curry|kari|stew|soup|soto|ramen|pho|laksa|fried rice|nasi goreng|mie goreng|stir[- ]?fry|casserole|bowl|plate|combo|set)\b/i],
];

// USDA categories (SR Legacy food groups, FNDDS WWEIA categories, branded categories), lower-cased by foodCategory().
// Order matters: the first match wins, so "fruit drinks" is a drink, not a fruit.
const CATEGORY_KIND: [FoodKind, RegExp][] = [
  ["fruit", /^fruits and fruit juices$/],
  ["drink", /beverage|drinks?\b|juice|coffee|tea\b|beer|wine|liquor|cocktail|soft drink|water|smoothie/],
  ["sweet", /\b(jell(y|ies)|jams?|preserves?)\b/],
  ["condiment", /sauce|gravies|gravy|dressing|condiment|dips?\b|salsa|ketchup|mustard|spreads?|syrups?|jams?|jellies/],
  ["fat", /fats and oils|vegetable oils|butter|margarine|cooking oils/],
  ["sweet", /sweets|candy|cookies|cakes|pies|pastr|doughnuts|desserts|ice cream|chocolate|biscuits/],
  ["fruit", /fruit|apples|bananas|citrus|melons|berries|grapes|pears|pineapple|peaches|mango/],
];

const COOKED_WORDS = /\b(cooked|fried|grilled|roast(ed)?|baked|steamed|boiled|braised|stewed|smoked|curry|kari|stew|soup|soto|rendang|satay|sate|goreng|bakar|bakso|katsu|tonkatsu|crispy|crunchy|crackling|barbecued?|bbq|sauteed|stir[- ]?fried)\b/i;
const RAW_FOODS = /\b(raw|sashimi|poke|tartare|ceviche|carpaccio|salad|fresh fruit|fruit)\b/i;
// Calories per 100 g a food of this kind can plausibly have: [lowest, highest].
const DENSITY: Partial<Record<FoodKind, [number, number]>> = { fruit: [10, 120], vegetable: [5, 250], drink: [0, 150] };
const DRIED = /\b(dried|dry|raisins?|dates|kering|chips|candied)\b/i;
const SINGLE_KINDS = new Set<FoodKind>(["fruit", "sweet", "drink", "condiment", "fat"]);

export function nameKinds(name: string): Set<FoodKind> {
  return new Set(NAME_WORDS.filter(([, words]) => words.test(name)).map(([kind]) => kind));
}
export function recordKind(description: string, category?: string | null): FoodKind | null {
  const text = (category ?? "").toLowerCase();
  const fromCategory = CATEGORY_KIND.find(([kind, words]) => words.test(text)
    && !(kind === "condiment" && /\b(?:soups?|mixtures)\b/.test(text))
    && !(kind === "fruit" && /^pre-packaged fruit (?:and|&) vegetables$/.test(text)))?.[0];
  if (fromCategory) return fromCategory;
  // No category: the record's own first words name it ("Persimmons, japanese, dried").
  const head = description.split(",")[0];
  // #1153: an unknown food before its accompaniment must not inherit that accompaniment's kind.
  if (nameKinds(head.split(/\b(?:with|and|in)\b|&/i)[0]).size === 0) return null;
  const kinds = nameKinds(head);
  if ([...kinds].every(kind => SINGLE_KINDS.has(kind))) return [...kinds][0] ?? null;
  // #1089: a head that mixes kinds is named by its last word, the noun: "Salad dressing" is a condiment, "Fish oil" a
  // fat, "Milk shakes" a drink. The head is cut at its first with/and/&/in first, so a whole dish keeps no kind
  // ("Beef and noodles with soy-based sauce" ends at "Beef"). Only a single kind counts; anything else stays unknown.
  const last = head.split(/\b(?:with|and|in)\b|&/i)[0].trim().split(/\s+/).at(-1) ?? "";
  const named = [...nameKinds(last)];
  return named.length === 1 && SINGLE_KINDS.has(named[0]) ? named[0] : null;
}

export type RecordCheck = { strong: string[]; weak: string[]; score: number };

// Every signal for one food and its record. kcalPer100g is the record's (or the stored food's) energy density, if known.
export function checkRecord(name: string, record: { description: string; category?: string | null; kcalPer100g?: number | null }): RecordCheck {
  const strong: string[] = [], weak: string[] = [];
  const kinds = nameKinds(name);
  const head = name.split(/\b(?:with|and|in)\b|&/i)[0].trim().split(/\s+/).at(-1) ?? "";
  const headKinds = nameKinds(head);
  // A bare ambiguous dish word ("curry") may itself name a spice product. Only an explicit main-food head or a
  // dish accompanied by a main food is enough to refuse a spice-category reference. No plant/flavour override.
  const mainKinds: FoodKind[] = ["meat", "seafood", "grain", "dairy", "egg", "legume"];
  const mainHead = mainKinds.some(kind => headKinds.has(kind))
    || (headKinds.has("dish") && [...mainKinds, "vegetable" as FoodKind].some(kind => kinds.has(kind)));
  const spiceProduct = /\b(spices?|herbs?|seasonings?|powders?|masala)\b/i.test(name) || headKinds.has("condiment");
  const spiceCategory = /\b(spices?|herbs?|seasonings?)\b/i.test(record.category ?? "")
    && !/\b(soups?|mixtures)\b/i.test(record.category ?? "");
  const kind = spiceCategory && mainHead && !spiceProduct ? "condiment" : recordKind(record.description, record.category);
  if (kind && SINGLE_KINDS.has(kind) && kinds.size > 0 && !kinds.has(kind)) strong.push(`kind: the record is a ${kind}; the name has no ${kind} word`);
  // A name that is only fruit or only a drink, matched to a record of another kind.
  if (kind && kinds.size > 0 && [...kinds].every(k => k === "fruit" || k === "drink") && !kinds.has(kind) && kind !== "dairy") strong.push(`kind: the name is a ${[...kinds].join(" or ")}; the record is a ${kind}`);
  if (/\braw\b/i.test(record.description) && COOKED_WORDS.test(name) && !RAW_FOODS.test(name)) strong.push("raw: the record is raw and the name is a cooked food or dish");
  // #1258: preserved fruit does not represent frying. A reference that
  // itself states frying, or names the same syrup-served dish, remains eligible.
  const frying = /\b(fried|goreng|battered|fritters?|tempura)\b/i;
  // PM-approved syrup dishes only: an unlisted fruit must never gain a
  // dish exemption merely because the preserved record repeats its name.
  const syrupDishes = [/\bgulab jamun\b/i];
  const sameSyrupDish = syrupDishes.some(dish => dish.test(name) && dish.test(record.description));
  if (frying.test(name) && !frying.test(record.description) && !sameSyrupDish
    && /\b(?:candied|syrup[- ]pack|juice[- ]pack|in (?:light |heavy |extra light )?syrup)\b/i.test(record.description))
    strong.push("packed: the record is preserved in syrup or juice, or candied; the food is fried");
  if (/\b(with|and|&)\b/i.test(name)) {
    const parts = name.split(/\b(?:with|and)\b|&/i).map(part => nameKinds(part)).filter(set => set.size > 0);
    const described = nameKinds(record.description);
    const missing = parts.filter(set => ![...set].some(k => described.has(k) || k === kind));
    if (parts.length > 1 && missing.length > 0) weak.push(`part: the name has ${parts.length} foods; the record names only ${parts.length - missing.length}`);
  }
  if (record.kcalPer100g != null) for (const k of kinds) {
    const range = DENSITY[k];
    if (!range || (k === "fruit" && DRIED.test(name)) || kinds.size > 1) continue;
    if (record.kcalPer100g < range[0] || record.kcalPer100g > range[1]) weak.push(`density: ${Math.round(record.kcalPer100g)} kcal/100 g is outside ${range[0]}–${range[1]} for a ${k}`);
  }
  return { strong, weak, score: 3 * strong.length + weak.length };
}

/** True when the record is plainly another kind of food: the matcher drops it before choosing. */
export function recordContradicts(name: string, food: { description: string; foodCategory?: string }): boolean {
  return checkRecord(name, { description: food.description, category: food.foodCategory }).strong.length > 0;
}
