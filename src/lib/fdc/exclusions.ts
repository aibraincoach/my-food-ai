// Preparation notes (no added fat/salt/sugar) are not missing dish components.
const EXCLUSION = /\b(?:no|without)\s+(?!added\b|salt\b|sugar\b|fat\b)([a-z]+)/gi;
export function excludedComponents(description: string, target: string): string[] {
  const targetExclusions = new Set([...target.matchAll(EXCLUSION)].map(match => match[1].toLowerCase()));
  return [...description.matchAll(EXCLUSION)]
    .filter(match => !targetExclusions.has(match[1].toLowerCase()))
    .map(match => match[0].toLowerCase().replace(/\s+/g, " "));
}
