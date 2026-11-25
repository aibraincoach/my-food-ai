import {checkWording} from '../../src/lib/pipeline/wording-check';

export function wordingLocaleContract() {
  // @ts-expect-error The text's language is required, never defaulted.
  checkWording('A fact.');
  // @ts-expect-error An unsupported language cannot become English implicitly.
  checkWording('A fact.', 'fr');
  checkWording('A fact.', 'en');
  checkWording('ごはんを食べました。', 'ja');
}
