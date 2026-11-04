Head at submission: edf8bb5ac26dc2bb058fb91bae1cb721b91a88b0
Model proof: model_preference = gemini38flash
Elapsed since Enter: 44.7s
Elapsed since tab open: 51.7s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/645

Answer
Links
Images
Share
10:59 AM

code review 
 aibraincoach/my-food-ai#645

Finished
27s
Review: request changes

Found one P2 correctness regression in PR #645, reviewed at edf8bb5. The new focus handler checks the card wrapper rather than the element that actually received keyboard focus, so normal Tab navigation through the home feed will not update the card selection.

P2 — Check :focus-visible on the focused descendant, not its wrapper

Location: src/components/DesktopWorkspace.tsx, lines 65–68.

tsx
const card = (event.target as HTMLElement)
  .closest<HTMLElement>('[data-desktop-post]');

if (!card?.dataset.desktopPost || !card.matches(':focus-visible')) return;

The home feed renders [data-desktop-post] on a wrapping <div tabIndex={-1}>. Tab navigates to links and buttons inside that wrapper, not to the wrapper itself. Consequently, even when the focused descendant matches :focus-visible, card.matches(':focus-visible') is false and the handler returns.

This introduces two related failures:

Tabbing into a feed card does not set its data-focused outline, contrary to the PR’s stated test plan.

focused remains null or points to a previously selected card. Pressing J/K after tabbing into another card therefore navigates from stale selection instead of the card containing keyboard focus.

The previous onFocusCapture updated focused whenever a descendant received focus; removing it makes this more than a styling issue. Profile-grid and search-result cards can mask the problem because their [data-desktop-post] elements are themselves links.

Suggested correction:

tsx
const onFocusIn = (event: FocusEvent) => {
  if (!(event.target instanceof HTMLElement)) return;

  const target = event.target;
  const card = target.closest<HTMLElement>('[data-desktop-post]');
  if (!card?.dataset.desktopPost) return;

  setFocused(card.dataset.desktopPost);

  if (target.matches(':focus-visible')) {
    setOutlined(true);
  }
};

This keeps selection synchronized with actual focus while gating the custom outline on the focused element’s keyboard-focus indication. The existing pointerdown handler can continue clearing the outline.

Verification needed

Add a browser regression test using the home feed’s nested controls—not just profile-grid links:

At desktop width, confirm no [data-focused] on initial load.

Tab into a link or button inside a feed card; confirm its enclosing card gets data-focused="true".

Tab into a later card and press J; confirm selection moves to the following card.

Click a non-opening control within a card; confirm the custom outline clears.

Confirm direct-link cards in profile/search still work.

I inspected the diff, surrounding workspace logic, and card markup; I did not run the app or browser tests. The PR reports build/lint passing, but its manual focus test remains unchecked. The only returned GitHub check was “Vercel Preview Comments,” which does not establish focus behavior. No review comments were posted to GitHub.

Show me the complete corrected code for DesktopWorkspace.tsx
How can I write a unit test for this focus behavior
Draft a review comment explaining why this P2 regression occurs
Check if other components have a similar wrapper focus issue
Show me how to use event.relatedTarget to track focus better
⠹
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol