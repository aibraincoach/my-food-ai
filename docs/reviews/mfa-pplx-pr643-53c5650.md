Head at submission: 53c565017d00aad727475832ebea1fd918634fe9
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 24.5s
Elapsed since tab open: 28.1s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/643

Answer
Links
Images
Share
11:08 AM

code review 
 aibraincoach/my-food-ai#643

Finished
14s

PR #643 is already merged and cleanly consolidates servings editing into PostDetailHeader while expanding parseServings to support fractions, unicode glyphs, and 2x shorthands. The main issues to watch are an HTML nesting/layout problem in PostDetailHeader when the editor opens, and an onBlur race between the text input and the action buttons.

Layout and HTML validity in PostDetailHeader

Invalid nesting inside <p>: In src/components/PostDetailHeader.tsx, HeaderServings is rendered inside <p className="truncate text-handle">. When opened, HeaderServings renders a <div> containing <input>, <button>s, and an optional <p role="alert">, which is invalid HTML inside a <p> and can trigger React hydration or DOM-nesting warnings. Changing the outer <p> to a <div> (or moving HeaderServings beside the <p> in a flex row) resolves this.

Fixed header height overflow: PostDetailHeader has a fixed h-[52px] container. The open HeaderServings editor stacks two rows (controls + 5 quick-select chips) plus an optional error message, which will overflow 52px vertically and may clip or overlap on mobile.

Input blur race in HeaderServings

onBlur fires before button onClick: In HeaderServings (src/components/PostDetailHeader.tsx), the <input> calls applyDraft on onBlur. If the user edits the text input and then clicks −, +, a chip, or Done, onBlur runs first:

If draft changed, applyDraft calls submit(next), sets busyRef.current = true, and blocks the subsequent button onClick.

If draft is invalid, applyDraft sets error, which Done immediately clears as it closes.

Fix: Either guard onBlur with a relatedTarget check / onMouseDown={(e) => e.preventDefault()} on the editor buttons, or commit only on Enter / Done.

Fraction parsing and API validation

Recursive x2 / ×2 scaling: In src/lib/posts/servings.ts, parseServings matches /^(.+?)\s*[x×]\s*2\s*$/i and calls parseServings(scaled[1]) recursively. That means chained inputs like "1 x2 x2" evaluate to 4, which is likely unintended; matching once or using a non-recursive helper would prevent chaining.

Mixed-number regex: mixed (/^(\d+(?:\.\d+)?)\s+(\d+\s*\/\s*\d+|[½⅓⅔¼¾⅛])$/) permits decimals before a fraction (e.g., "1.5 1/2" -> 2), which is harmless but unusual compared to ^\d+.

API & test alignment: src/app/api/posts/[id]/servings/route.ts, src/lib/posts/servings.ts, tests/servings-input.test.mjs, and tests/servings.test.mjs are all consistently updated to the 0.1–50 range and two-decimal rounding, and src/components/ServingsControl.tsx is cleanly removed from src/components/PostDetail.tsx.

Show me how to fix the input blur race condition
Write a patch for the HTML nesting issue in PostDetailHeader
Review the fraction and 2x shorthand parsing logic in tests
Check if tests cover the mobile layout overflow in PostDetailHeader
Show me the updated code for PostDetailHeader.tsx
Sources
⠹
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen