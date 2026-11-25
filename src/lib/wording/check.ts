export type WordingRules = {
  match: 'word' | 'substring';
  banned: string[];
  allow: string[];
  notes: string[];
};

function normalize(text: string, match: WordingRules['match']): string {
  const folded = text.normalize('NFKC').toLowerCase();
  return match === 'substring' ? folded.replace(/\s+/gu, '') : folded.replace(/\s+/gu, ' ');
}

export function wordingRules(value: unknown): WordingRules {
  if (!value || typeof value !== 'object') throw new Error('Invalid wording rules.');
  const rules = value as WordingRules;
  if (!['word', 'substring'].includes(rules.match)
    || ![rules.banned, rules.allow, rules.notes].every(list => Array.isArray(list) && list.every(text => typeof text === 'string' && text.trim()))) {
    throw new Error('Invalid wording rules.');
  }
  if (rules.allow.some(phrase => [...normalize(phrase, rules.match)].length < 2)) throw new Error('Wording allows must be whole phrases.');
  return rules;
}

/** Mask whole approved phrases, longest first, without joining their neighbours. */
export function wordingHits(text: string, rules: WordingRules): string[] {
  let checked = normalize(text, rules.match);
  const allows = rules.allow.map(phrase => normalize(phrase, rules.match)).sort((a, b) => b.length - a.length);
  for (const phrase of allows) checked = checked.split(phrase).join('\uFFFC');
  return rules.banned.filter(phrase => {
    const normalized = normalize(phrase, rules.match);
    if (rules.match === 'substring') return checked.includes(normalized);
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll(' ', '\\s+');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(checked);
  });
}
