Head at submission: 5f6871f47d843f766e636dae2e7d21abe4a5d8d3
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 23.0s
Elapsed since tab open: 26.6s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/606

Answer
Links
Images
Share
11:23 AM

code review 
 aibraincoach/my-food-ai#606

Finished
13s

PR #606 (feat: type fractional meal servings, already merged) cleanly adds direct decimal input for meal servings with quarter-grid rounding and solid unit test coverage . The implementation is minimal and well-scoped, with a few minor edge cases worth noting around prop synchronization and error messaging.

Component State and UX

In src/components/ServingsControl.tsx, saved and draft are initialized from the servings prop via useState, but they are never synced if servings changes from the parent without unmounting :

Stale local state: If postId changes or a parent refresh delivers an updated servings prop, saved and draft will retain the initial value. Adding a useEffect to sync saved and draft when servings changes (when not busy) prevents this.

Hardcoded bounds in error text: The onBlur validation message hardcodes "Enter a count from 0.25 to 50, in quarters." instead of interpolating MIN_SERVINGS and MAX_SERVINGS, which are already imported .

Blur-before-click behavior: If a user types a new value and immediately clicks + or − without pressing Enter, onBlur triggers submit(next) and sets busyRef.current = true synchronously, causing the button's onClick to be ignored . This safely prevents a double-request, though the user's step click won't apply.

Parsing and Validation

parseServings in src/lib/posts/servings.ts handles normalization and bounds checking cleanly :

Strict format check: Replacing only the first comma (replace(",", ".")) paired with /^(?:\d+(?:\.\d*)?|\.\d+)$/ safely rejects multiple commas (e.g., 1,2,3), negative numbers, hex literals, and trailing text .

Quarter-grid rounding: Math.round(value * 4) / 4 keeps values on the quarter grid, and because MIN_SERVINGS (0.25) and MAX_SERVINGS (50) are multiples of 0.25, rounding cannot push a valid input out of bounds .

Test Coverage

tests/servings-input.test.mjs provides thorough unit coverage for parseServings and stepServings, including decimal commas, leading-dot decimals (.5), whitespace trimming, out-of-bounds values, and non-numeric strings . Note that ServingsControl.tsx itself has no automated component tests in this PR, relying on the manual verification noted in the PR description .

Show me how to fix the stale local state in ServingsControl
Write a unit test for ServingsControl to cover these edge cases
Show me how to interpolate MIN and MAX in the error text
Are there any other edge cases in servings.ts parsing
Review PR #606 security and error handling more deeply
Sources
⠇
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen