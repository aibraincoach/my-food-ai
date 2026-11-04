Head reviewed: 6063deb9454ca80202dd687fd3808b918820eea8
Thread: https://www.perplexity.ai/search/d8d6cb03-2085-45ae-ac62-4b86a31a1085
Original request model proof: gemini38flash
Observed selected/footer model: Gemini 3.8 Flash
Observation resumed without resubmission after runner deadline.

Answer
Links
Images
Share
5:20 PM

code review 
 aibraincoach/my-food-ai#485

Finished
14s

This pull request introduces drink glyph icons and displays a "Today" drink timeline row on drink result cards. The implementation is clean and focused, but there are a few edge cases, styling inconsistencies, and potential bugs to address before merging.

Critical Issues and Bugs

Missing dayDrinks mapping in cardDataFromRow / callers:
In src/lib/pipeline/card-data.ts, dayDrinks is passed into cardDataFromRow, but callers using getPostHydrationData need to explicitly map postHydration.dayDrinks to source.dayDrinks. If not wired through where cardDataFromRow is called (e.g. card generator or preview pipeline), card.dayDrinks will be undefined, causing the "Today" glyph row on ResultsCard to render empty.

Potential NaN in SVG size calculation:
In src/components/ResultsCard.tsx:

tsx
size={Math.min(22, 280 / Math.max(1, dayPictures.length)) * scale}

If dayPictures.length is 0 or if scale is undefined or 0, verify edge-case sizing. Furthermore, if dayPictures is empty, an empty container with top text Today may still be rendered or misaligned. Guard with {dayPictures.length > 0 && (...)}.

Microgram vs gram scale for nutrient ID 1018:
In src/lib/pipeline/card-data.ts:

ts
const alcoholG = source.items.reduce((total, item) => ...);

Verify whether nutrient ID 1018 (Alcohol, ethyl) in your USDA/nutrition schema is stored in grams (g) or milligrams/micrograms (mg/mcg). If it is stored in grams, alcoholG / 14 accurately calculates standard US drinks (~14 g alcohol). If nutrient basis values are normalized differently, standard drinks will calculate incorrectly.

Visual and Accessibility Issues

ViewBox aspect ratio mismatch in DrinkPicture:
In src/components/DrinkPicture.tsx, the SVG element specifies width={size} height={size} (1:1 square), but uses viewBox="0 0 24 26" (12:13 aspect ratio). By default, SVG centers with meet preserve-aspect-ratio, leaving subtle letterboxing on the sides. Adjust viewBox="0 0 24 24" or align the path coordinates to 24x24 so icons align consistently.

Missing accessible text for the Today drink row:
The <DrinkPicture> elements in the Today row render SVGs with <title>{glyph}</title>. When multiple cups are rendered (e.g., 8 water cups for 2000 ml), screen readers will announce "water" 8 times in succession. Consider wrapping the list in an element with aria-label={${cups} cups of water} or setting aria-hidden="true" on repetitive timeline items.

Code Style and Consistency

Code formatting and minification:
Lines in src/components/DrinkPicture.tsx, src/lib/intake/drink-glyph.ts, and src/components/ResultsCard.tsx are written without standard spacing (e.g., const paths:Record<DrinkGlyph,string[]>={...}, row=>({glyph:...})). Run prettier or your project's formatter so the diff adheres to the repository's whitespace conventions.

Regex robustness for drink categorization:
In src/lib/intake/drink-glyph.ts:

ts
if (/^water\b/.test(name)) return 'water';

Using ^water\b will match "Water with lemon" but miss "Sparkling water" or "Mineral water". Consider using /\bwater\b/ instead of anchoring to the start of the string.

Testing Recommendations

Add test coverage in tests/drink-glyph.test.mjs for:

Alcohol detection via nutrient ID 1018 in cardDataFromRow.

Non-prefixed water names (e.g., "Sparkling water").

Empty dayDrinks rendering on ResultsCard.

Show me how to fix the dayDrinks mapping
Explain the nutrient ID 1018 alcohol calculation
Review the rest of the PR changes
Check the DrinkPicture SVG viewBox issue
Show me the test cases for this PR
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash