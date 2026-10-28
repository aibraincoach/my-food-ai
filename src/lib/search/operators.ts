// Words that change what a question means, not what it matches. A caption that happens
// to contain one ("Breakfast for dinner") must not decide how the question is answered.
const OPERATORS = /\b(breakfast|lunch|dinner|snacks?|big|biggest|large|largest|heaviest|latest|last|most recent|newest|before|after|since|until|between|prior to|earlier than|later than)\b/i;

export function hasSemanticOperator(text: string): boolean {
  return OPERATORS.test(text);
}

export const SEARCH_PAGE_SIZE = 24;
export const SEARCH_HYDRATE_CONCURRENCY = 6;

// Question filler is removed only outside quotation marks: "chicken on the rice" is a phrase the
// reader asked for exactly.
export function stripQuestionWords(text: string): string {
  return text.split(/("[^"]*")/).map((part, index) => index % 2 === 1 ? part : part.replace(/\b(what|did|i|eat|on|at|the|show|me)\b/gi, " ")).join("").replace(/\s+/g, " ").trim();
}
