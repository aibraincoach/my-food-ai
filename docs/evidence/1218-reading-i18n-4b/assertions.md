# Original harness assertion audit

Base: `5a99d435d43cc212522135118349a03b9b26e3cd`. The six base files are byte-identical to their pre-hotfix versions. All 24 original tests pass in their original files; no assertion is removed or loosened.

| File / original test | Old assertions | New assertions |
|---|---:|---:|
| tests/capture-entry-load.test.mjs / entry opens a pending sheet before the composer file arrives | 3 | 3 |
| tests/capture-entry-load.test.mjs / a failed file stays visible and only a pressed retry loads again | 7 | 7 |
| tests/capture-entry-load.test.mjs / failed background prefetch is not a loaded composer | 3 | 3 |
| tests/capture-entry-load.test.mjs / reloading after a missing old file requires an explicit press | 3 | 3 |
| tests/capture-entry-load.test.mjs / a new explicit entry request after failure starts a new load | 2 | 2 |
| tests/capture-entry-load.test.mjs / pagehide closes the plus menu without closing an open capture entry | 4 | 4 |
| tests/capture-namespaces.test.mjs / capture routes, the offline shell and their imported client components have all message namespaces | 2 | 2 |
| tests/capture-namespaces.test.mjs / a missing provider namespace fails before a client reaches strict runtime formatting | 1 | 1 |
| tests/capture-namespaces.test.mjs / root sibling consumers have their own namespace scope | 3 | 3 |
| tests/days-intake-ui.test.mjs / StoryPlayer keeps meals, shows failed drinks and reads again only after Try again | 8 | 8 |
| tests/days-intake-ui.test.mjs / month failure keeps meal cells and explicit Try again replaces unavailable state | 5 | 5 |
| tests/days-intake-ui.test.mjs / an older month HTTP failure shows preserved meals and waits for a pressed retry | 6 | 6 |
| tests/days-intake-ui.test.mjs / desktop month view also exposes the unavailable state and a user retry | 4 | 4 |
| tests/desktop-review.test.mjs / Today uses the active zone and ignores older responses even when aborted transport still resolves | 7 | 7 |
| tests/desktop-review.test.mjs / calendar arrow handling leaves rich inputs and controls outside its date grid alone | 1 | 1 |
| tests/desktop-review.test.mjs / post modal dismisses only a click that both starts and ends on its backdrop | 3 | 3 |
| tests/desktop-today-hydration.test.mjs / no-cookie server and first client keep the same empty time span, then use the device zone | 3 | 3 |
| tests/desktop-today-hydration.test.mjs / a cookie zone is the identical snapshot even when server and device zones differ | 3 | 3 |
| tests/desktop-today-hydration.test.mjs / the cookie-free loading placeholder does not format an unknown zone | 2 | 2 |
| tests/i18n-reading-messages.test.mjs / servings English is identical for every existing glyph/decimal form and Japanese keeps quantities | 2 | 2 |
| tests/i18n-reading-messages.test.mjs / counted reading messages keep 0/1/2 and their English wording in each locale | 3 | 3 |
| tests/i18n-reading-messages.test.mjs / drink totals retain exact base sentence and unknown qualifier in all four combinations | 2 | 2 |
| tests/i18n-reading-messages.test.mjs / source graph rejects missing reading namespace '+missing | 1 | 1 |
| tests/i18n-reading-messages.test.mjs / each converted reading file rejects a planted visible literal | 1 | 1 |

The one changed assertion expression supplies `CAPTURE_NAMESPACES.filter(namespace => namespace !== 'capture')` instead of a now-stale literal namespace list. Its expectation remains `/Missing capture-provider namespace capture/`; the count remains one. All other assertion lines are unchanged. Intl/formatter imports and mocks are harness adaptations. The new messages/namespace test file adds independent fixed English/Japanese goldens.
