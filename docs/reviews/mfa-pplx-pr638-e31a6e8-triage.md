Triage by coder, head e31a6e8bf0ce73be326e070c157aa9a59379de75, model Gemini 4 Hydrogen (request proof and footer agree).
1. Inverted slowTimer: only starts when initial is provided, so slow never triggers when initial is undefined and the fetch hangs — Real (verified line 15).
2. day in the effect dependency array tears down and re-registers all window listeners on every day change — Real (verified line 17).
3. Retry buttons duplicate the /api/today fetch with no AbortController or unmount guard — Real (minor, verified lines 26-27).
4. Sequential today_summary RPC then getDays await (additive worst case) — Real (minor, verified lines 24,27).
5. summary.pending fetched but never used; posts/fibre/sugar/sodium come from getDays — Real (minor, verified).
6. Macros return 0 instead of null when nutrition is missing — Real (same family as #710, which covers the display rule).
7. Feed hidden-tab backoff reset behavior — Cannot tell (needs runtime observation).
Real findings: 6
