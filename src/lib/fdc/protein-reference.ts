const PROTEIN_WORDS =
  /\b(squid|octopus|cuttlefish|tuna|salmon|shrimp|prawn|crab|lobster|mussel|clam|oyster|scallop|fish|chicken|turkey|duck|beef|pork|lamb|veal|bacon|ham|sausage|tofu|tempeh|egg)\b/i;

/** Named protein in the item text (first match). */
export function itemProteinTerm(name: string): string | null {
  const match = name.match(PROTEIN_WORDS);
  return match ? match[1].toLowerCase() : null;
}

/** True when a USDA description names a topping protein that conflicts with the item. */
export function referenceProteinMismatch(itemName: string, description: string): boolean {
  const itemProtein = itemProteinTerm(itemName);
  if (!itemProtein) return false;
  const desc = description.toLowerCase();
  const topped = desc.match(/\btopped with ([a-z]+)/);
  if (topped) {
    const topping = topped[1];
    const toppingProtein = itemProteinTerm(topping);
    if (toppingProtein && toppingProtein !== itemProtein && !itemName.toLowerCase().includes(topping)) return true;
  }
  const descProteins = desc.match(new RegExp(PROTEIN_WORDS.source, "gi")) ?? [];
  for (const word of descProteins.map((w) => w.toLowerCase())) {
    if (word !== itemProtein && !itemName.toLowerCase().includes(word)) {
      if (desc.includes("topped with") || desc.includes("with " + word)) return true;
    }
  }
  return false;
}
