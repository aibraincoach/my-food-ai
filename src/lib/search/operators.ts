// Words that change what a question means, not what it matches. A caption that happens
// to contain one ("Breakfast for dinner") must not decide how the question is answered.
const OPERATORS = /\b(breakfast|lunch|dinner|snacks?|big|biggest|large|largest|heaviest|latest|last|most recent|newest|before|after|since|until|between|prior to|earlier than|later than)\b/i;

export function hasSemanticOperator(text: string): boolean {
  return OPERATORS.test(text);
}

export const SEARCH_PAGE_SIZE = 24;
export const SEARCH_HYDRATE_CONCURRENCY = 6;
