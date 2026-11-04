// Preparation notes (no added fat/salt/sugar) are not missing dish components.
// Keep a component's full phrase: "hot peppers" and "hot sauce" are different.
// USDA commas/conjunctions delimit the phrase; a target may add "please" or
// other context after an explicitly excluded component.
const EXCLUSION = /\b(?:no|without)\s+(?!added\b|salt\b|sugar\b|fat\b)([a-z]+(?:[\s-]+(?!(?:and|or|with|without|no|but)\b)[a-z]+)*)/gi;
const normalize = (value: string) => value.toLowerCase().replace(/[\s-]+/g, " ");
export function excludedComponents(description: string, target: string): string[] {
  const targetExclusions = [...target.matchAll(EXCLUSION)].map(match => normalize(match[1]));
  return [...description.matchAll(EXCLUSION)]
    .filter(match => {
      const component = normalize(match[1]);
      return !targetExclusions.some(targetComponent => targetComponent === component || targetComponent.startsWith(`${component} `));
    })
    .map(match => match[0].toLowerCase().replace(/\s+/g, " "));
}
