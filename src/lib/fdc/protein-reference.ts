const PROTEIN_WORDS =
  /\b(squid|octopus|cuttlefish|tuna|salmon|shrimp|prawn|crab|lobster|mussel|clam|oyster|scallop|fish|chicken|turkey|duck|beef|pork|lamb|veal|bacon|ham|sausage|tofu|tempeh|egg)\b/i;

/** Named protein in the item text (first match). */
export function itemProteinTerm(name: string): string | null {
  const match = name.match(PROTEIN_WORDS);
  return match ? match[1].toLowerCase() : null;
}

// #617: the animal or protein a food or a USDA record is made of. A word names it ("tuna", "eggs"); a dish word
// implies it ("cheeseburger" is beef, "omelet" is egg, "surimi" and "roe" are fish). A fish species is also a fish.
const FISH_SPECIES = ["salmon", "tuna", "cod", "tilapia", "pollock", "mackerel", "sardine", "anchovy", "trout", "snapper",
  "catfish", "halibut", "haddock", "herring", "swordfish", "eel", "bass", "grouper", "milkfish", "mahi"];
// A topping or extra (bacon on a cheeseburger, ham in an omelet) is added beside the dish's own protein; every other
// named protein is the dish's main one, and replaces what a dish word would imply (a chicken burger is not beef).
const TOPPINGS = new Set(["bacon", "ham", "sausage", "egg"]);
const NAMED: [RegExp, string, string[]][] = [
  ...FISH_SPECIES.map((species): [RegExp, string, string[]] => [new RegExp(`\\b${species === "anchovy" ? "anchov(?:y|ies)" : species + "(?:e?s)?"}\\b`, "i"), species, [species]]),
  [/\bfish(?:es)?\b/i, "fish", ["fish"]],
  [/\b(?:squid|calamari)s?\b/i, "squid", ["squid"]], [/\boctopus(?:es)?\b/i, "octopus", ["octopus"]], [/\bcuttlefish\b/i, "cuttlefish", ["cuttlefish"]],
  [/\b(?:shrimps?|prawns?)\b/i, "shrimp", ["shrimp"]], [/\bcrabs?\b/i, "crab", ["crab"]], [/\blobsters?\b/i, "lobster", ["lobster"]],
  [/\bmussels?\b/i, "mussel", ["mussel"]], [/\bclams?\b/i, "clam", ["clam"]], [/\boysters?\b/i, "oyster", ["oyster"]], [/\bscallops?\b/i, "scallop", ["scallop"]],
  [/\bchickens?\b/i, "chicken", ["chicken"]], [/\bturkeys?\b/i, "turkey", ["turkey"]], [/\bducks?\b/i, "duck", ["duck"]], [/\bbeef\b/i, "beef", ["beef"]],
  [/\bpork\b/i, "pork", ["pork"]], [/\blamb\b/i, "lamb", ["lamb"]], [/\bveal\b/i, "veal", ["veal"]], [/\bbacon\b/i, "bacon", ["bacon", "pork"]],
  [/\bhams?\b/i, "ham", ["ham", "pork"]], [/\bsausages?\b/i, "sausage", ["sausage", "pork"]], [/\btofu\b/i, "tofu", ["tofu"]], [/\btempeh\b/i, "tempeh", ["tempeh"]],
  [/\beggs?\b/i, "egg", ["egg"]],
  // A meatless dish names its plant protein; it is the dish's main protein, so a veggie burger is not beef.
  [/\b(?:veggie|vegetarian|vegan|plant[- ]based|beans?|lentils?|chickpeas?|soy|impossible|beyond)\b/i, "plant", ["plant"]],
];
// Implied by a dish word, unless the side names its own main protein. An egg dish is egg whatever is in it.
const IMPLIED: [RegExp, string[]][] = [
  [/\b(?:cheese)?burgers?\b|\bhamburgers?\b|\bpatty\b|\bpatties\b/i, ["beef"]],
  [/\bsurimi\b|\bkani\b/i, ["fish"]],
  [/\broe\b|\bcaviar\b|\bikura\b|\btobiko\b/i, ["fish"]],
  [/\bhot ?dogs?\b|\bfrankfurters?\b|\bwieners?\b/i, ["beef", "pork"]],
  [/\bpepperoni\b|\bsalami\b|\bmeatballs?\b/i, ["beef", "pork"]],
];
const EGG_DISH = /\bomelet(?:te)?s?\b|\bscrambled?\b|\bfrittatas?\b/i;
// Words that are not the animal they name: "chicken-fried" steak is beef, and imitation crab is surimi.
const STYLES: [RegExp, string][] = [[/\bchicken[- ]fried(?= steaks?\b)/gi, "fried"], [/\bimitation crab\b|\bcrab sticks?\b/gi, "surimi"]];

function proteins(text: string): Set<string> {
  const plain = STYLES.reduce((value, [words, replacement]) => value.replace(words, replacement), text);
  const found = new Set<string>();
  let main = false;
  for (const [words, word, named] of NAMED) if (words.test(plain)) { named.forEach(protein => found.add(protein)); if (!TOPPINGS.has(word)) main = true; }
  if (!main) for (const [words, implied] of IMPLIED) if (words.test(plain)) implied.forEach(protein => found.add(protein));
  if (EGG_DISH.test(plain)) found.add("egg");
  // A side that names its species does not stand for any fish: "Fish, salmon" is salmon.
  if (FISH_SPECIES.some(species => found.has(species))) found.delete("fish");
  return found;
}
const PLANT = new Set(["plant", "tofu", "tempeh"]);
const agree = (a: string, b: string) => a === b || (PLANT.has(a) && PLANT.has(b))
  || (a === "fish" && FISH_SPECIES.includes(b)) || (b === "fish" && FISH_SPECIES.includes(a));

/**
 * True when a USDA description is made of proteins none of which agrees with the food's, named or implied. #617:
 * "Sushi roll, tuna" is not squid nigiri, but a beef patty is a bacon cheeseburger's and "Fish, surimi" is imitation
 * crab's. A food or a record that names no protein is not judged.
 */
export function referenceProteinMismatch(itemName: string, description: string): boolean {
  const food = proteins(itemName), record = proteins(description);
  if (!food.size || !record.size) return false;
  return ![...food].some(a => [...record].some(b => agree(a, b)));
}
