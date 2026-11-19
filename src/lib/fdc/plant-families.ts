// An additive disagreement check; the existing kind rules remain independent.
type Family = { id: string; names: string[]; heads: string[]; standIns: string[] };
// id | name words | USDA head words | permitted stand-in families
const TABLE = `
lemon|lemon|lemon|
lime|lime|lime|
calamansi|calamansi,kalamansi|calamansi,kalamansi|lime,lemon
orange|orange,mandarin,tangerine|orange,mandarin,tangerine|
apple|apple|apple|
pear|pear|pear|
banana|banana|banana|
mango|mango,mangoes|mango,mangoes|
melon|melon,honeydew,cantaloupe,muskmelon|melon,honeydew,cantaloupe,muskmelon|
watermelon|watermelon|watermelon|
grape|grape|grape|
strawberry|strawberry|strawberry|
blueberry|blueberry|blueberry|
raspberry|raspberry|raspberry|
pineapple|pineapple|pineapple|
papaya|papaya|papaya|
avocado|avocado|avocado|
tomato|tomato,tomatoes|tomato,tomatoes|
cucumber|cucumber|cucumber|
potato|potato,potatoes,fries|potato,potatoes,fries|
sweet potato|sweet potato,sweet potatoes|sweet potato,sweet potatoes|
onion|onion,shallot|onion,shallot|
scallion|scallion,spring onion,green onion|scallion,spring onion,green onion|onion
garlic|garlic|garlic|
mushroom|mushroom,shiitake,portabella,enoki,oyster mushroom|mushroom,shiitake,portabella,enoki,oyster mushroom|
cabbage|cabbage,pak choy,bok choy,pak-choi,napa,chinese cabbage|cabbage,pak choy,bok choy,pak-choi,napa,chinese cabbage|
lettuce|lettuce,romaine,iceberg|lettuce,romaine,iceberg|
spinach|spinach|spinach|
kangkung|kangkung,water spinach,morning glory|kangkung,water spinach,morning glory,swamp cabbage|spinach
kale|kale|kale|
broccoli|broccoli|broccoli|
cauliflower|cauliflower|cauliflower|
carrot|carrot|carrot|
corn|corn|corn,cornbread|
peas|pea|pea|
eggplant|eggplant,aubergine|eggplant,aubergine|
squash|zucchini,squash,courgette|zucchini,squash,courgette|
pumpkin|pumpkin|pumpkin|
pepper|bell pepper,chili,chilli,capsicum|pepper,chili,chilli,capsicum|
celery|celery|celery|
asparagus|asparagus|asparagus|
okra|okra|okra|
salad|salad|salad|lettuce,cabbage,spinach,kale,cucumber,tomato,carrot
`;
const list = (value: string) => value ? value.split(',') : [];
export const PLANT_FAMILIES: readonly Family[] = TABLE.trim().split('\n').map(row => {
  const [id, names, heads, standIns] = row.split('|');
  return { id, names: list(names), heads: list(heads), standIns: list(standIns) };
});
function words(word: string): RegExp {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const plural = escaped.endsWith('y') ? `${escaped.slice(0, -1)}(?:y|ies)` : `${escaped}s?`;
  return new RegExp(`\\b${plural}\\b`, 'gi');
}
function families(text: string, side: 'names' | 'heads'): Set<string> {
  let remaining = text;
  const found = new Set<string>();
  // Consume compound words first: sweet potato and water spinach are each one family.
  const entries = PLANT_FAMILIES.flatMap(f => f[side].map(word => ({ id: f.id, word })))
    .sort((a, b) => b.word.length - a.word.length);
  for (const { id, word } of entries) remaining = remaining.replace(words(word), () => { found.add(id); return ' '; });
  return found;
}
export function plantFamilyConflict(name: string, description: string, kinds: (text: string) => ReadonlySet<string>): boolean {
  const nonPlant = (text: string) => {
    // A compound plant name owns its words: sweet potato is not a dessert and water spinach is not a drink.
    const plantWords = PLANT_FAMILIES.flatMap(f => [...f.names, ...f.heads]).sort((a, b) => b.length - a.length);
    const rest = plantWords.reduce((value, word) => value.replace(words(word), ' '), text);
    return [...kinds(rest)].some(k => k !== 'fruit' && k !== 'vegetable');
  };
  const named = families(name, 'names');
  if (named.size !== 1 || nonPlant(name)) return false;
  const segments = description.split(',');
  let head = segments[0];
  let recorded = families(head, 'heads');
  if (!recorded.size && !kinds(head).size && segments.length > 1) {
    head = segments[1];
    recorded = families(head, 'heads');
  }
  if (recorded.size !== 1) return false;
  const family = PLANT_FAMILIES.find(f => named.has(f.id))!;
  const record = [...recorded][0];
  if (record !== family.id && !family.standIns.includes(record)) return true;
  // USDA also spells this grain dish as one word; it is not plain corn.
  return nonPlant(head) || /\bcornbread\b/i.test(head);
}
